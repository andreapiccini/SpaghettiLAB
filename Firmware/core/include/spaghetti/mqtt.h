/**
 * @file
 * @brief Public bounded MQTT service contract.
 * @ingroup spaghetti_mqtt
 */

#ifndef SPAGHETTI_MQTT_H
#define SPAGHETTI_MQTT_H

#include <stdbool.h>
#include <stddef.h>
#include <stdint.h>

#include <zephyr/kernel.h>

/** Maximum MQTT broker host bytes, including the terminating NUL. */
#define SPAGHETTI_MQTT_HOST_SIZE 64U

/** Maximum MQTT base-topic bytes, including the terminating NUL. */
#define SPAGHETTI_MQTT_TOPIC_SIZE 96U

/** Maximum publication topic-suffix bytes, including the terminating NUL. */
#define SPAGHETTI_MQTT_TOPIC_SUFFIX_SIZE 32U

/** Maximum MQTT application payload bytes. */
#define SPAGHETTI_MQTT_PAYLOAD_SIZE 128U

/** MQTT service lifecycle visible to diagnostics. */
enum spaghetti_mqtt_state {
	SPAGHETTI_MQTT_STOPPED, /**< No connection or reconnect is active. */
	SPAGHETTI_MQTT_WAIT_NETWORK, /**< Started and waiting for an IPv4 address. */
	SPAGHETTI_MQTT_CONNECTED, /**< Connected to the configured broker. */
	SPAGHETTI_MQTT_ERROR, /**< A transient error is waiting for bounded retry. */
};

/** @brief Complete copied MQTT endpoint configuration. */
struct spaghetti_mqtt_config {
	bool enabled; /**< True when the service may start and publish. */
	char host[SPAGHETTI_MQTT_HOST_SIZE]; /**< Owned DNS name or IPv4 text. */
	uint16_t port; /**< TCP broker port in host byte order. */
	char base_topic[SPAGHETTI_MQTT_TOPIC_SIZE]; /**< Owned prefix without trailing slash. */
};

/** @brief Complete caller-owned publication copied into the outbound queue. */
struct spaghetti_mqtt_publication {
	/** Relative topic without leading or trailing slash. */
	char topic_suffix[SPAGHETTI_MQTT_TOPIC_SUFFIX_SIZE];
	size_t payload_size; /**< Valid leading bytes in @ref payload. */
	uint8_t payload[SPAGHETTI_MQTT_PAYLOAD_SIZE]; /**< Owned application payload bytes. */
};

/** @brief Caller-owned snapshot of bounded MQTT diagnostics. */
struct spaghetti_mqtt_status {
	enum spaghetti_mqtt_state state; /**< Current lifecycle state. */
	uint32_t queued; /**< Publications accepted since the last configuration. */
	uint32_t published; /**< Publications successfully passed to MQTT. */
	uint32_t dropped; /**< Publications rejected or lost after acceptance. */
	int last_error; /**< Latest negative errno, or zero when none is recorded. */
};

/**
 * @brief Initialize or replace the stopped MQTT service configuration.
 *
 * The first successful call creates the static worker integration. A later
 * call replaces the copied configuration only while the service is stopped
 * and clears queued publications and diagnostics.
 *
 * @param[in] config Caller-owned configuration borrowed only for this call
 *                   and copied on success. Disabled configuration must use
 *                   empty host/topic strings and port zero.
 *
 * @retval 0 The copied configuration is ready in the stopped state.
 * @retval -EINVAL A pointer, string, port, or enabled-field combination is invalid.
 * @retval -EBUSY The service must be stopped before reconfiguration.
 * @retval -EIO The Data observer could not be enabled or disabled.
 *
 * @note Call from thread context. The call performs no socket or DNS work.
 */
int spaghetti_mqtt_init(const struct spaghetti_mqtt_config *config);

/**
 * @brief Request connection when IPv4 networking becomes ready.
 *
 * @retval 0 The bounded start command was accepted.
 * @retval -EACCES MQTT is uninitialized or disabled by Config.
 * @retval -EALREADY MQTT is already started.
 * @retval -ENOMSG The bounded command queue is full.
 *
 * @note Call from thread context. Socket work occurs only in the MQTT worker.
 */
int spaghetti_mqtt_start(void);

/**
 * @brief Stop reconnect and wait for the worker to release its connection.
 *
 * @param[in] timeout Maximum wait for worker acknowledgement. `K_NO_WAIT`, a
 *                    finite timeout, and `K_FOREVER` are accepted.
 *
 * @retval 0 MQTT reached the stopped state.
 * @retval -EACCES MQTT is uninitialized.
 * @retval -EALREADY MQTT is already stopped.
 * @retval -ENOMSG The bounded command queue is full.
 * @retval -EAGAIN @p timeout expired before acknowledgement.
 *
 * @note Call from thread context. Do not call from ISR context.
 */
int spaghetti_mqtt_stop(k_timeout_t timeout);

/**
 * @brief Queue one copied publication without network I/O.
 *
 * @param[in] publication Caller-owned bounded publication borrowed only for
 *                        this call and copied on success.
 *
 * @retval 0 The publication was copied into the outbound queue.
 * @retval -EINVAL A pointer, suffix, or payload size is invalid.
 * @retval -EACCES MQTT is uninitialized or disabled by Config.
 * @retval -ENOMSG The outbound queue is full; the newest publication is dropped.
 *
 * @note Thread-safe and non-blocking. The call is not ISR-safe because it
 *       updates coherent diagnostics under a mutex.
 */
int spaghetti_mqtt_publish(
	const struct spaghetti_mqtt_publication *publication);

/**
 * @brief Copy the current coherent MQTT status.
 *
 * @param[out] out Caller-owned destination written only on success and never retained.
 *
 * @retval 0 A coherent status snapshot was copied.
 * @retval -EINVAL @p out is NULL.
 * @retval -EACCES MQTT is uninitialized.
 *
 * @note Thread-safe and callable from thread context without network I/O.
 */
int spaghetti_mqtt_get_status(struct spaghetti_mqtt_status *out);

#endif /* SPAGHETTI_MQTT_H */
