#include <errno.h>
#include <stdbool.h>
#include <stdint.h>
#include <string.h>

#include <zephyr/settings/settings.h>
#include <zephyr/ztest.h>

#include <spaghetti/config.h>
#include <spaghetti/storage.h>

#define SPAGHETTI_TEST_SETTINGS_CAPACITY 2048U

extern const struct settings_handler_static
	settings_handler_spaghetti_storage;

static uint8_t persistent_bytes[SPAGHETTI_TEST_SETTINGS_CAPACITY];
static size_t persistent_size;
static bool persistent_present;
static int fake_read_error;
static int fake_save_error;

static ssize_t fake_settings_read(void *cb_arg, void *data, size_t len)
{
	const size_t *available = cb_arg;

	if (fake_read_error < 0) {
		return fake_read_error;
	}
	if (len > *available) {
		return -EINVAL;
	}

	memcpy(data, persistent_bytes, len);
	return (ssize_t)len;
}

int spaghetti_test_settings_subsys_init(void)
{
	return 0;
}

int spaghetti_test_settings_load_subtree(const char *subtree)
{
	if (strcmp(subtree, SPAGHETTI_STORAGE_CONFIG_KEY) != 0) {
		return -ENOENT;
	}
	if (!persistent_present) {
		return 0;
	}

	return settings_handler_spaghetti_storage.h_set(
		NULL, persistent_size, fake_settings_read, &persistent_size);
}

int spaghetti_test_settings_save_one(const char *name, const void *value,
				     size_t val_len)
{
	if (fake_save_error < 0) {
		return fake_save_error;
	}
	if ((strcmp(name, SPAGHETTI_STORAGE_CONFIG_KEY) != 0) ||
	    (value == NULL) || (val_len > sizeof(persistent_bytes))) {
		return -EINVAL;
	}

	memcpy(persistent_bytes, value, val_len);
	persistent_size = val_len;
	persistent_present = true;
	return 0;
}

static void set_module(struct spaghetti_module_config *module,
		       spaghetti_module_key_t key, uint8_t address)
{
	memset(module, 0, sizeof(*module));
	module->key = key;
	module->port_id = 0U;
	memcpy(module->type_id, "ina219", sizeof("ina219"));
	module->driver_config_size = sizeof(address);
	memcpy(module->driver_config, &address, sizeof(address));
}

static struct spaghetti_config make_config(void)
{
	struct spaghetti_config config = {
		.version = SPAGHETTI_CONFIG_VERSION,
		.module_count = 2U,
		.sampling = {
			.enabled = true,
			.source_key = 10U,
			.period_ms = 1000U,
		},
	};

	set_module(&config.modules[0], 10U, 0x40U);
	set_module(&config.modules[1], 11U, 0x41U);
	return config;
}

static int reload_fake_backend(void)
{
	return settings_handler_spaghetti_storage.h_set(
		NULL, persistent_size, fake_settings_read, &persistent_size);
}

ZTEST(storage, test_absent_round_trip_corruption_and_backend_errors)
{
	uint8_t valid_record[SPAGHETTI_TEST_SETTINGS_CAPACITY];
	struct spaghetti_config unchanged = {
		.version = 99U,
	};
	struct spaghetti_config output = unchanged;
	struct spaghetti_config config = make_config();
	size_t valid_size;

	zassert_equal(spaghetti_storage_read_config(&output), -EACCES);
	zassert_equal(spaghetti_storage_write_config(&config), -EACCES);
	zassert_ok(spaghetti_storage_init());
	zassert_equal(spaghetti_storage_init(), -EALREADY);
	zassert_equal(spaghetti_storage_read_config(&output), -ENOENT);
	zassert_mem_equal(&output, &unchanged, sizeof(output));

	zassert_ok(spaghetti_storage_write_config(&config));
	zassert_true(persistent_present);
	zassert_ok(spaghetti_storage_read_config(&output));
	zassert_equal(output.module_count, 2U);
	zassert_equal(output.modules[0].key, 10U);
	zassert_equal(output.modules[1].key, 11U);
	zassert_equal(output.modules[0].port_id, output.modules[1].port_id);
	zassert_equal(output.modules[0].driver_config[0], 0x40U);
	zassert_equal(output.modules[1].driver_config[0], 0x41U);
	zassert_equal(output.modules[2].key, 0U);
	zassert_equal(output.modules[0].driver_config[1], 0U);

	valid_size = persistent_size;
	memcpy(valid_record, persistent_bytes, valid_size);
	persistent_bytes[0] ^= 0xFFU;
	zassert_ok(reload_fake_backend());
	output = unchanged;
	zassert_equal(spaghetti_storage_read_config(&output), -EBADMSG);
	zassert_mem_equal(&output, &unchanged, sizeof(output));

	memcpy(persistent_bytes, valid_record, valid_size);
	persistent_bytes[sizeof(uint32_t)] ^= 0x01U;
	zassert_ok(reload_fake_backend());
	zassert_equal(spaghetti_storage_read_config(&output), -EBADMSG);

	memcpy(persistent_bytes, valid_record, valid_size);
	--persistent_size;
	zassert_ok(reload_fake_backend());
	zassert_equal(spaghetti_storage_read_config(&output), -EBADMSG);

	persistent_size = valid_size;
	fake_read_error = -EIO;
	zassert_ok(reload_fake_backend());
	zassert_equal(spaghetti_storage_read_config(&output), -EIO);
	fake_read_error = 0;
	zassert_ok(reload_fake_backend());
	zassert_ok(spaghetti_storage_read_config(&output));

	fake_save_error = -ENOSPC;
	config.sampling.period_ms = 2000U;
	zassert_equal(spaghetti_storage_write_config(&config), -ENOSPC);
	fake_save_error = 0;
	zassert_ok(spaghetti_storage_read_config(&output));
	zassert_equal(output.sampling.period_ms, 1000U);

	config.version = 99U;
	zassert_equal(spaghetti_storage_write_config(&config), -EINVAL);
}

ZTEST_SUITE(storage, NULL, NULL, NULL, NULL, NULL);
