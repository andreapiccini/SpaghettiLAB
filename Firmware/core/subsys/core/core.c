#include <spaghetti/core.h>

#include <errno.h>

#include <zephyr/logging/log.h>

#include <spaghetti/config.h>
#include <spaghetti/data.h>
#include <spaghetti/driver_registry.h>
#include <spaghetti/module_manager.h>
#include <spaghetti/port.h>
#include <spaghetti/storage.h>

LOG_MODULE_REGISTER(spaghetti_core, CONFIG_SPAGHETTI_CORE_LOG_LEVEL);

static enum spaghetti_core_state core_state = SPAGHETTI_CORE_UNINITIALIZED;

static int load_persisted_config(void)
{
	struct spaghetti_config stored_config;
	int err = spaghetti_storage_init();

	if (err < 0) {
		LOG_ERR("Storage initialization failed: err=%d", err);
		return err;
	}

	err = spaghetti_storage_read_config(&stored_config);
	if (err == -ENOENT) {
		LOG_INF("no stored Config: first boot");
		return 0;
	}
	if (err == -EBADMSG) {
		LOG_WRN("stored Config is corrupt or incompatible; using safe empty state");
		return 0;
	}
	if (err < 0) {
		LOG_ERR("stored Config read failed: err=%d", err);
		return err;
	}

	err = spaghetti_config_validate(&stored_config);
	if (err < 0) {
		LOG_WRN("stored Config is semantically invalid: err=%d", err);
		return 0;
	}

	err = spaghetti_config_apply(&stored_config);
	if (err < 0) {
		LOG_ERR("stored Config apply failed: err=%d", err);
		return err;
	}

	LOG_INF("stored Config restored: modules=%u",
		(uint32_t)stored_config.module_count);
	return 0;
}

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

	ret = spaghetti_data_init();
	if (ret < 0) {
		core_state = SPAGHETTI_CORE_ERROR;
		LOG_ERR("Data initialization failed: err=%d", ret);
		return ret;
	}

	ret = load_persisted_config();
	if (ret < 0) {
		core_state = SPAGHETTI_CORE_ERROR;
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
