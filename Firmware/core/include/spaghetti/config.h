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

#include <spaghetti/connectivity.h>
#include <spaghetti/energy.h>
#include <spaghetti/module.h>
#include <spaghetti/mqtt.h>
#include <spaghetti/port.h>
#include <spaghetti/power.h>
#include <spaghetti/schema.h>
#include <spaghetti/topology.h>

/** Current in-memory Config schema version. */
#define SPAGHETTI_CONFIG_VERSION 4U

/** Maximum number of desired Modules in one Config snapshot. */
#define SPAGHETTI_CONFIG_MAX_MODULES CONFIG_SPAGHETTI_MAX_MODULES

/** Maximum number of Runtime schedules in one Config snapshot. */
#define SPAGHETTI_CONFIG_MAX_SCHEDULES CONFIG_SPAGHETTI_MAX_SCHEDULES

/** Maximum number of rule instances in one Config snapshot. */
#define SPAGHETTI_CONFIG_MAX_RULES CONFIG_SPAGHETTI_MAX_RULES

/** Maximum Module or rule type ID bytes, including the terminating NUL. */
#define SPAGHETTI_CONFIG_TYPE_ID_SIZE 24U

/** SHA-256 digest size for canonical Config revision hashes. */
#define SPAGHETTI_CONFIG_HASH_SIZE 32U

/**
 * @brief Complete owned desired configuration for one Module.
 *
 * Every field and property value is copied into the Config snapshot. Drivers
 * borrow @ref properties only while validation or apply runs.
 */
struct spaghetti_module_config {
	spaghetti_module_key_t key; /**< Nonzero persistent identity. */
	spaghetti_port_id_t port_id; /**< Shared physical Port identifier. */
	spaghetti_bay_id_t bay_id; /**< Function Bay, or UNSPECIFIED. */
	spaghetti_power_rail_id_t power_rail_id; /**< Rail, or UNSPECIFIED. */
	char type_id[SPAGHETTI_CONFIG_TYPE_ID_SIZE]; /**< Owned driver type ID. */
	struct spaghetti_property_set properties; /**< Owned typed driver config. */
};

/**
 * @brief Desired periodic sampling schedule consumed by Runtime.
 */
struct spaghetti_runtime_schedule_config {
	bool enabled; /**< True when periodic sampling is requested. */
	spaghetti_module_key_t source_key; /**< Stable Module key to sample. */
	uint32_t period_ms; /**< Positive sampling period in milliseconds. */
};

/**
 * @brief Desired rule instance validated against the Rule Registry.
 */
struct spaghetti_rule_config {
	spaghetti_module_key_t key; /**< Nonzero stable rule identity. */
	char type_id[SPAGHETTI_CONFIG_TYPE_ID_SIZE]; /**< Owned rule type ID. */
	struct spaghetti_property_set properties; /**< Owned typed rule config. */
};

/**
 * @brief Complete bounded desired-state snapshot.
 */
struct spaghetti_config {
	uint32_t version; /**< Must equal @ref SPAGHETTI_CONFIG_VERSION. */
	size_t module_count; /**< Used elements in @ref modules. */
	struct spaghetti_module_config
		modules[SPAGHETTI_CONFIG_MAX_MODULES]; /**< Owned desired Modules. */
	size_t schedule_count; /**< Used elements in @ref schedules. */
	struct spaghetti_runtime_schedule_config
		schedules[SPAGHETTI_CONFIG_MAX_SCHEDULES]; /**< Owned schedules. */
	size_t rule_count; /**< Used elements in @ref rules. */
	struct spaghetti_rule_config
		rules[SPAGHETTI_CONFIG_MAX_RULES]; /**< Owned rule instances. */
	enum spaghetti_connectivity_policy connectivity_policy; /**< Persistent policy. */
	struct spaghetti_energy_policy energy_policy; /**< Persistent BLE timing policy. */
	struct spaghetti_mqtt_config mqtt; /**< Optional copied MQTT endpoint. */
};

/** Config section associated with one validation failure. */
enum spaghetti_config_failure_field {
	SPAGHETTI_CONFIG_FAILURE_ROOT, /**< Version or top-level capacity. */
	SPAGHETTI_CONFIG_FAILURE_MODULE, /**< One Module description. */
	SPAGHETTI_CONFIG_FAILURE_SCHEDULE, /**< One Runtime schedule. */
	SPAGHETTI_CONFIG_FAILURE_RULE, /**< One rule instance. */
	SPAGHETTI_CONFIG_FAILURE_CONNECTIVITY, /**< Connectivity policy. */
	SPAGHETTI_CONFIG_FAILURE_ENERGY, /**< Energy policy. */
	SPAGHETTI_CONFIG_FAILURE_MQTT, /**< MQTT endpoint configuration. */
};

/** Stable reason associated with one validation failure. */
enum spaghetti_config_failure_reason {
	SPAGHETTI_CONFIG_FAILURE_REQUIRED, /**< A mandatory value is absent. */
	SPAGHETTI_CONFIG_FAILURE_RANGE, /**< A bounded value is outside its range. */
	SPAGHETTI_CONFIG_FAILURE_DUPLICATE, /**< A key or endpoint is repeated. */
	SPAGHETTI_CONFIG_FAILURE_UNKNOWN_TYPE, /**< Driver or rule type is unavailable. */
	SPAGHETTI_CONFIG_FAILURE_INCONSISTENT, /**< Related fields disagree. */
};

/** Optional caller-owned validation diagnostic. */
struct spaghetti_config_failure {
	enum spaghetti_config_failure_field field; /**< Section containing the error. */
	size_t index; /**< Module/schedule/rule index, or zero for a singleton. */
	enum spaghetti_config_failure_reason reason; /**< Transport-independent reason. */
};

/** Caller-owned generation and canonical hash for one Config revision. */
struct spaghetti_config_revision {
	uint32_t generation; /**< Monotonic compare-and-swap generation. */
	uint8_t sha256[SPAGHETTI_CONFIG_HASH_SIZE]; /**< Hash of canonical CBOR. */
};

/** Caller-owned outcome of one successful Config apply. */
struct spaghetti_config_commit_result {
	struct spaghetti_config_revision revision; /**< Live revision after apply. */
	bool changed; /**< False when the candidate matched the live Config. */
};

/**
 * @brief Initialize Config with one complete safe desired-state snapshot.
 *
 * @param[in] defaults Caller-owned snapshot borrowed only during this call.
 *
 * @retval 0 The copied defaults are generation 1.
 * @retval -EINVAL @p defaults is invalid.
 * @retval -EALREADY Config was initialized previously.
 * @retval -errno Complete validation rejected @p defaults.
 *
 * @note Call once from the boot thread after Port and Registry initialization.
 */
int spaghetti_config_init(const struct spaghetti_config *defaults);

/**
 * @brief Validate a complete Config without changing live state.
 *
 * @param[in] candidate Caller-owned snapshot borrowed for this call.
 * @param[out] failure Optional caller-owned diagnostic written only on failure.
 *
 * @retval 0 The complete candidate is valid.
 * @retval -EINVAL A pointer, version, count, key, string, size, endpoint, or
 *                 schedule field is invalid.
 * @retval -ENOENT A referenced Port, Bay, rail, or Module does not exist.
 * @retval -ENOTSUP A driver or rule type is unknown or lacks required operations.
 * @retval -EEXIST Two desired Modules or rules use the same stable key.
 * @retval -EADDRINUSE Two desired Modules claim conflicting endpoints or Bays.
 * @retval -ERANGE A property value cannot be represented safely.
 *
 * @note Callable from thread context. This function performs no hardware I/O.
 */
int spaghetti_config_validate(const struct spaghetti_config *candidate,
			      struct spaghetti_config_failure *failure);

/**
 * @brief Reconcile live Modules with a complete desired Config transaction.
 *
 * Keep unchanged keys alive, replace changed keys, and add or remove only the
 * required instances. Publish the candidate snapshot only after full success.
 * On failure, restore the previous desired Modules before returning.
 *
 * @param[in] candidate Caller-owned snapshot borrowed for this call and copied
 *                      only after a successful transaction.
 * @param[in] expected_generation Generation returned with the caller's snapshot.
 * @param[out] out_result Optional caller-owned commit outcome written only on
 *                        success.
 *
 * @retval 0 The candidate is live and is now the current Config snapshot.
 * @retval -EINVAL The candidate or one of its fields is invalid.
 * @retval -EACCES Config has not been initialized.
 * @retval -ENOENT A Port, previous live Module, or schedule source is missing.
 * @retval -ENOTSUP A driver is unknown, incomplete, incompatible, or rules are
 *                 present before Runtime rule lifecycle lands.
 * @retval -EEXIST Stable Module keys are duplicated or conflict with live state.
 * @retval -EADDRINUSE Two Module endpoints or Bays conflict.
 * @retval -ENOSPC A bounded Manager or driver pool is full.
 * @retval -ENOMEM A concrete driver context pool is full.
 * @retval -ENODEV Required hardware is unavailable.
 * @retval -EBUSY A Module is executing another operation, or writes are rate
 *                limited.
 * @retval -ESTALE @p expected_generation does not match the live generation.
 * @retval -ERANGE A concrete driver value cannot be represented safely.
 * @retval -EIO A driver operation or rollback failed.
 * @retval -ETIMEDOUT A bounded driver operation timed out.
 *
 * @note Call from thread context. Apply may perform bounded hardware I/O.
 */
int spaghetti_config_apply(
	const struct spaghetti_config *candidate,
	uint32_t expected_generation,
	struct spaghetti_config_commit_result *out_result);

/**
 * @brief Copy the last successfully applied Config snapshot and revision.
 *
 * @param[out] out Caller-owned destination written only on success.
 * @param[out] out_revision Caller-owned revision destination written only on
 *                          success.
 *
 * @retval 0 The coherent current snapshot was copied to @p out.
 * @retval -EINVAL @p out or @p out_revision is NULL.
 * @retval -EACCES Config has not been initialized.
 *
 * @note Thread-safe and callable from thread context. No hardware is accessed.
 */
int spaghetti_config_get_snapshot(
	struct spaghetti_config *out,
	struct spaghetti_config_revision *out_revision);

#endif /* SPAGHETTI_CONFIG_H */
