#include "ina219.h"
#include <errno.h>
#include <zephyr/device.h>
#include <zephyr/devicetree.h>
#include <zephyr/drivers/sensor.h>
#include <spaghetti/port.h>
#include <spaghetti/module_driver.h>

static const struct device *const ina219_device =
	DEVICE_DT_GET(DT_NODELABEL(ina219_test));

static const struct spaghetti_module_driver_ops ina219_ops = {
	.init = spaghetti_ina219_init,
	.read = spaghetti_ina219_read,
	.deinit = spaghetti_ina219_deinit,
};

const struct spaghetti_module_driver spaghetti_ina219_driver = {
	.type_id = "ina219",
	.required_capabilities = SPAGHETTI_PORT_CAP_I2C,
	.ops = &ina219_ops,
};

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
	if (module == NULL || out == NULL) {
		return -EINVAL;
	}

	if(module->state != SPAGHETTI_MODULE_READY) {
		return -EINVAL;
	}

	if (module->port == NULL) {
		return -EINVAL;
	}

	const struct device *dev = spaghetti_port_i2c_device(module->port);

	if (dev == NULL) {
		return -ENODEV;
	}

	int err = sensor_sample_fetch(dev);

	if (err) {
		return err;
	}

	struct sensor_value bus_voltage;
	struct sensor_value current;
	struct sensor_value power;

	err = sensor_channel_get(dev, SENSOR_CHAN_VOLTAGE, &bus_voltage);

	if (err) {
		return err;
	}

	err = sensor_channel_get(dev, SENSOR_CHAN_CURRENT, &current);

	if (err) {
		return err;
	}

	err = sensor_channel_get(dev, SENSOR_CHAN_POWER, &power);

	if (err) {
		return err;
	}

	out->bus_voltage_microvolts = sensor_value_to_micro(&bus_voltage);
	out->current_microamps = sensor_value_to_micro(&current);
	out->power_microwatts = sensor_value_to_micro(&power);

	return 0;
}

int spaghetti_ina219_deinit(struct spaghetti_module *module)
{
	if (module == NULL) {
		return -EINVAL;
	}

	if (module->state != SPAGHETTI_MODULE_READY) {
		return -EINVAL;
	}

	module->context = NULL;
	module->state = SPAGHETTI_MODULE_UNINITIALIZED;

	return 0;
}
