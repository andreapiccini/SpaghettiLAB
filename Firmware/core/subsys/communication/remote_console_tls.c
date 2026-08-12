#include "remote_console_internal.h"

#include <errno.h>
#include <stdarg.h>
#include <stdbool.h>
#include <stddef.h>
#include <stdint.h>
#include <stdio.h>
#include <string.h>

#include <mbedtls/ssl_ciphersuites.h>
#include <psa/internal_trusted_storage.h>

#include <zephyr/kernel.h>
#include <zephyr/logging/log_backend.h>
#include <zephyr/logging/log_output.h>
#include <zephyr/net/socket.h>
#include <zephyr/net/tls_credentials.h>
#include <zephyr/sys/atomic.h>
#include <zephyr/sys/reboot.h>
#include <zephyr/sys/util.h>

#include <spaghetti/communication.h>
#include <spaghetti/core.h>
#include <spaghetti/remote_console.h>
#include <spaghetti/secure_workspace.h>
#include <spaghetti/storage.h>

#include "communication_internal.h"

#define SPAGHETTI_REMOTE_CONSOLE_RECORD_UID \
	((psa_storage_uid_t)0x0057FFE2U)
#define SPAGHETTI_REMOTE_CONSOLE_RECORD_MAGIC 0x5352434EU
#define SPAGHETTI_REMOTE_CONSOLE_RECORD_VERSION 1U
#define SPAGHETTI_REMOTE_CONSOLE_TLS_TAG 3
#define SPAGHETTI_REMOTE_CONSOLE_PROMPT "network:~$ "

struct spaghetti_remote_console_record {
	uint32_t magic;
	uint8_t version;
	uint8_t identity_size;
	uint8_t reserved[2];
	uint8_t psk[SPAGHETTI_REMOTE_CONSOLE_PSK_SIZE];
	uint8_t identity[SPAGHETTI_REMOTE_CONSOLE_IDENTITY_MAX_SIZE];
};

struct spaghetti_remote_log_chunk {
	size_t size;
	uint8_t data[CONFIG_SPAGHETTI_REMOTE_CONSOLE_LOG_CHUNK_SIZE];
};

struct spaghetti_remote_console_backend_context {
	struct k_thread listener_thread;
	struct spaghetti_remote_console_record active_record;
	int server_socket;
	int client_socket;
	bool initialized;
	bool credentials_registered;
	bool workspace_acquired;
};

static struct spaghetti_remote_console_backend_context context = {
	.server_socket = -1,
	.client_socket = -1,
};
static atomic_t client_connected;
static atomic_t dropped_log_count;
static atomic_t correlation_id = ATOMIC_INIT(1);
static struct k_work_delayable reboot_work;
K_THREAD_STACK_DEFINE(remote_console_stack,
		      CONFIG_SPAGHETTI_REMOTE_CONSOLE_STACK_SIZE);
K_MSGQ_DEFINE(remote_log_queue, sizeof(struct spaghetti_remote_log_chunk),
	      CONFIG_SPAGHETTI_REMOTE_CONSOLE_LOG_QUEUE_DEPTH, 4);
K_MUTEX_DEFINE(remote_console_backend_lock);

BUILD_ASSERT(sizeof(struct spaghetti_remote_console_record) <=
	     CONFIG_SECURE_STORAGE_ITS_MAX_DATA_SIZE);

static void wipe_sensitive(void *data, size_t data_size)
{
	volatile uint8_t *bytes = data;

	for (size_t byte_idx = 0U; byte_idx < data_size; ++byte_idx) {
		bytes[byte_idx] = 0U;
	}
}

static int map_psa_status(psa_status_t status)
{
	switch (status) {
	case PSA_SUCCESS:
		return 0;
	case PSA_ERROR_DOES_NOT_EXIST:
		return -ENOENT;
	case PSA_ERROR_INSUFFICIENT_STORAGE:
		return -ENOSPC;
	case PSA_ERROR_INVALID_ARGUMENT:
		return -EINVAL;
	case PSA_ERROR_NOT_PERMITTED:
		return -EACCES;
	default:
		return -EIO;
	}
}

static int read_record(struct spaghetti_remote_console_record *record)
{
	size_t record_size = 0U;
	psa_status_t status;

	if (record == NULL) {
		return -EINVAL;
	}
	status = psa_its_get(SPAGHETTI_REMOTE_CONSOLE_RECORD_UID, 0U,
			     sizeof(*record), record, &record_size);
	if (status != PSA_SUCCESS) {
		return map_psa_status(status);
	}
	if ((record_size != sizeof(*record)) ||
	    (record->magic != SPAGHETTI_REMOTE_CONSOLE_RECORD_MAGIC) ||
	    (record->version != SPAGHETTI_REMOTE_CONSOLE_RECORD_VERSION) ||
	    (record->identity_size == 0U) ||
	    (record->identity_size > sizeof(record->identity)) ||
	    (record->reserved[0] != 0U) || (record->reserved[1] != 0U)) {
		wipe_sensitive(record, sizeof(*record));
		return -EBADMSG;
	}
	return 0;
}

static int write_record(
	const struct spaghetti_remote_console_record *record)
{
	return map_psa_status(psa_its_set(
		SPAGHETTI_REMOTE_CONSOLE_RECORD_UID, sizeof(*record), record,
		PSA_STORAGE_FLAG_NONE));
}

static int remote_log_write(uint8_t *data, size_t data_size, void *user_data)
{
	struct spaghetti_remote_log_chunk chunk;

	ARG_UNUSED(user_data);
	if ((atomic_get(&client_connected) == 0) || (data_size == 0U)) {
		return (int)data_size;
	}
	chunk.size = MIN(data_size, sizeof(chunk.data));
	memcpy(chunk.data, data, chunk.size);
	if (k_msgq_put(&remote_log_queue, &chunk, K_NO_WAIT) < 0) {
		struct spaghetti_remote_log_chunk discarded;

		(void)k_msgq_get(&remote_log_queue, &discarded, K_NO_WAIT);
		(void)atomic_inc(&dropped_log_count);
		(void)k_msgq_put(&remote_log_queue, &chunk, K_NO_WAIT);
	}
	return (int)data_size;
}

static uint8_t remote_log_buffer[
	CONFIG_SPAGHETTI_REMOTE_CONSOLE_LOG_CHUNK_SIZE];
LOG_OUTPUT_DEFINE(remote_log_output, remote_log_write, remote_log_buffer,
		  sizeof(remote_log_buffer));

static void remote_log_process(const struct log_backend *backend,
			       union log_msg_generic *message)
{
	const uint32_t flags = LOG_OUTPUT_FLAG_TIMESTAMP |
		LOG_OUTPUT_FLAG_FORMAT_TIMESTAMP | LOG_OUTPUT_FLAG_LEVEL;

	ARG_UNUSED(backend);
	if (atomic_get(&client_connected) == 0) {
		return;
	}
	log_output_msg_process(&remote_log_output, &message->log, flags);
}

static const struct log_backend_api remote_log_backend_api = {
	.process = remote_log_process,
};

LOG_BACKEND_DEFINE(spaghetti_remote_console_log,
		   remote_log_backend_api, true);

static int send_bytes(int socket_fd, const uint8_t *data, size_t data_size)
{
	size_t sent_size = 0U;

	while (sent_size < data_size) {
		const int sent = zsock_send(
			socket_fd, &data[sent_size], data_size - sent_size, 0);

		if (sent <= 0) {
			return (sent == 0) ? -ECONNRESET : -errno;
		}
		sent_size += (size_t)sent;
	}
	return 0;
}

static int send_text(int socket_fd, const char *text)
{
	return send_bytes(socket_fd, (const uint8_t *)text, strlen(text));
}

static int send_format(int socket_fd, const char *format, ...)
{
	char line[CONFIG_SPAGHETTI_REMOTE_CONSOLE_RESPONSE_SIZE];
	va_list args;
	int line_size;

	va_start(args, format);
	line_size = vsnprintf(line, sizeof(line), format, args);
	va_end(args);
	if ((line_size < 0) || ((size_t)line_size >= sizeof(line))) {
		return -EMSGSIZE;
	}
	return send_bytes(socket_fd, (const uint8_t *)line,
			  (size_t)line_size);
}

static int send_status_response(int socket_fd)
{
	const struct spaghetti_request request = {
		.correlation_id = (uint32_t)atomic_inc(&correlation_id),
		.type = SPAGHETTI_REQUEST_GET_STATUS,
	};
	struct spaghetti_communication_status_payload status = {0};
	struct spaghetti_response response;
	int err = spaghetti_communication_handle_request(&request, &response);

	if (err < 0) {
		return send_format(socket_fd, "dispatch failed: %d\n", err);
	}
	if (response.status < 0) {
		return send_format(socket_fd, "correlation=%u status=%d\n",
			response.correlation_id, response.status);
	}
	if ((response.payload_size <
	     offsetof(struct spaghetti_communication_status_payload, modules)) ||
	    (response.payload_size > sizeof(status))) {
		return send_text(socket_fd, "invalid status payload\n");
	}
	memcpy(&status, response.payload, response.payload_size);
	err = send_format(
		socket_fd,
		"correlation=%u status=0 core=%u mode=%u image=%u slot=%u "
		"confirmed=%u version=%s ports=%u modules=%u\n",
		response.correlation_id, status.core_state, status.core_mode,
		status.image_state, status.active_slot, status.image_confirmed,
		status.version, status.port_count, status.module_count);
	if (err < 0) {
		return err;
	}
	for (size_t module_idx = 0U; module_idx < status.module_count;
	     ++module_idx) {
		const struct spaghetti_communication_module_status *module =
			&status.modules[module_idx];

		err = send_format(
			socket_fd,
			"port=%u key=%u id=%u type=%s endpoint=%u:%u state=%u\n",
			module->port_id, module->key, module->runtime_id,
			module->type_id, module->endpoint_kind,
			module->endpoint_value, module->state);
		if (err < 0) {
			return err;
		}
	}
	return 0;
}

static int apply_config(int socket_fd, const char *hex_payload)
{
	struct spaghetti_request request = {
		.correlation_id = (uint32_t)atomic_inc(&correlation_id),
	};
	struct spaghetti_response response;
	int err = spaghetti_communication_shell_decode_hex(
		hex_payload, &request);

	if (err < 0) {
		return send_format(socket_fd, "invalid hex payload: %d\n", err);
	}
	err = spaghetti_communication_handle_request(&request, &response);
	if (err < 0) {
		return send_format(socket_fd, "dispatch failed: %d\n", err);
	}
	return send_format(socket_fd, "correlation=%u status=%d\n",
			   response.correlation_id, response.status);
}

static void reboot_handler(struct k_work *work)
{
	ARG_UNUSED(work);
	sys_reboot(SYS_REBOOT_WARM);
}

static int execute_command(int socket_fd, const char *command)
{
	static const char apply_prefix[] = "spaghetti apply ";
	int err;

	if ((strcmp(command, "spaghetti status") == 0) ||
	    (strcmp(command, "status") == 0)) {
		return send_status_response(socket_fd);
	}
	if (strncmp(command, apply_prefix, sizeof(apply_prefix) - 1U) == 0) {
		return apply_config(socket_fd,
			&command[sizeof(apply_prefix) - 1U]);
	}
	if (strcmp(command, "maintenance reboot") == 0) {
		err = spaghetti_storage_request_maintenance_once();
		if (err < 0) {
			return send_format(socket_fd,
				"maintenance reboot failed: %d\n", err);
		}
		err = send_text(socket_fd, "maintenance reboot scheduled\n");
		if (err == 0) {
			(void)k_work_reschedule(
				&reboot_work,
				K_MSEC(CONFIG_SPAGHETTI_MAINTENANCE_REBOOT_DELAY_MS));
		}
		return err;
	}
	if ((strcmp(command, "help") == 0) || (command[0] == '\0')) {
		return send_text(
			socket_fd,
			"Commands:\n"
			"  spaghetti status\n"
			"  spaghetti apply <config-cbor-hex>\n"
			"  maintenance reboot\n"
			"  help\n");
	}
	return send_text(socket_fd, "unknown command; type help\n");
}

static int send_prompt(int socket_fd, const char *line, size_t line_size)
{
	int err = send_text(socket_fd, SPAGHETTI_REMOTE_CONSOLE_PROMPT);

	if ((err == 0) && (line_size > 0U)) {
		err = send_bytes(socket_fd, (const uint8_t *)line, line_size);
	}
	return err;
}

static int drain_log_queue(int socket_fd, const char *line,
			   size_t line_size)
{
	struct spaghetti_remote_log_chunk chunk;

	while (k_msgq_get(&remote_log_queue, &chunk, K_NO_WAIT) == 0) {
		int err = send_text(socket_fd, "\r\n");

		if (err == 0) {
			err = send_bytes(socket_fd, chunk.data, chunk.size);
		}
		if ((err == 0) && (chunk.size > 0U) &&
		    (chunk.data[chunk.size - 1U] != '\n')) {
			err = send_text(socket_fd, "\n");
		}
		if (err == 0) {
			err = send_prompt(socket_fd, line, line_size);
		}
		if (err < 0) {
			return err;
		}
	}
	return 0;
}

static void close_client(void)
{
	atomic_set(&client_connected, 0);
	if (context.client_socket >= 0) {
		(void)zsock_close(context.client_socket);
		context.client_socket = -1;
	}
	if (context.workspace_acquired) {
		(void)spaghetti_secure_workspace_release(
			SPAGHETTI_SECURE_OWNER_REMOTE_CONSOLE);
		context.workspace_acquired = false;
	}
	k_msgq_purge(&remote_log_queue);
}

static int accept_client(void)
{
	struct net_sockaddr address;
	net_socklen_t address_size = sizeof(address);
	int client;
	int err;

	err = spaghetti_secure_workspace_acquire(
		SPAGHETTI_SECURE_OWNER_REMOTE_CONSOLE, K_NO_WAIT);
	if (err < 0) {
		return err;
	}
	context.workspace_acquired = true;
	client = zsock_accept(
		context.server_socket, &address, &address_size);
	if (client < 0) {
		err = -errno;
		(void)spaghetti_secure_workspace_release(
			SPAGHETTI_SECURE_OWNER_REMOTE_CONSOLE);
		context.workspace_acquired = false;
		return err;
	}
	if (context.client_socket >= 0) {
		(void)zsock_close(client);
		(void)spaghetti_secure_workspace_release(
			SPAGHETTI_SECURE_OWNER_REMOTE_CONSOLE);
		context.workspace_acquired = false;
		return 0;
	}
	context.client_socket = client;
	atomic_set(&client_connected, 1);
	err = send_text(
		client, "Spaghetti LAB authenticated network console\n");
	if (err == 0) {
		err = send_prompt(client, NULL, 0U);
	}
	if (err < 0) {
		close_client();
		return err;
	}
	return 0;
}

static int receive_client_data(char *line, size_t *line_size,
			       int64_t *last_activity_ms)
{
	uint8_t received[64];
	const int received_size = zsock_recv(
		context.client_socket, received, sizeof(received), 0);

	if (received_size <= 0) {
		return (received_size == 0) ? -ECONNRESET : -errno;
	}
	*last_activity_ms = k_uptime_get();
	for (size_t byte_idx = 0U; byte_idx < (size_t)received_size;
	     ++byte_idx) {
		const uint8_t byte = received[byte_idx];

		if (byte == 0x03U) {
			*line_size = 0U;
			if ((send_text(context.client_socket, "^C\r\n") < 0) ||
			    (send_prompt(context.client_socket, NULL, 0U) < 0)) {
				return -ECONNRESET;
			}
			continue;
		}
		if ((byte == 0x08U) || (byte == 0x7fU)) {
			if (*line_size > 0U) {
				--(*line_size);
			}
			continue;
		}
		if ((byte == '\r') || (byte == '\n')) {
			if ((byte == '\n') && (*line_size == 0U)) {
				continue;
			}
			line[*line_size] = '\0';
			if ((send_text(context.client_socket, "\r\n") < 0) ||
			    (execute_command(context.client_socket, line) < 0) ||
			    (send_prompt(context.client_socket, NULL, 0U) < 0)) {
				return -ECONNRESET;
			}
			*line_size = 0U;
			continue;
		}
		if ((byte < 0x20U) || (byte > 0x7eU)) {
			continue;
		}
		if (*line_size >= (CONFIG_SPAGHETTI_REMOTE_CONSOLE_LINE_SIZE - 1U)) {
			*line_size = 0U;
			if ((send_text(context.client_socket,
				       "\r\ncommand too long\n") < 0) ||
			    (send_prompt(context.client_socket, NULL, 0U) < 0)) {
				return -ECONNRESET;
			}
			continue;
		}
		line[*line_size] = (char)byte;
		++(*line_size);
	}
	return 0;
}

static void listener_entry(void *first, void *second, void *third)
{
	char line[CONFIG_SPAGHETTI_REMOTE_CONSOLE_LINE_SIZE];
	size_t line_size = 0U;
	int64_t last_activity_ms = 0;

	ARG_UNUSED(first);
	ARG_UNUSED(second);
	ARG_UNUSED(third);
	while (true) {
		struct zsock_pollfd descriptors[2] = {
			{
				.fd = context.server_socket,
				.events = ZSOCK_POLLIN,
			},
			{
				.fd = context.client_socket,
				.events = (context.client_socket >= 0) ?
					ZSOCK_POLLIN : 0,
			},
		};
		const int event_count = zsock_poll(
			descriptors, ARRAY_SIZE(descriptors),
			CONFIG_SPAGHETTI_REMOTE_CONSOLE_POLL_MS);

		if (event_count < 0) {
			continue;
		}
		if ((descriptors[0].revents & ZSOCK_POLLIN) != 0) {
			const bool was_disconnected = context.client_socket < 0;

			if (accept_client() == 0 && was_disconnected &&
			    (context.client_socket >= 0)) {
				line_size = 0U;
				last_activity_ms = k_uptime_get();
				continue;
			}
		}
		if (context.client_socket < 0) {
			continue;
		}
		const int drain_err = drain_log_queue(
			context.client_socket, line, line_size);

		if (drain_err < 0) {
			close_client();
			continue;
		}
		if ((descriptors[1].revents &
		     (ZSOCK_POLLERR | ZSOCK_POLLHUP | ZSOCK_POLLNVAL)) != 0) {
			close_client();
			continue;
		}
		if ((descriptors[1].revents & ZSOCK_POLLIN) != 0) {
			const int receive_err = receive_client_data(
				line, &line_size, &last_activity_ms);

			if (receive_err < 0) {
				close_client();
				continue;
			}
		}
		if ((k_uptime_get() - last_activity_ms) >=
		    CONFIG_SPAGHETTI_REMOTE_CONSOLE_IDLE_TIMEOUT_MS) {
			(void)send_text(context.client_socket,
				       "\r\nsession timed out\n");
			close_client();
		}
	}
}

static int register_credentials(void)
{
	int err = tls_credential_add(
		SPAGHETTI_REMOTE_CONSOLE_TLS_TAG, TLS_CREDENTIAL_PSK,
		context.active_record.psk, sizeof(context.active_record.psk));

	if (err < 0) {
		return err;
	}
	err = tls_credential_add(
		SPAGHETTI_REMOTE_CONSOLE_TLS_TAG, TLS_CREDENTIAL_PSK_ID,
		context.active_record.identity,
		context.active_record.identity_size);
	if (err < 0) {
		(void)tls_credential_delete(
			SPAGHETTI_REMOTE_CONSOLE_TLS_TAG, TLS_CREDENTIAL_PSK);
		return err;
	}
	context.credentials_registered = true;
	return 0;
}

static void unregister_credentials(void)
{
	if (context.credentials_registered) {
		(void)tls_credential_delete(
			SPAGHETTI_REMOTE_CONSOLE_TLS_TAG, TLS_CREDENTIAL_PSK_ID);
		(void)tls_credential_delete(
			SPAGHETTI_REMOTE_CONSOLE_TLS_TAG, TLS_CREDENTIAL_PSK);
		context.credentials_registered = false;
	}
	wipe_sensitive(&context.active_record, sizeof(context.active_record));
}

int spaghetti_remote_console_backend_init(void)
{
	if (context.initialized) {
		return -EALREADY;
	}
	k_work_init_delayable(&reboot_work, reboot_handler);
	atomic_set(&client_connected, 0);
	atomic_set(&dropped_log_count, 0);
	context.initialized = true;
	return 0;
}

int spaghetti_remote_console_backend_has_credentials(bool *present)
{
	struct spaghetti_remote_console_record record;
	int err;

	if (present == NULL) {
		return -EINVAL;
	}
	err = read_record(&record);
	if (err == -ENOENT) {
		*present = false;
		return 0;
	}
	if (err < 0) {
		return err;
	}
	*present = true;
	wipe_sensitive(&record, sizeof(record));
	return 0;
}

int spaghetti_remote_console_backend_set_credentials(
	const uint8_t *psk, size_t psk_size,
	const uint8_t *identity, size_t identity_size)
{
	struct spaghetti_remote_console_record record = {
		.magic = SPAGHETTI_REMOTE_CONSOLE_RECORD_MAGIC,
		.version = SPAGHETTI_REMOTE_CONSOLE_RECORD_VERSION,
		.identity_size = identity_size,
	};
	int err;

	if ((psk == NULL) || (psk_size != sizeof(record.psk)) ||
	    (identity == NULL) || (identity_size == 0U) ||
	    (identity_size > sizeof(record.identity))) {
		return -EINVAL;
	}
	memcpy(record.psk, psk, psk_size);
	memcpy(record.identity, identity, identity_size);
	err = write_record(&record);
	wipe_sensitive(&record, sizeof(record));
	return err;
}

int spaghetti_remote_console_backend_clear_credentials(void)
{
	return map_psa_status(
		psa_its_remove(SPAGHETTI_REMOTE_CONSOLE_RECORD_UID));
}

int spaghetti_remote_console_backend_open(void)
{
	struct net_sockaddr_in address = {
		.sin_family = NET_AF_INET,
		.sin_port = net_htons(CONFIG_SPAGHETTI_REMOTE_CONSOLE_PORT),
		.sin_addr = {
			.s_addr = net_htonl(NET_INADDR_ANY),
		},
	};
	sec_tag_t tags[] = {SPAGHETTI_REMOTE_CONSOLE_TLS_TAG};
	int ciphersuites[] = {
		MBEDTLS_TLS_PSK_WITH_AES_128_GCM_SHA256,
	};
	int reuse_address = 1;
	int err = k_mutex_lock(&remote_console_backend_lock, K_FOREVER);

	if (err < 0) {
		return err;
	}
	if (!context.initialized) {
		err = -EACCES;
		goto unlock;
	}
	if (context.server_socket >= 0) {
		err = -EALREADY;
		goto unlock;
	}
	err = read_record(&context.active_record);
	if (err < 0) {
		goto unlock;
	}
	err = register_credentials();
	if (err < 0) {
		goto cleanup;
	}
	context.server_socket = zsock_socket(
		NET_AF_INET, NET_SOCK_STREAM, NET_IPPROTO_TLS_1_2);
	if (context.server_socket < 0) {
		err = -errno;
		goto cleanup;
	}
	if ((zsock_setsockopt(context.server_socket, ZSOCK_SOL_SOCKET,
			       ZSOCK_SO_REUSEADDR, &reuse_address,
			       sizeof(reuse_address)) < 0) ||
	    (zsock_setsockopt(context.server_socket, ZSOCK_SOL_TLS,
			       ZSOCK_TLS_SEC_TAG_LIST,
			       tags, sizeof(tags)) < 0) ||
	    (zsock_setsockopt(context.server_socket, ZSOCK_SOL_TLS,
			       ZSOCK_TLS_CIPHERSUITE_LIST,
			       ciphersuites, sizeof(ciphersuites)) < 0) ||
	    (zsock_bind(context.server_socket,
			(struct net_sockaddr *)&address, sizeof(address)) < 0) ||
	    (zsock_listen(context.server_socket, 1) < 0)) {
		err = -errno;
		goto cleanup;
	}
	k_thread_create(
		&context.listener_thread, remote_console_stack,
		K_THREAD_STACK_SIZEOF(remote_console_stack), listener_entry,
		NULL, NULL, NULL, CONFIG_SPAGHETTI_REMOTE_CONSOLE_PRIORITY,
		0, K_NO_WAIT);
	(void)k_thread_name_set(
		&context.listener_thread, "spaghetti_remote");
	err = 0;
	goto unlock;

cleanup:
	if (context.server_socket >= 0) {
		(void)zsock_close(context.server_socket);
		context.server_socket = -1;
	}
	unregister_credentials();
unlock:
	k_mutex_unlock(&remote_console_backend_lock);
	return err;
}

bool spaghetti_remote_console_backend_client_connected(void)
{
	return atomic_get(&client_connected) != 0;
}

uint32_t spaghetti_remote_console_backend_dropped_logs(void)
{
	return (uint32_t)atomic_get(&dropped_log_count);
}
