/**
 * @file
 * @brief Port functionality for the Spaghetti firmware.
 * @ingroup spaghetti_port
 */

#ifndef SPAGHETTI_PORT_H
#define SPAGHETTI_PORT_H

#include <stdint.h>
#include <zephyr/sys/util.h>

/**
 * @brief Port identifier type.
 */
typedef uint8_t spaghetti_port_id_t;

/**
 * @brief Enumeration of the capabilities of a Spaghetti Port.
 */
enum spaghetti_port_capability {
	SPAGHETTI_PORT_CAP_I2C = BIT(0) /**< I2C capability bit. */
};

/**
 * @brief Port structure representing a Spaghetti Port.
 */
struct spaghetti_port;

/**
 * @brief Device structure representing a Spaghetti Port device.
 */
struct device;

/**
 * @brief Initialize all Spaghetti Ports.
 *
 * @retval 0 All Ports were initialized successfully.
 * @retval -ENODEV A required device is unavailable.
 * @retval -EIO A Port could not be initialized.
 */
int spaghetti_port_init_all(void);

/**
 * @brief Return the number of available Spaghetti Ports.
 *
 * @return Number of available Ports.
 */
size_t spaghetti_port_count(void);

/**
 * @brief Get a Spaghetti Port by ID.
 *
 * @param[in] port_id Port identifier in the range 0 to spaghetti_port_count() - 1.
 *
 * @return Pointer to the Port if it exists.
 * @return NULL if the Port ID is invalid or unavailable.
 */
const struct spaghetti_port * spaghetti_port_get(spaghetti_port_id_t port_id);

/**
 * @brief Check whether a Port supports a capability.
 *
 * @param[in] port Port to inspect.
 * @param[in] capability Capability to check.
 *
 * @return true if supported.
 * @return false otherwise.
 */
bool spaghetti_port_has_capability(
    const struct spaghetti_port * port,
    enum spaghetti_port_capability capability);

/**
 * @brief Get the Zephyr I2C device associated with a Port.
 *
 * @param[in] port Port to inspect.
 *
 * @return Pointer to the Zephyr I2C device.
 * @return NULL if the Port does not provide I2C.
 */
const struct device * spaghetti_port_i2c_device(const struct spaghetti_port * port);

#endif /* SPAGHETTI_PORT_H */
