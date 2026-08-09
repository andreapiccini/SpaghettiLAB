#include <spaghetti/port.h>
#include <errno.h>
#include <zephyr/device.h>
#include <zephyr/devicetree.h>
#include <zephyr/sys/util.h>

LOG_MODULE_REGISTER(
    spaghetti_port,
    CONFIG_SPAGHETTI_PORT_LOG_LEVEL
);

struct spaghetti_port {
	spaghetti_port_id_t id;
	uint32_t capabilities;
	const struct device *i2c;
};

static struct spaghetti_port ports[] = {
	{
		.id = 0U,
		.capabilities = SPAGHETTI_PORT_CAP_I2C,
		.i2c = NULL,
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
	enum spaghetti_port_capability capability)
{
	if (port == NULL) {
		return false;
	}

	return (port->capabilities & capability) != 0U;
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
