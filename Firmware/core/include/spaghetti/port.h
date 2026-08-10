/**
 * @file
 * @brief Public Port API for the Spaghetti firmware.
 * @ingroup spaghetti_port
 */

#ifndef SPAGHETTI_PORT_H
#define SPAGHETTI_PORT_H

#include <stdbool.h>
#include <stddef.h>
#include <stdint.h>

#include <zephyr/sys/util.h>

/**
 * @brief Port identifier type.
 *
 * A Port ID is a small numeric identifier used by the firmware to refer to
 * a physical Spaghetti Port without exposing board-specific GPIO or MCU details.
 */
typedef uint8_t spaghetti_port_id_t;

/**
 * @brief Capabilities exposed by a Spaghetti Port.
 *
 * Capabilities are represented as individual bits so that a Port can expose
 * multiple capabilities at the same time.
 */
enum spaghetti_port_capability {
	SPAGHETTI_PORT_CAP_I2C = BIT(0), /**< I2C capability */
};

/*
 * Forward declarations.
 *
 * The full definition of struct spaghetti_port remains private to port.c.
 * struct device is provided by Zephyr and represents a device managed by
 * Zephyr's Device Model.
 */
struct spaghetti_port;
struct device;

/**
 * @brief Initialize all Spaghetti Ports.
 *
 * Initializes the Port subsystem and associates each Port with the hardware
 * resources required by the current board.
 *
 * @retval 0 Initialization completed successfully.
 * @retval -ENODEV A required hardware device is unavailable or not ready.
 */
int spaghetti_port_init_all(void);

/**
 * @brief Return the number of available Spaghetti Ports.
 *
 * @return Number of Ports exposed by the current Core.
 */
size_t spaghetti_port_count(void);

/**
 * @brief Get a Spaghetti Port by identifier.
 *
 * @param[in] id Port identifier.
 *
 * @return Pointer to the requested Port.
 * @return NULL if the identifier is invalid or the Port is unavailable.
 *
 * The returned object is owned by the Port subsystem and must not be modified
 * or freed by the caller.
 */
const struct spaghetti_port *spaghetti_port_get(spaghetti_port_id_t id);

/**
 * @brief Check whether a Port exposes a capability.
 *
 * @param[in] port Port to inspect.
 * @param[in] capabilities Nonzero capability bitmask that must be fully present.
 *
 * @return true if the Port exposes the requested capability.
 * @return false if it does not, or if @p port is NULL.
 */
bool spaghetti_port_has_capability(
	const struct spaghetti_port *port,
	uint32_t capabilities);

/**
 * @brief Return the Zephyr I2C device associated with a Port.
 *
 * @param[in] port Port to inspect.
 *
 * @return Pointer to the Zephyr I2C device used by the Port.
 * @return NULL if @p port is NULL, does not support I2C, or has no I2C device.
 *
 * The returned device is owned by Zephyr and must not be modified or freed by
 * the caller.
 */
const struct device *spaghetti_port_i2c_device(const struct spaghetti_port *port);

#endif /* SPAGHETTI_PORT_H */
