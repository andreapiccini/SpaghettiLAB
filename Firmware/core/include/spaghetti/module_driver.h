/**
 * @file
 * @brief Public Module Driver contract for the Spaghetti firmware.
 * @ingroup spaghetti_module_driver
 */

#ifndef SPAGHETTI_MODULE_DRIVER_H
#define SPAGHETTI_MODULE_DRIVER_H

#include <stdbool.h>
#include <stddef.h>
#include <stdint.h>

#include <spaghetti/module.h>

/** Generic command identifiers understood through Module Manager. */
enum spaghetti_command_type {
	SPAGHETTI_COMMAND_RELAY_SET, /**< Set one Relay logical ON/OFF state. */
};

/**
 * @brief Complete bounded command copied or consumed during one Manager call.
 */
struct spaghetti_command {
	enum spaghetti_command_type type; /**< Selects the command payload meaning. */
	bool relay_on; /**< Logical Relay state, independent of GPIO polarity. */
};

/** Pure callback that validates borrowed driver config without hardware access. */
typedef int (*spaghetti_module_validate_config_cb_t)(const void *config,
						     size_t config_size);

/** Pure callback that writes one endpoint only after complete config validation. */
typedef int (*spaghetti_module_describe_endpoint_cb_t)(
	const void *config,
	size_t config_size,
	struct spaghetti_module_endpoint *out);

/** Callback that initializes one provisional Module and owns any assigned context. */
typedef int (*spaghetti_module_init_cb_t)(struct spaghetti_module *module,
					  const void *config,
					  size_t config_size);

/** Callback that performs bounded acquisition and writes a sample only on success. */
typedef int (*spaghetti_module_read_cb_t)(struct spaghetti_module *module,
					  struct spaghetti_sample *out);

/** Callback that applies one borrowed generic command synchronously. */
typedef int (*spaghetti_module_command_cb_t)(
	struct spaghetti_module *module,
	const struct spaghetti_command *command);

/** Callback that places one Module in safe state and releases its context. */
typedef int (*spaghetti_module_deinit_cb_t)(struct spaghetti_module *module);

/**
 * @brief Operations implemented by every concrete Module driver.
 *
 * Config pointers are borrowed only for the call. A driver copies any data it
 * retains into its own bounded context pool. Operations run in thread context.
 */
struct spaghetti_module_driver_ops {
	spaghetti_module_validate_config_cb_t validate_config; /**< Pure config validation. */
	spaghetti_module_describe_endpoint_cb_t describe_endpoint; /**< Endpoint derivation. */
	spaghetti_module_init_cb_t init; /**< Context allocation and instance initialization. */
	spaghetti_module_read_cb_t read; /**< Bounded sample acquisition. */
	spaghetti_module_command_cb_t command; /**< Bounded actuator command. */
	spaghetti_module_deinit_cb_t deinit; /**< Safe-state and context release. */
};

/**
 * @brief Immutable descriptor shared by every instance of one Module type.
 */
struct spaghetti_module_driver {
	const char *type_id; /**< Firmware-lifetime, NUL-terminated stable type ID. */
	uint32_t required_capabilities; /**< Port capability bits required by the driver. */
	const struct spaghetti_module_driver_ops *ops; /**< Firmware-lifetime operations. */
};

#endif /* SPAGHETTI_MODULE_DRIVER_H */
