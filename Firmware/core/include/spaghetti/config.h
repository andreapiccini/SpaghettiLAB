/**
 * @file
 * @brief Public desired-state Config contract for the Spaghetti firmware.
 * @ingroup spaghetti_config
 */

#ifndef SPAGHETTI_CONFIG_H
#define SPAGHETTI_CONFIG_H

#include <stdbool.h>
#include <stddef.h>
#include <stdint.h>

#include <spaghetti/module.h>
#include <spaghetti/port.h>

/** Current in-memory Config schema version. */
#define SPAGHETTI_CONFIG_VERSION 1U

/** Maximum number of desired Modules in one Config snapshot. */
#define SPAGHETTI_CONFIG_MAX_MODULES 8U

/** Maximum Module type ID bytes, including the terminating NUL. */
#define SPAGHETTI_CONFIG_TYPE_ID_SIZE 24U

/** Maximum bytes of concrete driver configuration retained per Module. */
#define SPAGHETTI_DRIVER_CONFIG_MAX 64U

/**
 * @brief Complete owned desired configuration for one Module.
 *
 * Every field and byte is copied into the Config snapshot. The concrete
 * driver borrows @ref driver_config only while validation or apply runs.
 */
struct spaghetti_module_config {
	spaghetti_module_key_t key; /**< Nonzero persistent identity. */
	spaghetti_port_id_t port_id; /**< Shared physical Port identifier. */
	char type_id[SPAGHETTI_CONFIG_TYPE_ID_SIZE]; /**< Owned driver type ID. */
	size_t driver_config_size; /**< Used bytes in @ref driver_config. */
	uint8_t driver_config[SPAGHETTI_DRIVER_CONFIG_MAX]; /**< Owned driver bytes. */
};

/**
 * @brief Desired periodic sampling selection consumed by Runtime later.
 */
struct spaghetti_runtime_sampling_config {
	bool enabled; /**< True when periodic sampling is requested. */
	spaghetti_module_key_t source_key; /**< Stable Module key to sample. */
	uint32_t period_ms; /**< Positive sampling period in milliseconds. */
};

/**
 * @brief Complete bounded desired-state snapshot.
 */
struct spaghetti_config {
	uint32_t version; /**< Must equal @ref SPAGHETTI_CONFIG_VERSION. */
	size_t module_count; /**< Used elements in @ref modules. */
	struct spaghetti_module_config
		modules[SPAGHETTI_CONFIG_MAX_MODULES]; /**< Owned desired Modules. */
	struct spaghetti_runtime_sampling_config sampling; /**< Runtime selection. */
};

/**
 * @brief Validate a complete Config without changing live state.
 *
 * @param[in] candidate Caller-owned snapshot borrowed for this call.
 *
 * @retval 0 The complete candidate is valid.
 * @retval -EINVAL A pointer, version, count, key, string, size, endpoint, or
 *                 sampling field is invalid.
 * @retval -ENOENT A referenced Port does not exist.
 * @retval -ENOTSUP A driver type is unknown or lacks required operations.
 * @retval -EEXIST Two desired Modules use the same stable key.
 * @retval -EADDRINUSE Two desired Modules claim conflicting endpoints on one Port.
 * @retval -ERANGE A concrete driver configuration cannot be represented safely.
 *
 * @note Callable from thread context. This function performs no hardware I/O.
 */
int spaghetti_config_validate(const struct spaghetti_config *candidate);

/**
 * @brief Reconcile live Modules with a complete desired Config transaction.
 *
 * Keep unchanged keys alive, replace changed keys, and add or remove only the
 * required instances. Publish the candidate snapshot only after full success.
 * On failure, restore the previous desired Modules before returning.
 *
 * @param[in] candidate Caller-owned snapshot borrowed for this call and copied
 *                      only after a successful transaction.
 *
 * @retval 0 The candidate is live and is now the current Config snapshot.
 * @retval -EINVAL The candidate or one of its fields is invalid.
 * @retval -ENOENT A Port, previous live Module, or sampling source is missing.
 * @retval -ENOTSUP A driver is unknown, incomplete, or incompatible with a Port.
 * @retval -EEXIST Stable Module keys are duplicated or conflict with live state.
 * @retval -EADDRINUSE Two Module endpoints conflict on one Port.
 * @retval -ENOSPC A bounded Manager or driver pool is full.
 * @retval -ENOMEM A concrete driver context pool is full.
 * @retval -ENODEV Required hardware is unavailable.
 * @retval -EBUSY A Module is executing another operation.
 * @retval -ESTALE A live Module changed before its requested removal.
 * @retval -ERANGE A concrete driver value cannot be represented safely.
 * @retval -EIO A driver operation or rollback failed.
 * @retval -ETIMEDOUT A bounded driver operation timed out.
 *
 * @note Call from thread context. Apply may perform bounded hardware I/O.
 */
int spaghetti_config_apply(const struct spaghetti_config *candidate);

/**
 * @brief Copy the last successfully applied Config snapshot.
 *
 * @param[out] out Caller-owned destination written only on success.
 *
 * @retval 0 The coherent current snapshot was copied to @p out.
 * @retval -EINVAL @p out is NULL.
 * @retval -ENOENT No Config has completed a successful apply yet.
 *
 * @note Thread-safe and callable from thread context. No hardware is accessed.
 */
int spaghetti_config_get_snapshot(struct spaghetti_config *out);

#endif /* SPAGHETTI_CONFIG_H */
