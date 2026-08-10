#include "ina219.h"
#include <errno.h>
#include <zephyr/device.h>
#include <zephyr/devicetree.h>
#include <zephyr/drivers/sensor.h>
#include <spaghetti/port.h>

static const struct device *const ina219_device =
	DEVICE_DT_GET(DT_NODELABEL(ina219_test));

int spaghetti_ina219_init(struct spaghetti_module *module,
							const void *config,
							size_t config_size)
{
	if (module == NULL) {
		return -EINVAL;
	}

	module->state = SPAGHETTI_MODULE_ERROR;

	if (module->driver == NULL) {
		return -EINVAL;
	}

	if (config != NULL || config_size != 0U) {
		return -EINVAL;
	}

	if (module->port == NULL) {
		return -EINVAL;
	}

	if(spaghetti_port_has_capability(module->port, SPAGHETTI_PORT_CAP_I2C)) {
		if (!device_is_ready(ina219_device)) {
			return -ENODEV;
		}
		module->state = SPAGHETTI_MODULE_READY;
	}
	else {
		return -ENODEV;
	}

	return 0;
}

int spaghetti_ina219_read(struct spaghetti_module *module,
							struct spaghetti_sample *out)
{
	return 0;
}

int spaghetti_ina219_deinit(struct spaghetti_module *module)
{
	/* No specific deinitialization required for the INA219 device in this context */
	return 0;
}
