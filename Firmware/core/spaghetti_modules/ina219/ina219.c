#include "ina219.h"
#include <errno.h>
#include <zephyr/device.h>
#include <zephyr/devicetree.h>
#include <zephyr/drivers/sensor.h>

static const struct device *const ina219_device =
	DEVICE_DT_GET(DT_NODELABEL(ina219_test));

int spaghetti_ina219_test_init(void)
{
	if (!device_is_ready(ina219_device)) {
		return -ENODEV;
	}

	return 0;
}

int spaghetti_ina219_test_read(struct sensor_value *bus_voltage,
			       struct sensor_value *current,
			       struct sensor_value *power)
{
	int ret;

	if ((bus_voltage == NULL) || (current == NULL) || (power == NULL)) {
		return -EINVAL;
	}

	if (!device_is_ready(ina219_device)) {
		return -ENODEV;
	}

	struct sensor_value voltage_tmp;
	struct sensor_value current_tmp;
	struct sensor_value power_tmp;

	ret = sensor_sample_fetch(ina219_device);
	if (ret < 0) {
		return ret;
	}

	ret = sensor_channel_get(ina219_device, SENSOR_CHAN_VOLTAGE, &voltage_tmp);
	if (ret < 0) {
		return ret;
	}

	ret = sensor_channel_get(ina219_device, SENSOR_CHAN_CURRENT, &current_tmp);
	if (ret < 0) {
		return ret;
	}

	ret = sensor_channel_get(ina219_device, SENSOR_CHAN_POWER, &power_tmp);
	if (ret < 0) {
		return ret;
	}

	*bus_voltage = voltage_tmp;
	*current = current_tmp;
	*power = power_tmp;

	return 0;
}
