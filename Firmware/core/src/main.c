#include <zephyr/kernel.h>
#include <zephyr/logging/log.h>

#include <ina219.h>

#include <spaghetti/core.h>
#include <spaghetti/module_manager.h>

LOG_MODULE_REGISTER(spaghetti_app, CONFIG_SPAGHETTI_APP_LOG_LEVEL);

static int configure_ina219(spaghetti_module_key_t key, uint8_t i2c_address,
			    spaghetti_module_id_t *out_id)
{
	const struct spaghetti_ina219_config config = {
		.i2c_address = i2c_address,
		.shunt_milliohm = 100U,
		.current_lsb_microamp = 200U,
	};
	const struct spaghetti_module_request request = {
		.key = key,
		.port_id = 0U,
		.type_id = "ina219",
		.driver_config = &config,
		.driver_config_size = sizeof(config),
		.revision = 1U,
	};

	return spaghetti_module_manager_configure(&request, out_id);
}

static int read_and_log_ina219(spaghetti_module_key_t key,
			       spaghetti_module_id_t module_id)
{
	struct spaghetti_sample sample;
	int err = spaghetti_module_manager_read(module_id, &sample);

	if (err < 0) {
		return err;
	}

	LOG_INF("INA219: key=%u id=%u bus=%d uV current=%d uA power=%u uW", key,
		(uint32_t)module_id, sample.bus_voltage_microvolts,
		sample.current_microamps, sample.power_microwatts);
	return 0;
}

/* Config replaces these bring-up requests in TASK-090-01. */
static int run_module_manager_bringup(void)
{
	spaghetti_module_id_t id_40;
	spaghetti_module_id_t id_41;
	int err;

	err = configure_ina219(10U, 0x40U, &id_40);
	if (err < 0) {
		return err;
	}

	err = configure_ina219(11U, 0x41U, &id_41);
	if (err < 0) {
		(void)spaghetti_module_manager_remove(id_40, 1U);
		return err;
	}

	err = read_and_log_ina219(10U, id_40);
	if (err < 0) {
		return err;
	}

	err = read_and_log_ina219(11U, id_41);
	if (err < 0) {
		return err;
	}

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
