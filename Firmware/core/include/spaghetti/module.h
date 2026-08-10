/**
 * @file
 * @brief Public Module types for the Spaghetti firmware.
 * @ingroup spaghetti_module
 */

#ifndef SPAGHETTI_MODULE_H
#define SPAGHETTI_MODULE_H

#include <stdint.h>

struct spaghetti_module_driver;
struct spaghetti_port;

/** Maximum bytes in a Module type ID, including the terminating NUL. */
#define SPAGHETTI_TYPE_ID_MAX 24U

/**
 * @brief Runtime identifier for a live Module.
 *
 * The Module Manager assigns this ephemeral handle. It is valid only while the
 * corresponding Module remains configured and must not be persisted.
 */
typedef uint8_t spaghetti_module_id_t;

/**
 * @brief Stable identity of one desired Module configuration.
 *
 * Config owns this nonzero value. It remains stable across Manager slot reuse
 * and reboot when the same configuration is restored.
 */
typedef uint32_t spaghetti_module_key_t;

/**
 * @brief Lifecycle state of a Module instance.
 */
enum spaghetti_module_state {
	SPAGHETTI_MODULE_UNINITIALIZED, /**< Driver initialization has not completed. */
	SPAGHETTI_MODULE_READY, /**< The Module accepts supported operations. */
	SPAGHETTI_MODULE_ERROR, /**< The Module encountered an unrecoverable error. */
};

/**
 * @brief Hardware endpoint namespace used for collision detection.
 */
enum spaghetti_module_endpoint_kind {
	SPAGHETTI_ENDPOINT_PORT_EXCLUSIVE, /**< The Module requires the whole Port. */
	SPAGHETTI_ENDPOINT_I2C_ADDRESS, /**< Value is a 7-bit I2C address. */
	SPAGHETTI_ENDPOINT_SPI_CHIP_SELECT, /**< Value identifies one SPI chip select. */
};

/**
 * @brief Normalized hardware endpoint of one Module.
 *
 * The concrete driver derives this value from its validated runtime config.
 */
struct spaghetti_module_endpoint {
	enum spaghetti_module_endpoint_kind kind; /**< Namespace used to interpret value. */
	uint32_t value; /**< Endpoint value within @ref kind. */
};

/**
 * @brief Manager-owned live Module instance passed to its concrete driver.
 */
struct spaghetti_module {
	spaghetti_module_id_t id; /**< Ephemeral Manager handle for this live instance. */
	spaghetti_module_key_t key; /**< Stable nonzero Config identity. */
	enum spaghetti_module_state state; /**< Current public lifecycle state. */
	const struct spaghetti_port *port; /**< Borrowed firmware-lifetime shared Port. */
	const struct spaghetti_module_driver *driver; /**< Borrowed immutable descriptor. */
	struct spaghetti_module_endpoint endpoint; /**< Validated physical endpoint. */
	void *context; /**< Opaque context owned by the concrete driver's static pool. */
};

/**
 * @brief Normalized electrical measurement returned by a Module driver.
 */
struct spaghetti_sample {
	int32_t bus_voltage_microvolts; /**< Bus voltage in microvolts. */
	int32_t current_microamps; /**< Signed current in microamps. */
	uint32_t power_microwatts; /**< Non-negative power in microwatts. */
};

#endif /* SPAGHETTI_MODULE_H */
