/**
 * @file
 * @brief Module driver for the Spaghetti module manager.
 * @ingroup spaghetti_module_manager
 */

#ifndef SPAGHETTI_MODULE_DRIVER_H
#define SPAGHETTI_MODULE_DRIVER_H

#include <stdint.h>
#include "module.h"

/**
 * @brief Module driver operations for a Spaghetti module.
 */
struct spaghetti_module_driver_ops {
	int (*init)(struct spaghetti_module *module, const void *config, size_t config_size);
	int (*read)(struct spaghetti_module *module, struct spaghetti_sample *out);
	int (*deinit)(struct spaghetti_module *module);
};

/**
 * @brief Structure representing a Spaghetti module driver.
 */
struct spaghetti_module_driver {
	const char *type_id;
	uint32_t required_capabilities;
	const struct spaghetti_module_driver_ops *ops;
};

/**
 * @brief Unique identifier for a Spaghetti module driver.
 */
extern const struct spaghetti_module_driver spaghetti_ina219_driver;

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

#endif /* SPAGHETTI_MODULE_DRIVER_H */
