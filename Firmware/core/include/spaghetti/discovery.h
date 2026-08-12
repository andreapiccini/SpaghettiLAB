/**
 * @file
 * @brief Public runtime Module discovery contract for Spaghetti firmware.
 * @ingroup spaghetti_discovery
 */

#ifndef SPAGHETTI_DISCOVERY_H
#define SPAGHETTI_DISCOVERY_H

#include <stddef.h>
#include <stdint.h>

#include <zephyr/kernel.h>

#include <spaghetti/module.h>
#include <spaghetti/port.h>

/** Maximum bytes of packed driver configuration retained per Discovery result. */
#define SPAGHETTI_DRIVER_CONFIG_MAX 64U

/** Origin of one normalized Discovery result. */
enum spaghetti_discovery_source {
	SPAGHETTI_DISCOVERY_SOURCE_CONFIG, /**< Explicit assignment received by Config. */
	SPAGHETTI_DISCOVERY_SOURCE_PROVIDER, /**< Identity emitted by a hardware provider. */
};

/**
 * @brief Complete owned proposal for one runtime Module.
 *
 * Discovery canonicalizes and copies every field. A stable key distinguishes
 * sibling Modules that share one physical Port.
 */
struct spaghetti_discovery_result {
	spaghetti_module_key_t key; /**< Nonzero stable desired-state identity. */
	spaghetti_port_id_t port_id; /**< Shared physical Port identifier. */
	char type_id[SPAGHETTI_TYPE_ID_MAX]; /**< Owned NUL-terminated driver type ID. */
	uint8_t driver_config[SPAGHETTI_DRIVER_CONFIG_MAX]; /**< Owned driver config bytes. */
	size_t driver_config_size; /**< Used bytes in @ref driver_config. */
	enum spaghetti_discovery_source source; /**< Component that identified the Module. */
	uint32_t generation; /**< Nonzero monotonic generation scoped to @ref key. */
};

/** Change requested for one normalized Discovery result. */
enum spaghetti_discovery_event_type {
	SPAGHETTI_DISCOVERY_UPSERT, /**< Create or replace the Module identified by key. */
	SPAGHETTI_DISCOVERY_REMOVE, /**< Remove only the Module identified by key. */
};

/**
 * @brief One synchronous event delivered to the configured Discovery sink.
 */
struct spaghetti_discovery_event {
	enum spaghetti_discovery_event_type type; /**< Requested state transition. */
	struct spaghetti_discovery_result result; /**< Complete caller-independent value. */
};

/**
 * @brief Callback that consumes one normalized Discovery event.
 *
 * @param[in] event Discovery-owned event borrowed only during this call.
 * @param[in,out] user_data Firmware-lifetime context passed to Discovery init.
 *
 * @retval 0 The consumer accepted and completed the event.
 * @retval -errno The consumer rejected the event; Discovery restores its prior state.
 */
typedef int (*spaghetti_discovery_sink_t)(
	const struct spaghetti_discovery_event *event,
	void *user_data);

/**
 * @brief Callback used by a provider to emit one complete result.
 *
 * @param[in] result Provider-owned result borrowed only during this call.
 * @param[in,out] user_data Scan-lifetime context supplied by Discovery.
 *
 * @retval 0 Discovery accepted and copied the result.
 * @retval -errno Validation, capacity, generation, or sink processing failed.
 */
typedef int (*spaghetti_discovery_emit_t)(
	const struct spaghetti_discovery_result *result,
	void *user_data);

/**
 * @brief Callback that scans one Port and emits zero or more identified Modules.
 *
 * @param[in] port_id Physical Port selected for the bounded scan.
 * @param[in] emit Callback borrowed for the duration of this call.
 * @param[in,out] emit_user_data Opaque scan context passed back to @p emit.
 * @param[in] timeout Maximum time available to the complete provider scan.
 *
 * @retval 0 The scan completed, including when it found no Modules.
 * @retval -EINVAL A callback or provider-specific argument is invalid.
 * @retval -ENOTSUP The provider cannot identify Modules on this Port.
 * @retval -ETIMEDOUT The bounded scan did not complete in time.
 * @retval -errno An emitted result or hardware operation failed.
 */
typedef int (*spaghetti_discovery_scan_cb_t)(
	spaghetti_port_id_t port_id,
	spaghetti_discovery_emit_t emit,
	void *emit_user_data,
	k_timeout_t timeout);

/** Operations implemented by a concrete hardware identification provider. */
struct spaghetti_discovery_provider_ops {
	spaghetti_discovery_scan_cb_t scan; /**< Bounded synchronous provider scan. */
};

/**
 * @brief Initialize empty bounded Discovery state.
 *
 * Store a borrowed firmware-lifetime sink and context. The sink must remain
 * valid for every later submit or invalidate call.
 *
 * @param[in] sink Non-NULL synchronous consumer callback.
 * @param[in,out] user_data Optional firmware-lifetime sink context.
 *
 * @retval 0 Discovery was initialized with an empty result table.
 * @retval -EINVAL @p sink is NULL.
 * @retval -EALREADY Discovery was initialized previously.
 *
 * @note Call once from boot thread context before other Discovery functions.
 */
int spaghetti_discovery_init(spaghetti_discovery_sink_t sink, void *user_data);

/**
 * @brief Validate, copy, and submit one explicit Module proposal.
 *
 * A new key consumes one bounded slot. An existing key accepts only a greater
 * generation. The prior copy is restored if the sink rejects the UPSERT.
 *
 * @param[in] result Caller-owned complete result borrowed only for this call.
 *
 * @retval 0 The result and its UPSERT event were accepted.
 * @retval -EINVAL A pointer, key, type, config size, source, or generation is invalid.
 * @retval -EACCES Discovery has not been initialized.
 * @retval -ENOENT The selected Port does not exist.
 * @retval -ENOSPC The fixed result table has no free slot.
 * @retval -ESTALE The key already has an equal or greater generation.
 * @retval -EBUSY Another operation is changing the same key.
 * @retval -errno The configured sink rejected the UPSERT event.
 *
 * @note Call from thread context. The sink executes synchronously.
 */
int spaghetti_discovery_submit_manual(
	const struct spaghetti_discovery_result *result);

/**
 * @brief Ask the board provider to identify Modules on one Port.
 *
 * An I2C address scan alone cannot determine a Module driver type. The current
 * board therefore reports unsupported until a real identity provider exists.
 *
 * @param[in] port_id Physical Port selected for discovery.
 * @param[in] timeout Maximum duration passed by value to the provider.
 *
 * @retval 0 The provider completed and all emitted results were accepted.
 * @retval -EACCES Discovery has not been initialized.
 * @retval -ENOENT The selected Port does not exist.
 * @retval -ENOTSUP No reliable hardware identity provider is registered.
 * @retval -ETIMEDOUT The provider exceeded @p timeout.
 * @retval -errno A provider, emitted result, or sink operation failed.
 *
 * @note Call from thread context. A provider may sleep within the timeout.
 */
int spaghetti_discovery_scan_port(spaghetti_port_id_t port_id,
				  k_timeout_t timeout);

/**
 * @brief Invalidate one exact result without affecting sibling Port entries.
 *
 * The slot is cleared only after the sink accepts REMOVE. A sink failure leaves
 * the complete prior result available for a retry.
 *
 * @param[in] key Nonzero stable Module key to invalidate.
 * @param[in] expected_generation Nonzero generation that must match the key.
 *
 * @retval 0 REMOVE was accepted and the exact key was forgotten.
 * @retval -EINVAL @p key or @p expected_generation is zero.
 * @retval -EACCES Discovery has not been initialized.
 * @retval -ENOENT No accepted result has @p key.
 * @retval -ESTALE The stored generation differs from @p expected_generation.
 * @retval -EBUSY Another operation is changing the same key.
 * @retval -errno The configured sink rejected the REMOVE event.
 *
 * @note Call from thread context. The sink executes synchronously.
 */
int spaghetti_discovery_invalidate(spaghetti_module_key_t key,
				   uint32_t expected_generation);

#endif /* SPAGHETTI_DISCOVERY_H */
