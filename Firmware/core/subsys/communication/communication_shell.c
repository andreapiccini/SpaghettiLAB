#include "communication_internal.h"

#include <errno.h>
#include <stddef.h>
#include <stdint.h>
#include <string.h>

#include <zephyr/shell/shell.h>
#include <zephyr/sys/atomic.h>
#include <zephyr/sys/util.h>

static atomic_t next_correlation_id;

static int hex_nibble(char character, uint8_t *out)
{
	if (out == NULL) {
		return -EINVAL;
	}
	if ((character >= '0') && (character <= '9')) {
		*out = (uint8_t)(character - '0');
		return 0;
	}
	if ((character >= 'a') && (character <= 'f')) {
		*out = (uint8_t)(character - 'a' + 10);
		return 0;
	}
	if ((character >= 'A') && (character <= 'F')) {
		*out = (uint8_t)(character - 'A' + 10);
		return 0;
	}

	return -EINVAL;
}

int spaghetti_communication_shell_decode_hex(
	const char *hex,
	struct spaghetti_request *request)
{
	struct spaghetti_request decoded = {0};
	size_t hex_size;

	if ((hex == NULL) || (request == NULL)) {
		return -EINVAL;
	}

	hex_size = strlen(hex);
	if ((hex_size == 0U) || ((hex_size % 2U) != 0U)) {
		return -EINVAL;
	}
	if (hex_size > (SPAGHETTI_COMM_PAYLOAD_MAX * 2U)) {
		return -EMSGSIZE;
	}

	decoded.correlation_id = request->correlation_id;
	decoded.type = SPAGHETTI_REQUEST_SET_CONFIG;
	decoded.payload_size = hex_size / 2U;
	for (size_t byte_idx = 0U; byte_idx < decoded.payload_size; ++byte_idx) {
		uint8_t high;
		uint8_t low;
		int err = hex_nibble(hex[byte_idx * 2U], &high);

		if (err < 0) {
			return err;
		}
		err = hex_nibble(hex[(byte_idx * 2U) + 1U], &low);
		if (err < 0) {
			return err;
		}
		decoded.payload[byte_idx] = (uint8_t)((high << 4U) | low);
	}

	*request = decoded;
	return 0;
}

static uint32_t allocate_correlation_id(void)
{
	return (uint32_t)atomic_inc(&next_correlation_id);
}

static int cmd_status(const struct shell *shell, size_t argc, char **argv)
{
	const struct spaghetti_request request = {
		.correlation_id = allocate_correlation_id(),
		.type = SPAGHETTI_REQUEST_GET_STATUS,
	};
	struct spaghetti_communication_status_payload status = {0};
	struct spaghetti_response response;
	int err;

	ARG_UNUSED(argv);
	if (argc != 1U) {
		shell_error(shell, "usage: spaghetti status");
		return -EINVAL;
	}

	err = spaghetti_communication_handle_request(&request, &response);
	if (err < 0) {
		shell_error(shell, "dispatch failed: %d", err);
		return err;
	}
	if (response.status < 0) {
		shell_error(shell, "correlation=%u status=%d",
			    response.correlation_id, response.status);
		return 0;
	}
	if ((response.payload_size <
	     offsetof(struct spaghetti_communication_status_payload, modules)) ||
	    (response.payload_size > sizeof(status))) {
		shell_error(shell, "invalid status payload: %u",
			    (uint32_t)response.payload_size);
		return -EBADMSG;
	}

	memcpy(&status, response.payload, response.payload_size);
	shell_print(shell, "correlation=%u status=0 core=%u ports=%u modules=%u",
		    response.correlation_id, status.core_state, status.port_count,
		    status.module_count);
	for (size_t module_idx = 0U; module_idx < status.module_count;
	     ++module_idx) {
		const struct spaghetti_communication_module_status *module =
			&status.modules[module_idx];

		shell_print(shell,
			    "port=%u key=%u id=%u type=%s endpoint=%u:%u state=%u",
			    module->port_id, module->key, module->runtime_id,
			    module->type_id, module->endpoint_kind,
			    module->endpoint_value, module->state);
	}

	return 0;
}

static int cmd_apply(const struct shell *shell, size_t argc, char **argv)
{
	struct spaghetti_request request = {
		.correlation_id = allocate_correlation_id(),
	};
	struct spaghetti_response response;
	int err;

	if (argc != 2U) {
		shell_error(shell, "usage: spaghetti apply <hex>");
		return -EINVAL;
	}

	err = spaghetti_communication_shell_decode_hex(argv[1], &request);
	if (err < 0) {
		shell_error(shell, "invalid hex payload: %d", err);
		return err;
	}

	err = spaghetti_communication_handle_request(&request, &response);
	if (err < 0) {
		shell_error(shell, "dispatch failed: %d", err);
		return err;
	}

	shell_print(shell, "correlation=%u status=%d",
		    response.correlation_id, response.status);
	return 0;
}

SHELL_STATIC_SUBCMD_SET_CREATE(
	spaghetti_subcommands,
	SHELL_CMD(status, NULL, "Mostra Core, Port e Module", cmd_status),
	SHELL_CMD(apply, NULL, "Invia Config codificata come hex", cmd_apply),
	SHELL_SUBCMD_SET_END
);

SHELL_CMD_REGISTER(spaghetti, &spaghetti_subcommands,
		   "Comandi Spaghetti LAB", NULL);

int spaghetti_communication_shell_init(void)
{
	atomic_set(&next_correlation_id, 1);
	return 0;
}
