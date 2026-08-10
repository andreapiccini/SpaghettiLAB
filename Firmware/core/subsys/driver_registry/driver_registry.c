#include <spaghetti/driver_registry.h>

#include <errno.h>
#include <stdbool.h>
#include <string.h>

#include <zephyr/logging/log.h>
#include <zephyr/sys/util.h>

#include <spaghetti/module.h>
#include <spaghetti/module_driver.h>

#include <ina219.h>
#include <relay.h>

LOG_MODULE_REGISTER(spaghetti_driver_registry,
		    CONFIG_SPAGHETTI_DRIVER_REGISTRY_LOG_LEVEL);

static const struct spaghetti_module_driver *const drivers[] = {
	&spaghetti_ina219_driver,
	&spaghetti_relay_driver,
};

static bool type_id_is_valid(const char *type_id)
{
	if (type_id == NULL) {
		return false;
	}

	for (size_t char_idx = 0U; char_idx < SPAGHETTI_TYPE_ID_MAX; ++char_idx) {
		if (type_id[char_idx] == '\0') {
			return char_idx > 0U;
		}
	}

	return false;
}

int spaghetti_driver_registry_init(void)
{
	for (size_t driver_idx = 0U; driver_idx < ARRAY_SIZE(drivers); ++driver_idx) {
		const struct spaghetti_module_driver *driver = drivers[driver_idx];

		if ((driver == NULL) || !type_id_is_valid(driver->type_id) ||
		    (driver->required_capabilities == 0U) || (driver->ops == NULL) ||
		    (driver->ops->validate_config == NULL) ||
		    (driver->ops->describe_endpoint == NULL) ||
		    (driver->ops->init == NULL) ||
		    ((driver->ops->read == NULL) &&
		     (driver->ops->command == NULL)) ||
		    (driver->ops->deinit == NULL)) {
			return -EINVAL;
		}

		for (size_t other_idx = driver_idx + 1U;
		     other_idx < ARRAY_SIZE(drivers); ++other_idx) {
			const struct spaghetti_module_driver *other = drivers[other_idx];

			if ((other != NULL) && type_id_is_valid(other->type_id) &&
			    (strcmp(driver->type_id, other->type_id) == 0)) {
				return -EINVAL;
			}
		}
	}

	LOG_INF("ready: drivers=%u", (uint32_t)ARRAY_SIZE(drivers));
	return 0;
}

const struct spaghetti_module_driver *spaghetti_driver_registry_find(
	const char *type_id)
{
	if (!type_id_is_valid(type_id)) {
		return NULL;
	}

	for (size_t driver_idx = 0U; driver_idx < ARRAY_SIZE(drivers); ++driver_idx) {
		const struct spaghetti_module_driver *driver = drivers[driver_idx];

		if ((driver != NULL) && (strcmp(driver->type_id, type_id) == 0)) {
			return driver;
		}
	}

	return NULL;
}

size_t spaghetti_driver_registry_count(void)
{
	return ARRAY_SIZE(drivers);
}

const struct spaghetti_module_driver *spaghetti_driver_registry_get(size_t index)
{
	if (index >= ARRAY_SIZE(drivers)) {
		return NULL;
	}

	return drivers[index];
}
