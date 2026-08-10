/**
 * @file
 * @brief Public INA219 Module Driver contract for the Spaghetti firmware.
 * @ingroup spaghetti_ina219
 */

#ifndef SPAGHETTI_INA219_H
#define SPAGHETTI_INA219_H

#include <stdint.h>

struct spaghetti_module_driver;

/**
 * @brief Runtime configuration copied by one INA219 Module instance.
 */
struct spaghetti_ina219_config {
	uint8_t i2c_address; /**< INA219 7-bit address in the inclusive range 0x40-0x4F. */
	uint16_t shunt_milliohm; /**< Positive physical shunt resistance in milliohms. */
	uint16_t current_lsb_microamp; /**< Positive current-register weight in microamps. */
};

/**
 * @brief Immutable INA219 driver descriptor.
 *
 * The Registry owns no instance state. This descriptor has firmware lifetime
 * and is shared by every configured INA219 Module.
 */
extern const struct spaghetti_module_driver spaghetti_ina219_driver;

#endif /* SPAGHETTI_INA219_H */
