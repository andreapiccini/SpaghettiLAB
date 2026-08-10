#include <zephyr/kernel.h>
#include <zephyr/logging/log.h>

#include <ina219.h>

#include <spaghetti/core.h>
#include <spaghetti/module_manager.h>

LOG_MODULE_REGISTER(spaghetti_app, CONFIG_SPAGHETTI_APP_LOG_LEVEL);

/* Config replaces this bring-up request in TASK-090-01. */
static int run_module_manager_bringup(void)
{
	const struct spaghetti_ina219_config config = {
		.i2c_address = 0x40U,
		.shunt_milliohm = 100U,
		.current_lsb_microamp = 200U,
	};
	const struct spaghetti_module_request request = {
		.key = 1U,
		.port_id = 0U,
		.type_id = "ina219",
		.driver_config = &config,
		.driver_config_size = sizeof(config),
		.revision = 1U,
	};
	struct spaghetti_sample sample;
	spaghetti_module_id_t module_id;
	int err;

	err = spaghetti_module_manager_configure(&request, &module_id);
	if (err < 0) {
		return err;
	}

	err = spaghetti_module_manager_read(module_id, &sample);
	if (err < 0) {
		return err;
	}

	LOG_INF("INA219: key=1 id=%u bus=%d uV current=%d uA power=%u uW",
		(uint32_t)module_id, sample.bus_voltage_microvolts,
		sample.current_microamps, sample.power_microwatts);
	return 0;
}

int main(void)
{
	k_sleep(K_SECONDS(5));
	LOG_INF("Spaghetti LAB boot");

	int err = spaghetti_core_init();

	if (err < 0) {
		LOG_ERR("Spaghetti Core initialization failed: %d", err);
		return err;
	}

	err = run_module_manager_bringup();
	if (err < 0) {
		LOG_WRN("INA219 bring-up unavailable: err=%d", err);
	}

	return 0;
}
