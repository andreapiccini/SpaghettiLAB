#include <errno.h>
#include <string.h>

#include <zephyr/kernel.h>
#include <zephyr/logging/log.h>

#include <ina219.h>

#include <spaghetti/config.h>
#include <spaghetti/core.h>
#include <spaghetti/module_manager.h>
#include <spaghetti/storage.h>

LOG_MODULE_REGISTER(spaghetti_app, CONFIG_SPAGHETTI_APP_LOG_LEVEL);

static void build_two_ina219_config(struct spaghetti_config *out)
{
	const struct spaghetti_ina219_config ina219_40 = {
		.i2c_address = 0x40U,
		.shunt_milliohm = 100U,
		.current_lsb_microamp = 200U,
	};
	const struct spaghetti_ina219_config ina219_41 = {
		.i2c_address = 0x41U,
		.shunt_milliohm = 100U,
		.current_lsb_microamp = 200U,
	};
	struct spaghetti_config config = {
		.version = SPAGHETTI_CONFIG_VERSION,
		.module_count = 2U,
		.modules = {
			{
				.key = 10U,
				.port_id = 0U,
				.type_id = "ina219",
				.driver_config_size = sizeof(ina219_40),
			},
			{
				.key = 11U,
				.port_id = 0U,
				.type_id = "ina219",
				.driver_config_size = sizeof(ina219_41),
			},
		},
		.sampling = {
			.enabled = true,
			.source_key = 10U,
			.period_ms = 1000U,
		},
	};

	memcpy(config.modules[0].driver_config, &ina219_40, sizeof(ina219_40));
	memcpy(config.modules[1].driver_config, &ina219_41, sizeof(ina219_41));
	*out = config;
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

static int run_config_bringup(void)
{
	struct spaghetti_module_snapshot module_40;
	struct spaghetti_module_snapshot module_41;
	struct spaghetti_config initial_config;
	int err;

	err = spaghetti_config_get_snapshot(&initial_config);
	if (err == -ENOENT) {
		build_two_ina219_config(&initial_config);
		err = spaghetti_config_apply(&initial_config);
		if (err < 0) {
			return err;
		}

		err = spaghetti_storage_write_config(&initial_config);
		if (err < 0) {
			return err;
		}
	} else if (err < 0) {
		return err;
	}

	err = spaghetti_module_manager_get_by_key(10U, &module_40);
	if (err < 0) {
		return err;
	}

	err = spaghetti_module_manager_get_by_key(11U, &module_41);
	if (err < 0) {
		return err;
	}

	err = read_and_log_ina219(module_40.key, module_40.id);
	if (err < 0) {
		return err;
	}

	return read_and_log_ina219(module_41.key, module_41.id);
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

	err = run_config_bringup();
	if (err < 0) {
		LOG_WRN("initial Config unavailable: err=%d", err);
	}

	return 0;
}
