#include "port_backend.h"

#include <errno.h>

#include <zephyr/logging/log.h>
#include <zephyr/sys/util.h>

LOG_MODULE_REGISTER(spaghetti_port_backend,
		    CONFIG_SPAGHETTI_PORT_LOG_LEVEL);

int spaghetti_port_backend_select(
	spaghetti_port_id_t port_id,
	enum spaghetti_port_transport transport)
{
	ARG_UNUSED(port_id);

	/*
	 * Core V1 wires I2C through static Devicetree pinctrl. Runtime mux is
	 * not present, so only I2C may be selected and no pinctrl switch runs.
	 */
	if (transport != SPAGHETTI_PORT_TRANSPORT_I2C) {
		return -ENOTSUP;
	}

	return 0;
}

int spaghetti_port_backend_safe(spaghetti_port_id_t port_id)
{
	ARG_UNUSED(port_id);

	/* I2C remains the fixed board wiring; safe-state is a documented no-op. */
	return 0;
}
