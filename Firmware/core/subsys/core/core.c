#include <spaghetti/core.h>

#include <zephyr/logging/log.h>

#include <spaghetti/driver_registry.h>
#include <spaghetti/module_manager.h>
#include <spaghetti/port.h>

LOG_MODULE_REGISTER(spaghetti_core, CONFIG_SPAGHETTI_CORE_LOG_LEVEL);

static enum spaghetti_core_state core_state = SPAGHETTI_CORE_UNINITIALIZED;

int spaghetti_core_init(void)
{
	int ret;

	ret = spaghetti_port_init_all();
	if (ret < 0) {
		core_state = SPAGHETTI_CORE_ERROR;
		LOG_ERR("Port initialization failed: err=%d", ret);
		return ret;
	}

	ret = spaghetti_driver_registry_init();
	if (ret < 0) {
		core_state = SPAGHETTI_CORE_ERROR;
		LOG_ERR("Driver Registry initialization failed: err=%d", ret);
		return ret;
	}

	ret = spaghetti_module_manager_init();
	if (ret < 0) {
		core_state = SPAGHETTI_CORE_ERROR;
		LOG_ERR("Module Manager initialization failed: err=%d", ret);
		return ret;
	}

	core_state = SPAGHETTI_CORE_READY;

	LOG_INF("Spaghetti Core ready");
	return 0;
}

enum spaghetti_core_state spaghetti_core_get_state(void)
{
	return core_state;
}
