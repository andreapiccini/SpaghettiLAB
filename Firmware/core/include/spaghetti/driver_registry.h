/**
 * @file
 * @brief Public Driver Registry API for the Spaghetti firmware.
 * @ingroup spaghetti_driver_registry
 */

#ifndef SPAGHETTI_DRIVER_REGISTRY_H
#define SPAGHETTI_DRIVER_REGISTRY_H

#include <stddef.h>

/**
 * @brief Initializes the driver registry.
 *
 * Validate every descriptor and reject duplicate type IDs.
 * Ensure that driver in the "catalog" are unique and valid.
 *
 * @retval -EINVAL if the input is invalid.
 * @retval 0 on success, or a negative error code on failure.
 */
int spaghetti_driver_registry_init(void);

/**
 * @brief Finds a driver in the registry by its type ID.
 *
 * This function searches the driver registry for a driver with the specified type ID.
 *
 * @param[in] type_id The type ID of the driver to find.
 * @retval A pointer to the found driver, or NULL if not found.
 */
const struct spaghetti_module_driver *spaghetti_driver_registry_find(const char *type_id);

/**
 * @brief Counts the number of drivers in the registry.
 *
 * This function returns the number of drivers currently registered.
 *
 * @return size_t The number of drivers in the registry.
 */
size_t spaghetti_driver_registry_count(void);

#endif /* SPAGHETTI_DRIVER_REGISTRY_H */
