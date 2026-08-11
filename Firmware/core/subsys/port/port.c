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

#define SPAGHETTI_PORT_VALIDATE(node_id) \
	BUILD_ASSERT(DT_REG_ADDR(node_id) <= UINT8_MAX, \
		     "Spaghetti Port ID must fit spaghetti_port_id_t");

#define SPAGHETTI_PORT_DEFINE(node_id) \
	{ \
		.id = DT_REG_ADDR(node_id), \
		.capabilities = SPAGHETTI_PORT_CAP_I2C, \
		.i2c = DEVICE_DT_GET(DT_PHANDLE(node_id, i2c)), \
		.output = NULL, \
	},

DT_FOREACH_STATUS_OKAY(spaghettilab_port, SPAGHETTI_PORT_VALIDATE)

static const struct spaghetti_port ports[] = {
	DT_FOREACH_STATUS_OKAY(spaghettilab_port, SPAGHETTI_PORT_DEFINE)
};

BUILD_ASSERT(ARRAY_SIZE(ports) > 0U,
	     "The selected Core board must expose a Spaghetti Port");

int spaghetti_port_init_all(void)
{
	for (size_t port_idx = 0U; port_idx < ARRAY_SIZE(ports); ++port_idx) {
		if (!device_is_ready(ports[port_idx].i2c)) {
			return -ENODEV;
		}
	}

	return 0;
}

size_t spaghetti_port_count(void)
{
	return ARRAY_SIZE(ports);
}

const struct spaghetti_port *spaghetti_port_get(spaghetti_port_id_t id)
{
	for (size_t port_idx = 0U; port_idx < ARRAY_SIZE(ports); ++port_idx) {
		if (ports[port_idx].id == id) {
			return &ports[port_idx];
		}
	}

	return NULL;
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
