/**
 * @file
 * @brief Public electrical Data distribution contract.
 * @ingroup spaghetti_data
 */

#ifndef SPAGHETTI_DATA_H
#define SPAGHETTI_DATA_H

#include <stdint.h>

#include <zephyr/kernel.h>

#include <spaghetti/module.h>

/**
 * @brief Immutable electrical sample copied to every enabled zbus subscriber.
 */
struct spaghetti_electrical_message {
	spaghetti_module_id_t source_id; /**< Ephemeral live Module ID. */
	spaghetti_module_key_t source_key; /**< Stable Config-owned Module key. */
	int32_t bus_voltage_microvolts; /**< Bus voltage in microvolts. */
	int32_t current_microamps; /**< Signed bidirectional current in microamps. */
	uint32_t power_microwatts; /**< Non-negative power in microwatts. */
	int64_t timestamp_ms; /**< Zephyr uptime at acquisition, in milliseconds. */
	uint32_t sequence; /**< Publisher sequence; unsigned wrap is intentional. */
};

/**
 * @brief Caller-owned snapshot of bounded Data diagnostics.
 */
struct spaghetti_data_stats {
	uint32_t published; /**< Messages delivered to every enabled observer. */
	uint32_t rejected; /**< Calls rejected before reaching zbus. */
	uint32_t delivery_errors; /**< zbus publish attempts that returned an error. */
};

/**
 * @brief Initialize Data diagnostics before the first publication.
 *
 * zbus channels and subscribers are static Zephyr objects initialized before
 * main. This call initializes only Spaghetti-owned runtime state.
 *
 * @retval 0 Data is ready for publication.
 * @retval -EALREADY Data was initialized previously.
 *
 * @note Call once from the Core boot thread. This function performs no I/O.
 */
int spaghetti_data_init(void);

/**
 * @brief Publish one electrical message to every enabled subscriber.
 *
 * zbus copies @p message before returning. With multiple observers, a pool
 * exhaustion error can occur after an earlier observer received its copy;
 * callers therefore treat errors as a dropped/incomplete fan-out attempt.
 *
 * @param[in] message Caller-owned, suitably aligned message borrowed only for
 *                    this call. It must not be NULL and is never retained.
 * @param[in] timeout Maximum time allowed for channel and buffer acquisition.
 *                    `K_NO_WAIT`, a finite timeout, and `K_FOREVER` are accepted
 *                    in thread context; ISR callers must use `K_NO_WAIT`.
 *
 * @retval 0 Every enabled subscriber accepted a copied message.
 * @retval -EINVAL @p message is NULL.
 * @retval -EACCES Data has not been initialized.
 * @retval -EBUSY The channel is busy and @p timeout is `K_NO_WAIT`.
 * @retval -EAGAIN The finite timeout expired.
 * @retval -ENOMEM The bounded message pool cannot complete the fan-out.
 *
 * @note Callable from thread context and from ISR only with `K_NO_WAIT`.
 */
int spaghetti_data_publish_electrical(
	const struct spaghetti_electrical_message *message,
	k_timeout_t timeout);

/**
 * @brief Copy the current Data publication diagnostics.
 *
 * @param[out] out Caller-owned, suitably aligned destination written only on
 *                 success and not retained by Data.
 *
 * @retval 0 The current atomic counter values were copied to @p out.
 * @retval -EINVAL @p out is NULL.
 * @retval -EACCES Data has not been initialized.
 *
 * @note Thread-safe and callable from thread context. Counters may wrap.
 */
int spaghetti_data_get_stats(struct spaghetti_data_stats *out);

#endif /* SPAGHETTI_DATA_H */
