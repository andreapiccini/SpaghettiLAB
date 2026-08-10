#include <spaghetti/port.h>

#include <errno.h>

#include <zephyr/device.h>
#include <zephyr/devicetree.h>
#include <zephyr/drivers/gpio.h>
#include <zephyr/logging/log.h>
#include <zephyr/sys/util.h>

LOG_MODULE_REGISTER(spaghetti_port, CONFIG_SPAGHETTI_PORT_LOG_LEVEL);

struct spaghetti_port {
	spaghetti_port_id_t id;
	uint32_t capabilities;
	const struct device *i2c;
	const struct gpio_dt_spec *output;
};

static struct spaghetti_port ports[] = {
	{
		.id = 0U,
		.capabilities = SPAGHETTI_PORT_CAP_I2C,
		.i2c = NULL,
		.output = NULL,
	},
};

int spaghetti_port_init_all(void)
{
	ports[0].i2c = DEVICE_DT_GET(DT_NODELABEL(i2c0));

	if (!device_is_ready(ports[0].i2c)) {
		ports[0].i2c = NULL;
		return -ENODEV;
	}

	return 0;
}

size_t spaghetti_port_count(void)
{
	return ARRAY_SIZE(ports);
}

const struct spaghetti_port *spaghetti_port_get(spaghetti_port_id_t id)
{
	if (id >= spaghetti_port_count()) {
		return NULL;
	}

	return &ports[id];
}

bool spaghetti_port_has_capability(
	const struct spaghetti_port *port,
	uint32_t capabilities)
{
	if ((port == NULL) || (capabilities == 0U)) {
		return false;
	}

	return (port->capabilities & capabilities) == capabilities;
}

const struct device *spaghetti_port_i2c_device(const struct spaghetti_port *port)
{
	if ((port == NULL) ||
	    !spaghetti_port_has_capability(port, SPAGHETTI_PORT_CAP_I2C) ||
	    (port->i2c == NULL)) {
		return NULL;
	}

	return port->i2c;
}

int spaghetti_port_set_output(const struct spaghetti_port *port, bool high)
{
	if (port == NULL) {
		return -EINVAL;
	}
	if (!spaghetti_port_has_capability(
		    port, SPAGHETTI_PORT_CAP_DIGITAL_OUTPUT) ||
	    (port->output == NULL)) {
		return -ENOTSUP;
	}
	if (!gpio_is_ready_dt(port->output)) {
		return -ENODEV;
	}

	return gpio_pin_set_raw(port->output->port, port->output->pin,
				high ? 1 : 0);
}
