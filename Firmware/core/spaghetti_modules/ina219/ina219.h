/**
 * @file
 * @brief Public INA219 API for the Spaghetti firmware.
 * @ingroup spaghetti_ina219
 */

#ifndef SPAGHETTI_INA219_H
#define SPAGHETTI_INA219_H

#include <spaghetti/module.h>
#include <stddef.h>

/**
 * @brief Unique identifier for a Spaghetti module driver.
 */
extern const struct spaghetti_module_driver spaghetti_ina219_driver;

/**
 * @brief Structure representing a sensor value from Zephyr's sensor API.
 *
 */
struct sensor_value;

/**
 * @brief Initialize the INA219 module.
 *
 * Initializes the INA219 module by checking if the device is
 * ready and performing any necessary setup.
 *
 * @param[in] module Pointer to the Spaghetti module structure.
 * @param[in] config Pointer to the configuration data for the INA219 module.
 * @param[in] config_size Size of the configuration data in bytes.
 *
 * @retval 0 Initialization completed successfully.
 * @retval -ENODEV The INA219 device is unavailable or not ready.
 */
int spaghetti_ina219_init(struct spaghetti_module *module,
							const void *config,
							size_t config_size);

/**
 * @brief Read bus voltage, current, and power from the INA219.
 *
 * @param[in] module Pointer to the Spaghetti module structure.
 * @param[out] out Pointer to the output structure for storing the sensor values.
 *
 * @retval 0 All three output values were written successfully.
 * @retval -EINVAL One or more output pointers are NULL.
 * @retval -ENODEV The INA219 device is unavailable or not ready.
 * @retval -EIO An I2C transfer failed.
 *
 */
int spaghetti_ina219_read(struct spaghetti_module *module,
							struct spaghetti_sample *out);

/**
 * @brief Deinitialize the INA219 module.
 *
 * Deinitializes the INA219 module by releasing any resources and performing cleanup.
 *
 * @param[in] module Pointer to the Spaghetti module structure.
 *
 */
int spaghetti_ina219_deinit(struct spaghetti_module *module);

#endif /* SPAGHETTI_INA219_H */
