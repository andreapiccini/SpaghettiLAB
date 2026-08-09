/**
 * @file
 * @brief Public INA219 API for the Spaghetti firmware.
 * @ingroup spaghetti_ina219
 */

#ifndef SPAGHETTI_INA219_H
#define SPAGHETTI_INA219_H

struct sensor_value;

/**
 * @brief Initialize the temporary INA219 test driver.
 *
 * Checks the statically defined Zephyr INA219 device. The function does not
 * take ownership of the device and does not modify caller-owned data.
 *
 * @retval 0 Initialization completed successfully.
 * @retval -ENODEV The INA219 device is unavailable or not ready.
 */
int spaghetti_ina219_test_init(void);

/**
 * @brief Read bus voltage, current, and power from the INA219.
 *
 * @param[out] bus_voltage Caller-owned bus voltage destination. It must remain
 *                         valid for the duration of the call.
 * @param[out] current Caller-owned current destination. It must remain valid
 *                     for the duration of the call.
 * @param[out] power Caller-owned power destination. It must remain valid for
 *                   the duration of the call.
 *
 * @retval 0 All three output values were written successfully.
 * @retval -EINVAL One or more output pointers are NULL.
 * @retval -ENODEV The INA219 device is unavailable or not ready.
 * @retval -EIO An I2C transfer failed.
 */
int spaghetti_ina219_test_read(struct sensor_value *bus_voltage,
			       struct sensor_value *current,
			       struct sensor_value *power);

#endif /* SPAGHETTI_INA219_H */
