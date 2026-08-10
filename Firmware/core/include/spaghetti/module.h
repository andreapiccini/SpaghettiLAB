/**
 * @file
 * @brief Module for the Spaghetti module manager.
 * @ingroup spaghetti_module_manager
 */

#ifndef SPAGHETTI_MODULE_H
#define SPAGHETTI_MODULE_H

#include <stdint.h>

/**
 * @brief State of Spaghetti module.
 */
enum spaghetti_module_state {
	SPAGHETTI_MODULE_UNINITIALIZED, /**< Module initialization has not started. */
	SPAGHETTI_MODULE_READY,         /**< Module initialization completed successfully. */
	SPAGHETTI_MODULE_ERROR          /**< Module initialization failed. */
};

/**
 * @brief Unique identifier for a Spaghetti module.
 */
typedef uint8_t spaghetti_module_id_t;

/**
 * @brief Structure representing a Spaghetti module.
 */
struct spaghetti_module {
	spaghetti_module_id_t id;   /**< Unique identifier for the module. */
	enum spaghetti_module_state state; /**< Avoid read before init or after error. */
	const struct spaghetti_port *port;  /**< Pointer to the port associated. */
	const struct spaghetti_module_driver *driver; /**< Pointer to the driver associated. */
	void *context;  /**< Modifiable pointer to the module's private storage of instance. */
};

/**
 * @brief Sample data structure for a Spaghetti module.
 */
struct spaghetti_sample {
	int32_t bus_voltage_microvolts;
	int32_t current_microamps;
	uint32_t power_microwatts;
};

#endif /* SPAGHETTI_MODULE_H */
