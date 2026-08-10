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
 * @brief Unique identifier for a Spaghetti module.
 */
typedef uint8_t spaghetti_module_id_t;

#endif /* SPAGHETTI_MODULE_DRIVER_H */
