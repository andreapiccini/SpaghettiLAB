#include <errno.h>
#include <stddef.h>
#include <stdint.h>

#include <zephyr/ztest.h>
#include <zephyr/sys/util.h>

#include <spaghetti/config.h>
#include <spaghetti/core.h>
#include <spaghetti/discovery.h>
#include <spaghetti/maintenance_link.h>
#include <spaghetti/module_manager.h>
#include <spaghetti/update.h>

enum init_step {
	STEP_STORAGE,
	STEP_UPDATE,
	STEP_MAINTENANCE_INIT,
	STEP_PORT,
	STEP_REGISTRY,
	STEP_MANAGER,
	STEP_DATA,
	STEP_CONFIG,
	STEP_RUNTIME,
	STEP_MQTT,
	STEP_DISCOVERY,
	STEP_WIFI,
	STEP_MAINTENANCE_ENTER,
	STEP_COMMUNICATION,
};

static enum init_step steps[16];
static size_t step_count;
static struct spaghetti_config initialized_defaults;
static int trial_confirm_count;

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

int spaghetti_update_init(void)
{
	return record_step(STEP_UPDATE);
}

int spaghetti_storage_read_config(struct spaghetti_config *out)
{
	zassert_not_null(out);
	if (IS_ENABLED(CONFIG_SPAGHETTI_TEST_CONFIG_ABSENT)) {
		return -ENOENT;
	}
	*out = (struct spaghetti_config) {
		.version = SPAGHETTI_CONFIG_VERSION,
		.module_count = 1U,
	};
	return 0;
}

int spaghetti_storage_consume_maintenance_once(bool *requested)
{
	zassert_not_null(requested);
	*requested = IS_ENABLED(CONFIG_SPAGHETTI_TEST_MAINTENANCE_MARKER);
	return 0;
}

int spaghetti_update_get_status(struct spaghetti_update_status *out)
{
	zassert_not_null(out);
	*out = (struct spaghetti_update_status) {
		.state = IS_ENABLED(CONFIG_SPAGHETTI_TEST_TRIAL_IMAGE) ?
			SPAGHETTI_UPDATE_TRIAL_BOOT : SPAGHETTI_UPDATE_IDLE,
		.active_slot = IS_ENABLED(CONFIG_SPAGHETTI_TEST_TRIAL_IMAGE) ? 1U : 0U,
		.image_confirmed = !IS_ENABLED(CONFIG_SPAGHETTI_TEST_TRIAL_IMAGE),
	};
	return 0;
}

int spaghetti_update_confirm_trial(void)
{
	++trial_confirm_count;
	return 0;
}

int spaghetti_maintenance_link_init(void)
{
	return record_step(STEP_MAINTENANCE_INIT);
}

int spaghetti_maintenance_link_probe(uint32_t timeout_ms, bool *requested)
{
	zassert_true(timeout_ms > 0U);
	zassert_not_null(requested);
	*requested = IS_ENABLED(CONFIG_SPAGHETTI_TEST_BOOTSTRAP_REQUEST);
	return 0;
}

int spaghetti_maintenance_link_enter(
	enum spaghetti_maintenance_entry_reason reason)
{
	if (IS_ENABLED(CONFIG_SPAGHETTI_TEST_CONFIG_ABSENT)) {
		zassert_equal(reason, SPAGHETTI_MAINTENANCE_CONFIG_ABSENT);
	} else if (IS_ENABLED(CONFIG_SPAGHETTI_TEST_MAINTENANCE_MARKER)) {
		zassert_equal(reason, SPAGHETTI_MAINTENANCE_REBOOT_REQUEST);
	} else {
		zassert_equal(reason, SPAGHETTI_MAINTENANCE_BOOTSTRAP_FRAME);
	}
	return record_step(STEP_MAINTENANCE_ENTER);
}

void spaghetti_core_boot_reboot(void)
{
	ztest_test_fail();
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

int spaghetti_wifi_profiles_init_offline(void)
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
	const bool maintenance =
		IS_ENABLED(CONFIG_SPAGHETTI_TEST_MAINTENANCE_MARKER) ||
		IS_ENABLED(CONFIG_SPAGHETTI_TEST_BOOTSTRAP_REQUEST);
	const bool normal = !IS_ENABLED(CONFIG_SPAGHETTI_TEST_CONFIG_ABSENT) &&
			    !maintenance;
	struct spaghetti_core_info info;

	zassert_equal(spaghetti_core_get_state(), SPAGHETTI_CORE_UNINITIALIZED);
	zassert_equal(spaghetti_core_get_info(&info), -EAGAIN);
	zassert_equal(spaghetti_core_get_info(NULL), -EINVAL);
	zassert_equal(spaghetti_core_start(), -EACCES);
	zassert_ok(spaghetti_core_init());
	zassert_equal(spaghetti_core_get_state(), SPAGHETTI_CORE_READY);
	zassert_ok(spaghetti_core_get_info(&info));
	zassert_equal(info.state, SPAGHETTI_CORE_READY);
	zassert_equal(info.mode,
		IS_ENABLED(CONFIG_SPAGHETTI_TEST_CONFIG_ABSENT) ?
			SPAGHETTI_CORE_MODE_UNPROVISIONED :
			maintenance ? SPAGHETTI_CORE_MODE_MAINTENANCE :
				      SPAGHETTI_CORE_MODE_NORMAL);
	zassert_equal(info.image_state,
		IS_ENABLED(CONFIG_SPAGHETTI_TEST_TRIAL_IMAGE) ?
			SPAGHETTI_CORE_IMAGE_TRIAL :
			SPAGHETTI_CORE_IMAGE_CONFIRMED);
	zassert_equal(strcmp(info.version, "1.2.3+4"), 0);
	zassert_equal(spaghetti_core_init(), -EALREADY);
	zassert_equal(step_count, normal ? 13U : 11U);
	zassert_equal(steps[0], STEP_STORAGE);
	zassert_equal(steps[1], STEP_UPDATE);
	zassert_equal(steps[2], STEP_MAINTENANCE_INIT);
	zassert_equal(steps[3], STEP_PORT);
	zassert_equal(steps[4], STEP_REGISTRY);
	zassert_equal(steps[5], STEP_MANAGER);
	zassert_equal(steps[6], STEP_DATA);
	zassert_equal(steps[7], STEP_CONFIG);
	zassert_equal(steps[step_count - 1U], STEP_COMMUNICATION);
	if (normal) {
		zassert_equal(steps[8], STEP_RUNTIME);
		zassert_equal(steps[9], STEP_MQTT);
		zassert_equal(steps[10], STEP_DISCOVERY);
		zassert_equal(steps[11], STEP_WIFI);
	} else {
		zassert_equal(steps[8], STEP_WIFI);
		zassert_equal(steps[9], STEP_MAINTENANCE_ENTER);
	}
	zassert_equal(initialized_defaults.version, SPAGHETTI_CONFIG_VERSION);
	zassert_equal(initialized_defaults.module_count, 0U);
	zassert_false(initialized_defaults.sampling.enabled);
	zassert_equal(initialized_defaults.sampling.period_ms, 1000U);

	zassert_ok(spaghetti_core_start());
	zassert_equal(spaghetti_core_get_state(), SPAGHETTI_CORE_RUNNING);
	zassert_ok(spaghetti_core_get_info(&info));
	zassert_equal(info.state, SPAGHETTI_CORE_RUNNING);
	zassert_equal(trial_confirm_count,
		IS_ENABLED(CONFIG_SPAGHETTI_TEST_TRIAL_IMAGE) ? 1 : 0);
	zassert_true(info.image_confirmed);
	zassert_equal(spaghetti_core_start(), -EACCES);
}

ZTEST_SUITE(core, NULL, NULL, NULL, NULL, NULL);
