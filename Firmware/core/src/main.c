#include <spaghetti/core.h>
#include <spaghetti/port.h>
#include <ina219.h>

#include <errno.h>

#include <zephyr/drivers/sensor.h>
#include <zephyr/kernel.h>
#include <zephyr/logging/log.h>

LOG_MODULE_REGISTER(
	spaghetti_app,
	CONFIG_SPAGHETTI_APP_LOG_LEVEL
);

int main(void)
{
	k_sleep(K_SECONDS(5));
	LOG_INF("Spaghetti LAB boot");

	const struct spaghetti_port *port;
	const struct device *i2c;
	struct sensor_value bus_voltage;
	struct sensor_value current;
	struct sensor_value power;
	int err = spaghetti_core_init();

	if (err < 0) {
		LOG_ERR("Spaghetti Core initialization failed: %d", err);
		return err;
	}

	port = spaghetti_port_get(0U);
	i2c = spaghetti_port_i2c_device(port);

	if (i2c == NULL) {
		LOG_ERR("Port 0 has no ready I2C device");
		return -ENODEV;
	}

	err = spaghetti_ina219_test_init();
	if (err < 0) {
		LOG_ERR("INA219 initialization failed: %d", err);
		return err;
	}

	for (;;) {
		err = spaghetti_ina219_test_read(&bus_voltage, &current, &power);

		if (err == 0) {
			LOG_INF("INA219 bus=%lld mV current=%lld mA power=%lld mW",
				(long long)sensor_value_to_milli(&bus_voltage),
				(long long)sensor_value_to_milli(&current),
				(long long)sensor_value_to_milli(&power));
		} else {
			LOG_ERR("INA219 read failed: %d", err);
		}

		k_sleep(K_SECONDS(1));
	}

	return 0;
}
