#include <errno.h>
#include <stddef.h>
#include <stdint.h>

#include <zephyr/ztest.h>

#include <spaghetti/config.h>
#include <spaghetti/core.h>
#include <spaghetti/discovery.h>
#include <spaghetti/module_manager.h>

enum init_step {
	STEP_PORT,
	STEP_REGISTRY,
	STEP_MANAGER,
	STEP_DATA,
	STEP_RUNTIME,
	STEP_MQTT,
	STEP_STORAGE,
	STEP_DISCOVERY,
	STEP_CONFIG,
	STEP_WIFI,
	STEP_COMMUNICATION,
};

static enum init_step steps[16];
static size_t step_count;
static struct spaghetti_config initialized_defaults;

static int record_step(enum init_step step)
{
	steps[step_count] = step;
	++step_count;
	return 0;
}

int spaghetti_port_init_all(void)
{
	return record_step(STEP_PORT);
}

int spaghetti_driver_registry_init(void)
{
	return record_step(STEP_REGISTRY);
}

int spaghetti_module_manager_init(void)
{
	return record_step(STEP_MANAGER);
}

int spaghetti_data_init(void)
{
	return record_step(STEP_DATA);
}

int spaghetti_runtime_init(void)
{
	return record_step(STEP_RUNTIME);
}

int spaghetti_mqtt_init(const struct spaghetti_mqtt_config *config)
{
	zassert_not_null(config);
	zassert_false(config->enabled);
	return record_step(STEP_MQTT);
}

int spaghetti_storage_init(void)
{
	return record_step(STEP_STORAGE);
}

int spaghetti_storage_read_config(struct spaghetti_config *out)
{
	zassert_not_null(out);
	*out = (struct spaghetti_config) {
		.version = SPAGHETTI_CONFIG_VERSION,
		.module_count = 1U,
	};
	return 0;
}

int spaghetti_discovery_init(spaghetti_discovery_sink_t sink, void *user_data)
{
	ARG_UNUSED(user_data);
	zassert_not_null(sink);
	return record_step(STEP_DISCOVERY);
}

int spaghetti_config_init(const struct spaghetti_config *defaults)
{
	zassert_not_null(defaults);
	initialized_defaults = *defaults;
	return record_step(STEP_CONFIG);
}

int spaghetti_config_validate(const struct spaghetti_config *candidate,
			      struct spaghetti_config_error *error)
{
	ARG_UNUSED(error);
	return (candidate != NULL) ? 0 : -EINVAL;
}

int spaghetti_wifi_profiles_init(void)
{
	return record_step(STEP_WIFI);
}

int spaghetti_communication_init(void)
{
	return record_step(STEP_COMMUNICATION);
}

int spaghetti_config_get_snapshot(struct spaghetti_config *out,
				  uint32_t *generation)
{
	if ((out == NULL) || (generation == NULL)) {
		return -EINVAL;
	}

	*out = initialized_defaults;
	*generation = 1U;
	return 0;
}

int spaghetti_config_apply(const struct spaghetti_config *candidate,
			   uint32_t expected_generation)
{
	zassert_not_null(candidate);
	zassert_equal(candidate->module_count, 1U);
	zassert_equal(expected_generation, 1U);
	return -ENODEV;
}

int spaghetti_module_manager_configure(
	const struct spaghetti_module_request *request,
	spaghetti_module_id_t *out_id)
{
	ARG_UNUSED(request);
	ARG_UNUSED(out_id);
	return -ENOTSUP;
}

int spaghetti_module_manager_get_by_key(
	spaghetti_module_key_t key,
	struct spaghetti_module_snapshot *out)
{
	ARG_UNUSED(key);
	ARG_UNUSED(out);
	return -ENOENT;
}

int spaghetti_module_manager_remove(spaghetti_module_id_t id,
				    uint32_t expected_revision)
{
	ARG_UNUSED(id);
	ARG_UNUSED(expected_revision);
	return -ENOENT;
}

ZTEST(core, test_boot_order_and_nonfatal_stored_config_failure)
{
	zassert_equal(spaghetti_core_get_state(), SPAGHETTI_CORE_UNINITIALIZED);
	zassert_equal(spaghetti_core_start(), -EACCES);
	zassert_ok(spaghetti_core_init());
	zassert_equal(spaghetti_core_get_state(), SPAGHETTI_CORE_READY);
	zassert_equal(spaghetti_core_init(), -EALREADY);
	zassert_equal(step_count, 11U);
	for (size_t step_idx = 0U; step_idx < step_count; ++step_idx) {
		zassert_equal(steps[step_idx], (enum init_step)step_idx);
	}
	zassert_equal(initialized_defaults.version, SPAGHETTI_CONFIG_VERSION);
	zassert_equal(initialized_defaults.module_count, 0U);
	zassert_false(initialized_defaults.sampling.enabled);
	zassert_equal(initialized_defaults.sampling.period_ms, 1000U);

	zassert_ok(spaghetti_core_start());
	zassert_equal(spaghetti_core_get_state(), SPAGHETTI_CORE_RUNNING);
	zassert_equal(spaghetti_core_start(), -EACCES);
}

ZTEST_SUITE(core, NULL, NULL, NULL, NULL, NULL);
