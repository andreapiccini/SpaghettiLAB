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

#endif /* SPAGHETTI_PORT_H */
