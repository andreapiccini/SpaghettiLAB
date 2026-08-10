#include <errno.h>
#include <stdbool.h>
#include <stdint.h>
#include <string.h>

#include <zephyr/sys/util.h>
#include <zephyr/ztest.h>

#include <spaghetti/config.h>
#include <spaghetti/driver_registry.h>
#include <spaghetti/module_driver.h>
#include <spaghetti/module_manager.h>
#include <spaghetti/port.h>
#include <spaghetti/runtime.h>

struct spaghetti_port {
	spaghetti_port_id_t id;
	uint32_t capabilities;
};

struct fake_driver_config {
	uint8_t i2c_address;
	int init_error;
};

struct fake_driver_context {
	bool used;
	uint8_t i2c_address;
};

static const struct spaghetti_port fake_port = {
	.id = 0U,
	.capabilities = SPAGHETTI_PORT_CAP_I2C,
};

static struct fake_driver_context fake_contexts[CONFIG_SPAGHETTI_MAX_MODULES];
static struct spaghetti_runtime_sampling_task fake_runtime_task;
static bool fake_runtime_running;
static uint32_t fake_runtime_start_count;
static uint32_t fake_runtime_stop_count;

int spaghetti_runtime_load(const struct spaghetti_runtime_sampling_task *task)
{
	if (task == NULL) {
		return -EINVAL;
	}
	if (fake_runtime_running) {
		return -EBUSY;
	}

	fake_runtime_task = *task;
	return 0;
}

int spaghetti_runtime_start(void)
{
	if (fake_runtime_running) {
		return -EALREADY;
	}
	if (!fake_runtime_task.enabled) {
		return -ENOENT;
	}

	fake_runtime_running = true;
	++fake_runtime_start_count;
	return 0;
}

int spaghetti_runtime_stop(k_timeout_t timeout)
{
	ARG_UNUSED(timeout);

	if (!fake_runtime_running) {
		return -EALREADY;
	}

	fake_runtime_running = false;
	++fake_runtime_stop_count;
	return 0;
}

static int fake_validate_config(const void *config, size_t config_size)
{
	struct fake_driver_config fake_config;

	if ((config == NULL) || (config_size != sizeof(fake_config))) {
		return -EINVAL;
	}

	memcpy(&fake_config, config, sizeof(fake_config));
	return (fake_config.i2c_address <= 0x7FU) ? 0 : -EINVAL;
}

static int fake_describe_endpoint(const void *config, size_t config_size,
				  struct spaghetti_module_endpoint *out)
{
	struct fake_driver_config fake_config;
	int err;

	if (out == NULL) {
		return -EINVAL;
	}

	err = fake_validate_config(config, config_size);
	if (err < 0) {
		return err;
	}

	memcpy(&fake_config, config, sizeof(fake_config));
	const struct spaghetti_module_endpoint endpoint = {
		.kind = SPAGHETTI_ENDPOINT_I2C_ADDRESS,
		.value = fake_config.i2c_address,
	};

	*out = endpoint;
	return 0;
}

static int fake_init(struct spaghetti_module *module, const void *config,
		     size_t config_size)
{
	struct fake_driver_config fake_config;
	int err = fake_validate_config(config, config_size);

	if ((err < 0) || (module == NULL) || (module->context != NULL)) {
		return (err < 0) ? err : -EINVAL;
	}

	memcpy(&fake_config, config, sizeof(fake_config));
	if (fake_config.init_error < 0) {
		return fake_config.init_error;
	}

	for (size_t context_idx = 0U; context_idx < ARRAY_SIZE(fake_contexts);
	     ++context_idx) {
		if (!fake_contexts[context_idx].used) {
			fake_contexts[context_idx].used = true;
			fake_contexts[context_idx].i2c_address =
				fake_config.i2c_address;
			module->context = &fake_contexts[context_idx];
			return 0;
		}
	}

	return -ENOMEM;
}

static int fake_read(struct spaghetti_module *module,
		     struct spaghetti_sample *out)
{
	ARG_UNUSED(module);
	ARG_UNUSED(out);
	return -ENOTSUP;
}

static int fake_deinit(struct spaghetti_module *module)
{
	struct fake_driver_context *context;

	if ((module == NULL) || (module->context == NULL)) {
		return -EINVAL;
	}

	context = module->context;
	memset(context, 0, sizeof(*context));
	module->context = NULL;
	return 0;
}

static const struct spaghetti_module_driver_ops fake_ops = {
	.validate_config = fake_validate_config,
	.describe_endpoint = fake_describe_endpoint,
	.init = fake_init,
	.read = fake_read,
	.deinit = fake_deinit,
};

static const struct spaghetti_module_driver fake_driver = {
	.type_id = "fake",
	.required_capabilities = SPAGHETTI_PORT_CAP_I2C,
	.ops = &fake_ops,
};

const struct spaghetti_port *spaghetti_port_get(spaghetti_port_id_t id)
{
	return (id == fake_port.id) ? &fake_port : NULL;
}

bool spaghetti_port_has_capability(const struct spaghetti_port *port,
				    uint32_t capabilities)
{
	return (port != NULL) && (capabilities != 0U) &&
	       ((port->capabilities & capabilities) == capabilities);
}

const struct spaghetti_module_driver *spaghetti_driver_registry_find(
	const char *type_id)
{
	if ((type_id != NULL) && (strcmp(type_id, fake_driver.type_id) == 0)) {
		return &fake_driver;
	}

	return NULL;
}

static void set_module(struct spaghetti_module_config *module,
		       spaghetti_module_key_t key, uint8_t address,
		       int init_error)
{
	const struct fake_driver_config driver_config = {
		.i2c_address = address,
		.init_error = init_error,
	};

	memset(module, 0, sizeof(*module));
	module->key = key;
	module->port_id = 0U;
	memcpy(module->type_id, "fake", sizeof("fake"));
	module->driver_config_size = sizeof(driver_config);
	memcpy(module->driver_config, &driver_config, sizeof(driver_config));
}

static struct spaghetti_config make_config(uint8_t first_address,
					   uint8_t second_address)
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

	set_module(&config.modules[0], 10U, first_address, 0);
	set_module(&config.modules[1], 11U, second_address, 0);
	return config;
}

static void assert_live_endpoint(spaghetti_module_key_t key, uint32_t endpoint)
{
	struct spaghetti_module_snapshot live;

	zassert_ok(spaghetti_module_manager_get_by_key(key, &live));
	zassert_equal(live.endpoint.kind, SPAGHETTI_ENDPOINT_I2C_ADDRESS);
	zassert_equal(live.endpoint.value, endpoint);
}

ZTEST(config, test_validation_reconcile_and_rollback)
{
	struct spaghetti_module_snapshot key_11_before;
	struct spaghetti_module_snapshot key_11_after;
	struct spaghetti_config snapshot;
	struct spaghetti_config baseline = make_config(0x40U, 0x41U);
	struct spaghetti_config candidate;

	zassert_ok(spaghetti_module_manager_init());
	zassert_equal(spaghetti_config_get_snapshot(&snapshot), -ENOENT);
	zassert_ok(spaghetti_config_validate(&baseline));
	zassert_ok(spaghetti_config_apply(&baseline));
	zassert_true(fake_runtime_running);
	zassert_equal(fake_runtime_task.period_ms, 1000U);
	zassert_equal(fake_runtime_start_count, 1U);
	zassert_ok(spaghetti_config_get_snapshot(&snapshot));
	zassert_equal(snapshot.module_count, 2U);
	assert_live_endpoint(10U, 0x40U);
	assert_live_endpoint(11U, 0x41U);

	candidate = baseline;
	candidate.modules[1].key = 10U;
	zassert_equal(spaghetti_config_validate(&candidate), -EEXIST);

	candidate = baseline;
	set_module(&candidate.modules[1], 11U, 0x40U, 0);
	zassert_equal(spaghetti_config_validate(&candidate), -EADDRINUSE);

	candidate = baseline;
	candidate.sampling.source_key = 99U;
	zassert_equal(spaghetti_config_validate(&candidate), -EINVAL);
	assert_live_endpoint(10U, 0x40U);
	assert_live_endpoint(11U, 0x41U);

	candidate = baseline;
	set_module(&candidate.modules[1], 11U, 0x42U, -EIO);
	zassert_equal(spaghetti_config_apply(&candidate), -EIO);
	zassert_true(fake_runtime_running);
	zassert_equal(fake_runtime_start_count, 2U);
	zassert_equal(fake_runtime_stop_count, 1U);
	zassert_ok(spaghetti_config_get_snapshot(&snapshot));
	zassert_mem_equal(&snapshot, &baseline, sizeof(snapshot));
	assert_live_endpoint(10U, 0x40U);
	assert_live_endpoint(11U, 0x41U);

	zassert_ok(spaghetti_module_manager_get_by_key(11U, &key_11_before));
	candidate = baseline;
	candidate.module_count = 2U;
	candidate.modules[0] = baseline.modules[1];
	set_module(&candidate.modules[1], 12U, 0x42U, 0);
	candidate.sampling.source_key = 11U;
	zassert_ok(spaghetti_config_apply(&candidate));
	zassert_true(fake_runtime_running);
	zassert_equal(fake_runtime_start_count, 3U);
	zassert_equal(fake_runtime_stop_count, 2U);
	zassert_equal(spaghetti_module_manager_get_by_key(10U, &key_11_after),
		      -ENOENT);
	zassert_ok(spaghetti_module_manager_get_by_key(11U, &key_11_after));
	zassert_equal(key_11_after.id, key_11_before.id);
	assert_live_endpoint(11U, 0x41U);
	assert_live_endpoint(12U, 0x42U);
	zassert_ok(spaghetti_config_get_snapshot(&snapshot));
	zassert_equal(snapshot.sampling.source_key, 11U);
}

ZTEST_SUITE(config, NULL, NULL, NULL, NULL, NULL);
