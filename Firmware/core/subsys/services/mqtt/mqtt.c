#include <spaghetti/mqtt.h>

#include <errno.h>
#include <inttypes.h>
#include <stdbool.h>
#include <stddef.h>
#include <stdint.h>
#include <stdio.h>
#include <string.h>

#include <zephyr/kernel.h>
#include <zephyr/logging/log.h>
#include <zephyr/net/mqtt.h>
#include <zephyr/net/net_event.h>
#include <zephyr/net/net_ip.h>
#include <zephyr/net/net_mgmt.h>
#include <zephyr/net/socket.h>
#include <zephyr/sys/atomic.h>
#include <zephyr/sys/util.h>
#include <zephyr/zbus/zbus.h>

#include <spaghetti/data.h>

#include "mqtt_internal.h"
#include "../service_thread.h"

LOG_MODULE_REGISTER(spaghetti_mqtt, CONFIG_SPAGHETTI_MQTT_LOG_LEVEL);

#define SPAGHETTI_MQTT_COMMAND_QUEUE_DEPTH 2U
#define SPAGHETTI_MQTT_CLIENT_BUFFER_SIZE 512U
#define SPAGHETTI_MQTT_FULL_TOPIC_SIZE \
	(SPAGHETTI_MQTT_TOPIC_SIZE + SPAGHETTI_MQTT_TOPIC_SUFFIX_SIZE)
#define SPAGHETTI_MQTT_POLL_MS 100
#define SPAGHETTI_MQTT_CONNACK_TIMEOUT_MS 1000
#define SPAGHETTI_MQTT_RECONNECT_MIN_MS 1000U
#define SPAGHETTI_MQTT_RECONNECT_MAX_MS 30000U

enum spaghetti_mqtt_command {
	SPAGHETTI_MQTT_COMMAND_START,
	SPAGHETTI_MQTT_COMMAND_STOP,
};

struct spaghetti_mqtt_context {
	struct spaghetti_mqtt_config config;
	struct spaghetti_mqtt_status status;
	struct mqtt_client client;
	struct sockaddr_storage broker;
	uint8_t rx_buffer[SPAGHETTI_MQTT_CLIENT_BUFFER_SIZE];
	uint8_t tx_buffer[SPAGHETTI_MQTT_CLIENT_BUFFER_SIZE];
	uint32_t reconnect_delay_ms;
	int64_t next_connect_ms;
	bool initialized;
	bool started;
	bool client_active;
	bool network_callback_registered;
};

static struct spaghetti_mqtt_context context;
static struct net_mgmt_event_callback network_callback;
static atomic_t network_is_ready;
static atomic_t client_is_connected;
static atomic_t connection_error;
static atomic_t stop_requested;
static struct spaghetti_service_thread mqtt_worker_thread;
static struct spaghetti_service_thread mqtt_adapter_thread;
K_MUTEX_DEFINE(mqtt_lock);
K_SEM_DEFINE(network_event_sem, 0, 1);
K_MSGQ_DEFINE(command_queue, sizeof(enum spaghetti_mqtt_command),
	      SPAGHETTI_MQTT_COMMAND_QUEUE_DEPTH, __alignof__(enum spaghetti_mqtt_command));
K_MSGQ_DEFINE(publication_queue, sizeof(struct spaghetti_mqtt_publication),
	      CONFIG_SPAGHETTI_MQTT_QUEUE_DEPTH,
	      __alignof__(struct spaghetti_mqtt_publication));

ZBUS_CHAN_DECLARE(spaghetti_record_chan);
ZBUS_OBS_DECLARE(record_mqtt_subscriber);

static bool bounded_string_is_valid(const char *value, size_t capacity,
				    bool may_be_empty)
{
	const char *terminator = memchr(value, '\0', capacity);

	if (terminator == NULL) {
		return false;
	}
	if (!may_be_empty && (terminator == value)) {
		return false;
	}

	return true;
}

static bool config_is_valid(const struct spaghetti_mqtt_config *config)
{
	if (config == NULL) {
		return false;
	}
	if (!config->enabled) {
		return (config->host[0] == '\0') && (config->port == 0U) &&
		       (config->base_topic[0] == '\0');
	}
	if (!bounded_string_is_valid(config->host, sizeof(config->host), false) ||
	    !bounded_string_is_valid(config->base_topic,
				     sizeof(config->base_topic), false) ||
	    (config->port == 0U)) {
		return false;
	}

	const size_t base_topic_len = strlen(config->base_topic);

	return (config->base_topic[0] != '/') &&
	       (config->base_topic[base_topic_len - 1U] != '/');
}

static bool publication_is_valid(
	const struct spaghetti_mqtt_publication *publication)
{
	if ((publication == NULL) ||
	    !bounded_string_is_valid(publication->topic_suffix,
				     sizeof(publication->topic_suffix), false) ||
	    (publication->payload_size == 0U) ||
	    (publication->payload_size > sizeof(publication->payload))) {
		return false;
	}

	const size_t suffix_len = strlen(publication->topic_suffix);

	return (publication->topic_suffix[0] != '/') &&
	       (publication->topic_suffix[suffix_len - 1U] != '/');
}

static void set_status(enum spaghetti_mqtt_state state, int error)
{
	(void)k_mutex_lock(&mqtt_lock, K_FOREVER);
	context.status.state = state;
	context.status.last_error = error;
	k_mutex_unlock(&mqtt_lock);
}

static void mqtt_event_handler(struct mqtt_client *client,
			       const struct mqtt_evt *event)
{
	ARG_UNUSED(client);

	switch (event->type) {
	case MQTT_EVT_CONNACK:
		if ((event->result == 0) &&
		    (event->param.connack.return_code ==
		     MQTT_CONNECTION_ACCEPTED)) {
			atomic_set(&client_is_connected, 1);
			atomic_set(&connection_error, 0);
		} else {
			atomic_set(&connection_error,
				   (event->result < 0) ? event->result :
							 -ECONNREFUSED);
		}
		break;
	case MQTT_EVT_DISCONNECT:
		atomic_set(&client_is_connected, 0);
		atomic_set(&connection_error,
			   (event->result < 0) ? event->result : -ENOTCONN);
		break;
	default:
		break;
	}
}

static void network_event_handler(struct net_mgmt_event_callback *callback,
				  uint64_t event, struct net_if *iface)
{
	ARG_UNUSED(callback);
	ARG_UNUSED(iface);

	if (event == NET_EVENT_IPV4_ADDR_ADD) {
		atomic_set(&network_is_ready, 1);
		k_sem_give(&network_event_sem);
	} else if (event == NET_EVENT_IPV4_ADDR_DEL) {
		atomic_set(&network_is_ready, 0);
		k_sem_give(&network_event_sem);
	}
}

static int resolve_broker(void)
{
	struct zsock_addrinfo hints = {
		.ai_family = AF_INET,
		.ai_socktype = SOCK_STREAM,
		.ai_protocol = IPPROTO_TCP,
	};
	struct zsock_addrinfo *result;
	char port_text[6];
	int text_size = snprintf(port_text, sizeof(port_text), "%u",
				 (uint32_t)context.config.port);

	if ((text_size <= 0) || ((size_t)text_size >= sizeof(port_text))) {
		return -EINVAL;
	}

	int err = zsock_getaddrinfo(context.config.host, port_text, &hints,
				   &result);

	if (err != 0) {
		return -EHOSTUNREACH;
	}
	if ((result == NULL) || (result->ai_addr == NULL) ||
	    (result->ai_addrlen > sizeof(context.broker))) {
		zsock_freeaddrinfo(result);
		return -EADDRNOTAVAIL;
	}

	memset(&context.broker, 0, sizeof(context.broker));
	memcpy(&context.broker, result->ai_addr, result->ai_addrlen);
	zsock_freeaddrinfo(result);
	return 0;
}

static void initialize_client(void)
{
	static const uint8_t client_id[] = "spaghetti-lab";

	mqtt_client_init(&context.client);
	context.client.broker = &context.broker;
	context.client.evt_cb = mqtt_event_handler;
	context.client.client_id.utf8 = (uint8_t *)client_id;
	context.client.client_id.size = sizeof(client_id) - 1U;
	context.client.protocol_version = MQTT_VERSION_3_1_1;
	context.client.rx_buf = context.rx_buffer;
	context.client.rx_buf_size = sizeof(context.rx_buffer);
	context.client.tx_buf = context.tx_buffer;
	context.client.tx_buf_size = sizeof(context.tx_buffer);
	context.client.transport.type = MQTT_TRANSPORT_NON_SECURE;
}

static void disconnect_client(void)
{
	if (!context.client_active) {
		return;
	}

	if (atomic_get(&client_is_connected) != 0) {
		(void)mqtt_disconnect(&context.client, NULL);
	} else {
		(void)mqtt_abort(&context.client);
	}
	atomic_set(&client_is_connected, 0);
	context.client_active = false;
}

static int connect_client(void)
{
	struct zsock_pollfd socket_poll = {
		.events = ZSOCK_POLLIN,
	};
	const int64_t deadline_ms =
		k_uptime_get() + SPAGHETTI_MQTT_CONNACK_TIMEOUT_MS;
	int err = resolve_broker();

	if (err < 0) {
		return err;
	}

	initialize_client();
	atomic_set(&client_is_connected, 0);
	atomic_set(&connection_error, 0);
	err = mqtt_connect(&context.client);
	if (err < 0) {
		return err;
	}
	context.client_active = true;
	socket_poll.fd = context.client.transport.tcp.sock;

	while ((atomic_get(&client_is_connected) == 0) &&
	       (k_uptime_get() < deadline_ms)) {
		err = zsock_poll(&socket_poll, 1, SPAGHETTI_MQTT_POLL_MS);
		if (err < 0) {
			err = -errno;
			goto abort;
		}
		if ((err > 0) && ((socket_poll.revents & ZSOCK_POLLIN) != 0)) {
			err = mqtt_input(&context.client);
			if (err < 0) {
				goto abort;
			}
		}
		if (atomic_get(&connection_error) < 0) {
			err = (int)atomic_get(&connection_error);
			goto abort;
		}
	}

	if (atomic_get(&client_is_connected) == 0) {
		err = -ETIMEDOUT;
		goto abort;
	}

	return 0;

abort:
	disconnect_client();
	return err;
}

static int build_full_topic(const char *suffix, char *topic, size_t capacity)
{
	const int topic_size = snprintf(topic, capacity, "%s/%s",
					context.config.base_topic, suffix);

	if ((topic_size <= 0) || ((size_t)topic_size >= capacity)) {
		return -EMSGSIZE;
	}

	return topic_size;
}

static int publish_one(const struct spaghetti_mqtt_publication *publication)
{
	char topic[SPAGHETTI_MQTT_FULL_TOPIC_SIZE];
	struct mqtt_publish_param parameters = {0};
	int topic_size = build_full_topic(publication->topic_suffix, topic,
					  sizeof(topic));

	if (topic_size < 0) {
		return topic_size;
	}

	parameters.message.topic.topic.utf8 = (uint8_t *)topic;
	parameters.message.topic.topic.size = (uint32_t)topic_size;
	parameters.message.topic.qos = MQTT_QOS_0_AT_MOST_ONCE;
	parameters.message.payload.data = (uint8_t *)publication->payload;
	parameters.message.payload.len = publication->payload_size;
	parameters.message_id = 0U;
	parameters.dup_flag = 0U;
	parameters.retain_flag = 0U;
	return mqtt_publish(&context.client, &parameters);
}

static int service_connected_client(void)
{
	struct zsock_pollfd socket_poll = {
		.fd = context.client.transport.tcp.sock,
		.events = ZSOCK_POLLIN,
	};
	struct spaghetti_mqtt_publication publication;
	int err = zsock_poll(&socket_poll, 1, SPAGHETTI_MQTT_POLL_MS);

	if (err < 0) {
		return -errno;
	}
	if ((err > 0) && ((socket_poll.revents & ZSOCK_POLLIN) != 0)) {
		err = mqtt_input(&context.client);
		if (err < 0) {
			return err;
		}
	}

	err = mqtt_live(&context.client);
	if ((err < 0) && (err != -EAGAIN)) {
		return err;
	}

	err = k_msgq_get(&publication_queue, &publication, K_NO_WAIT);
	if (err == -ENOMSG) {
		return 0;
	}
	if (err < 0) {
		return err;
	}

	err = publish_one(&publication);
	(void)k_mutex_lock(&mqtt_lock, K_FOREVER);
	if (err == 0) {
		++context.status.published;
	} else {
		++context.status.dropped;
		context.status.last_error = err;
	}
	k_mutex_unlock(&mqtt_lock);
	return err;
}

static void process_command(enum spaghetti_mqtt_command command)
{
	if (command == SPAGHETTI_MQTT_COMMAND_START) {
		context.reconnect_delay_ms = SPAGHETTI_MQTT_RECONNECT_MIN_MS;
		context.next_connect_ms = 0;
		return;
	}

	disconnect_client();
	k_msgq_purge(&publication_queue);
	(void)k_mutex_lock(&mqtt_lock, K_FOREVER);
	context.started = false;
	context.status.state = SPAGHETTI_MQTT_STOPPED;
	k_mutex_unlock(&mqtt_lock);
}

static void mqtt_worker_thread_entry(void *first, void *second, void *third)
{
	ARG_UNUSED(first);
	ARG_UNUSED(second);
	ARG_UNUSED(third);

	while (atomic_get(&stop_requested) == 0) {
		enum spaghetti_mqtt_command command;

		if (k_msgq_get(&command_queue, &command,
				  K_MSEC(SPAGHETTI_MQTT_POLL_MS)) == 0) {
			process_command(command);
			if (command == SPAGHETTI_MQTT_COMMAND_STOP) {
				break;
			}
		}

		(void)k_mutex_lock(&mqtt_lock, K_FOREVER);
		const bool should_run = context.started;
		k_mutex_unlock(&mqtt_lock);
		if (!should_run) {
			continue;
		}

		if (atomic_get(&network_is_ready) == 0) {
			disconnect_client();
			set_status(SPAGHETTI_MQTT_WAIT_NETWORK, 0);
			(void)k_sem_take(&network_event_sem, K_NO_WAIT);
			continue;
		}

		if (atomic_get(&client_is_connected) == 0) {
			const int64_t now_ms = k_uptime_get();

			if (now_ms < context.next_connect_ms) {
				continue;
			}

			const int err = connect_client();

			if (err < 0) {
				set_status(SPAGHETTI_MQTT_ERROR, err);
				context.next_connect_ms = k_uptime_get() +
					context.reconnect_delay_ms;
				context.reconnect_delay_ms = MIN(
					context.reconnect_delay_ms * 2U,
					SPAGHETTI_MQTT_RECONNECT_MAX_MS);
				continue;
			}

			context.reconnect_delay_ms =
				SPAGHETTI_MQTT_RECONNECT_MIN_MS;
			set_status(SPAGHETTI_MQTT_CONNECTED, 0);
			LOG_INF("connected");
		}

		const int err = service_connected_client();

		if (err < 0) {
			disconnect_client();
			set_status(SPAGHETTI_MQTT_ERROR, err);
			context.next_connect_ms = k_uptime_get() +
				context.reconnect_delay_ms;
			context.reconnect_delay_ms = MIN(
				context.reconnect_delay_ms * 2U,
				SPAGHETTI_MQTT_RECONNECT_MAX_MS);
		}
	}
	disconnect_client();
	k_msgq_purge(&publication_queue);
	(void)k_mutex_lock(&mqtt_lock, K_FOREVER);
	context.started = false;
	context.status.state = SPAGHETTI_MQTT_STOPPED;
	k_mutex_unlock(&mqtt_lock);
}

int spaghetti_mqtt_format_record(
	const struct spaghetti_record *record,
	struct spaghetti_mqtt_publication *out)
{
	struct spaghetti_mqtt_publication publication = {0};
	int text_size;

	if ((record == NULL) || (out == NULL)) {
		return -EINVAL;
	}

	text_size = snprintf(publication.topic_suffix,
			     sizeof(publication.topic_suffix),
			     "modules/%" PRIu32 "/records",
			     (uint32_t)record->source_key);
	if ((text_size <= 0) ||
	    ((size_t)text_size >= sizeof(publication.topic_suffix))) {
		return -EMSGSIZE;
	}

	text_size = snprintf(
		(char *)publication.payload, sizeof(publication.payload),
		"{\"module_key\":%" PRIu32 ",\"schema\":\"%s\",\"version\":%"
		PRIu16 ",\"boot_id\":%" PRIu64 ",\"sequence\":%" PRIu32 "}",
		(uint32_t)record->source_key, record->payload.schema_id,
		record->payload.schema_version, record->boot_id,
		record->sequence);
	if ((text_size <= 0) ||
	    ((size_t)text_size >= sizeof(publication.payload))) {
		return -EMSGSIZE;
	}

	publication.payload_size = (size_t)text_size;
	*out = publication;
	return 0;
}

static void mqtt_adapter_thread_entry(void *first, void *second, void *third)
{
	const struct zbus_channel *channel;
	struct spaghetti_record record;

	ARG_UNUSED(first);
	ARG_UNUSED(second);
	ARG_UNUSED(third);

	while (atomic_get(&stop_requested) == 0) {
		int err = zbus_sub_wait_msg(&record_mqtt_subscriber,
					    &channel, &record,
					    K_MSEC(SPAGHETTI_MQTT_POLL_MS));

		if (err < 0) {
			if (err == -EAGAIN) {
				continue;
			}
			LOG_ERR("Data receive failed: err=%d", err);
			continue;
		}
		if (channel != &spaghetti_record_chan) {
			LOG_ERR("unexpected Data channel");
			continue;
		}

		struct spaghetti_mqtt_publication publication;

		err = spaghetti_mqtt_format_record(&record, &publication);
		if (err == 0) {
			err = spaghetti_mqtt_publish(&publication);
		}
		if ((err < 0) && (err != -EACCES) && (err != -ENOMSG)) {
			LOG_WRN("record rejected: key=%u err=%d",
				record.source_key, err);
		}
	}
}

int spaghetti_mqtt_init(const struct spaghetti_mqtt_config *config)
{
	int err;

	if (!config_is_valid(config)) {
		return -EINVAL;
	}

	err = k_mutex_lock(&mqtt_lock, K_FOREVER);
	if (err < 0) {
		return err;
	}
	if (context.initialized &&
	    ((context.status.state != SPAGHETTI_MQTT_STOPPED) ||
	     (mqtt_worker_thread.stack != NULL) ||
	     (mqtt_adapter_thread.stack != NULL))) {
		k_mutex_unlock(&mqtt_lock);
		return -EBUSY;
	}

	err = zbus_obs_set_enable(&record_mqtt_subscriber, false);
	if (err < 0) {
		k_mutex_unlock(&mqtt_lock);
		return -EIO;
	}

	k_msgq_purge(&publication_queue);
	k_msgq_purge(&command_queue);
	context.config = *config;
	context.status = (struct spaghetti_mqtt_status) {
		.state = SPAGHETTI_MQTT_STOPPED,
	};
	context.started = false;
	context.reconnect_delay_ms = SPAGHETTI_MQTT_RECONNECT_MIN_MS;
	context.next_connect_ms = 0;
	context.initialized = true;
	k_mutex_unlock(&mqtt_lock);

	LOG_INF("ready: enabled=%u", config->enabled ? 1U : 0U);
	return 0;
}

int spaghetti_mqtt_start(void)
{
	const enum spaghetti_mqtt_command command =
		SPAGHETTI_MQTT_COMMAND_START;
	int err = k_mutex_lock(&mqtt_lock, K_FOREVER);

	if (err < 0) {
		return err;
	}
	if (!context.initialized || !context.config.enabled) {
		k_mutex_unlock(&mqtt_lock);
		return -EACCES;
	}
	if (context.started) {
		k_mutex_unlock(&mqtt_lock);
		return -EALREADY;
	}

	err = zbus_obs_set_enable(&record_mqtt_subscriber, true);
	if (err < 0) {
		k_mutex_unlock(&mqtt_lock);
		return -EIO;
	}
	if (!context.network_callback_registered) {
		net_mgmt_init_event_callback(
			&network_callback, network_event_handler,
			NET_EVENT_IPV4_ADDR_ADD | NET_EVENT_IPV4_ADDR_DEL);
		net_mgmt_add_event_callback(&network_callback);
		context.network_callback_registered = true;
	}
	atomic_set(&stop_requested, 0);
	err = k_msgq_put(&command_queue, &command, K_NO_WAIT);
	if (err < 0) {
		k_mutex_unlock(&mqtt_lock);
		return -ENOMSG;
	}
	context.started = true;
	context.status.state = SPAGHETTI_MQTT_WAIT_NETWORK;
	context.status.last_error = 0;
	k_mutex_unlock(&mqtt_lock);

	err = spaghetti_service_thread_start(
		&mqtt_worker_thread, CONFIG_SPAGHETTI_MQTT_WORKER_STACK_SIZE,
		mqtt_worker_thread_entry, NULL, NULL, NULL,
		CONFIG_SPAGHETTI_MQTT_PRIORITY, "spaghetti_mqtt");
	if (err == 0) {
		err = spaghetti_service_thread_start(
			&mqtt_adapter_thread,
			CONFIG_SPAGHETTI_MQTT_ADAPTER_STACK_SIZE,
			mqtt_adapter_thread_entry, NULL, NULL, NULL,
			CONFIG_SPAGHETTI_MQTT_PRIORITY, "mqtt_adapter");
	}
	if (err < 0) {
		atomic_set(&stop_requested, 1);
		k_sem_give(&network_event_sem);
		if (mqtt_worker_thread.stack != NULL) {
			(void)spaghetti_service_thread_join_and_release(
				&mqtt_worker_thread, K_SECONDS(1));
		}
		k_msgq_purge(&command_queue);
		(void)zbus_obs_set_enable(&record_mqtt_subscriber, false);
		(void)k_mutex_lock(&mqtt_lock, K_FOREVER);
		context.started = false;
		context.status.state = SPAGHETTI_MQTT_STOPPED;
		context.status.last_error = err;
		if (context.network_callback_registered) {
			net_mgmt_del_event_callback(&network_callback);
			context.network_callback_registered = false;
		}
		k_mutex_unlock(&mqtt_lock);
	}
	return err;
}

int spaghetti_mqtt_stop(k_timeout_t timeout)
{
	const enum spaghetti_mqtt_command command =
		SPAGHETTI_MQTT_COMMAND_STOP;
	int64_t timeout_ms;
	int err;

	if (K_TIMEOUT_EQ(timeout, K_FOREVER)) {
		return -EINVAL;
	}
	timeout_ms = k_ticks_to_ms_floor64(timeout.ticks);
	if ((timeout_ms < 0) ||
	    (timeout_ms > CONFIG_SPAGHETTI_SERVICE_STOP_MAX_MS)) {
		return -EINVAL;
	}
	err = k_mutex_lock(&mqtt_lock, K_FOREVER);

	if (err < 0) {
		return err;
	}
	if (!context.initialized) {
		k_mutex_unlock(&mqtt_lock);
		return -EACCES;
	}
	if (!context.started && (mqtt_worker_thread.stack == NULL) &&
	    (mqtt_adapter_thread.stack == NULL)) {
		k_mutex_unlock(&mqtt_lock);
		return -EALREADY;
	}

	atomic_set(&stop_requested, 1);
	err = context.started ?
		k_msgq_put(&command_queue, &command, K_NO_WAIT) : 0;
	k_sem_give(&network_event_sem);
	k_mutex_unlock(&mqtt_lock);
	if (err < 0) {
		return -ENOMSG;
	}

	const k_timepoint_t deadline = sys_timepoint_calc(timeout);

	if (mqtt_worker_thread.stack != NULL) {
		err = spaghetti_service_thread_join_and_release(
			&mqtt_worker_thread, sys_timepoint_timeout(deadline));
		if (err < 0) {
			return err;
		}
	}
	if (mqtt_adapter_thread.stack != NULL) {
		err = spaghetti_service_thread_join_and_release(
			&mqtt_adapter_thread, sys_timepoint_timeout(deadline));
		if (err < 0) {
			return err;
		}
	}
	(void)zbus_obs_set_enable(&record_mqtt_subscriber, false);
	(void)k_mutex_lock(&mqtt_lock, K_FOREVER);
	if (context.network_callback_registered) {
		net_mgmt_del_event_callback(&network_callback);
		context.network_callback_registered = false;
	}
	context.started = false;
	context.status.state = SPAGHETTI_MQTT_STOPPED;
	k_mutex_unlock(&mqtt_lock);
	return 0;
}

int spaghetti_mqtt_publish(
	const struct spaghetti_mqtt_publication *publication)
{
	int err;

	if (!publication_is_valid(publication)) {
		return -EINVAL;
	}

	err = k_mutex_lock(&mqtt_lock, K_FOREVER);
	if (err < 0) {
		return err;
	}
	if (!context.initialized || !context.config.enabled) {
		k_mutex_unlock(&mqtt_lock);
		return -EACCES;
	}

	err = k_msgq_put(&publication_queue, publication, K_NO_WAIT);
	if (err < 0) {
		++context.status.dropped;
		context.status.last_error = -ENOMSG;
		k_mutex_unlock(&mqtt_lock);
		return -ENOMSG;
	}
	++context.status.queued;
	k_mutex_unlock(&mqtt_lock);
	return 0;
}

int spaghetti_mqtt_get_status(struct spaghetti_mqtt_status *out)
{
	int err;

	if (out == NULL) {
		return -EINVAL;
	}

	err = k_mutex_lock(&mqtt_lock, K_FOREVER);
	if (err < 0) {
		return err;
	}
	if (!context.initialized) {
		k_mutex_unlock(&mqtt_lock);
		return -EACCES;
	}

	*out = context.status;
	k_mutex_unlock(&mqtt_lock);
	return 0;
}
