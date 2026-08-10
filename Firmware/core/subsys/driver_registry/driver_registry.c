#include <spaghetti/driver_registry.h>
#include <spaghetti/module_driver.h>
#include <errno.h>
#include <zephyr/sys/util.h>
#include <ina219.h>

static const struct spaghetti_module_driver *const drivers[] = {
	&spaghetti_ina219_driver,
};

/* Check the driver registry for valid drivers and if is unique */
int spaghetti_driver_registry_init(void){

	for(size_t idx = 0; idx < ARRAY_SIZE(drivers); idx++){
		const struct spaghetti_module_driver *driver = drivers[idx];

		if (driver == NULL) {
			return -EINVAL;
		}

		if (driver->type_id == NULL || driver->type_id[0] == '\0') {
			return -EINVAL;
		}

		if (driver->ops == NULL) {
			return -EINVAL;
		}

		if (driver->required_capabilities == 0U) {
			return -EINVAL;
		}

        /* Now we check if the driver is unique */
		for(size_t jdx = 1; jdx < ARRAY_SIZE(drivers); jdx++){
			const struct spaghetti_module_driver *other = drivers[jdx];

		if (other != NULL &&
            (other->type_id != NULL && other->type_id[0] != '\0') &&
			strcmp(driver->type_id, other->type_id) == 0) {

				return -EEXIST;
			}
		}
	}

	return 0;
}

/* Find a driver by its type ID and return a pointer to it */
const struct spaghetti_module_driver *
spaghetti_driver_registry_find(const char *type_id){

	if(type_id == NULL || type_id[0] == '\0'){
		return NULL;
	}

	for(size_t idx = 0; idx < ARRAY_SIZE(drivers); idx ++){
		const struct spaghetti_module_driver *driver = drivers[idx];

		if (driver == NULL) {
			continue;
		}

		if(driver->type_id != NULL &&
            strcmp(driver->type_id, type_id) == 0){
				return driver;
		}
	}

	return NULL;
}

size_t spaghetti_driver_registry_count(void){
	return ARRAY_SIZE(drivers);
}
