/**
 * @file
 * @brief Public Relay Module Driver configuration contract.
 * @ingroup spaghetti_relay
 */

#ifndef SPAGHETTI_RELAY_H
#define SPAGHETTI_RELAY_H

#include <stdbool.h>

struct spaghetti_module_driver;

/**
 * @brief Runtime configuration copied by one Relay Module instance.
 */
struct spaghetti_relay_config {
	bool active_high; /**< True when electrical high means logical ON. */
	bool safe_on; /**< Logical state imposed during init and deinit. */
};

/**
 * @brief Immutable Relay driver descriptor shared by all instances.
 */
extern const struct spaghetti_module_driver spaghetti_relay_driver;

#endif /* SPAGHETTI_RELAY_H */
