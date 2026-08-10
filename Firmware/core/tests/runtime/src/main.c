#include <errno.h>
#include <stdbool.h>
#include <stdint.h>

#include <zephyr/kernel.h>
#include <zephyr/zbus/zbus.h>
#include <zephyr/ztest.h>

#include <spaghetti/data.h>
#include <spaghetti/module_driver.h>
#include <spaghetti/module_manager.h>
#include <spaghetti/runtime.h>

ZBUS_OBS_DECLARE(electrical_logger_subscriber,
		 electrical_test_subscriber);

static bool block_read;
static int command_error;
static uint32_t read_count;
static uint32_t command_count;
static bool last_command_on;
K_SEM_DEFINE(read_entered_sem, 0, 1);
K_SEM_DEFINE(read_release_sem, 0, 1);
K_SEM_DEFINE(command_sem, 0, 8);

int spaghetti_module_manager_get_by_id(
	spaghetti_module_id_t id,
	struct spaghetti_module_snapshot *out)
{
	if (out == NULL) {
		return -EINVAL;
	}

	if (id == 3U) {
		const struct spaghetti_module_snapshot source = {
			.id = 3U,
			.key = 10U,
			.state = SPAGHETTI_MODULE_READY,
		};

		*out = source;
		return 0;
	}
	if (id == 4U) {
		const struct spaghetti_module_snapshot relay = {
			.id = 4U,
			.key = 20U,
			.state = SPAGHETTI_MODULE_READY,
		};

		*out = relay;
		return 0;
	}

	return -ENOENT;
}

int spaghetti_module_manager_read(
	spaghetti_module_id_t id,
	struct spaghetti_sample *out)
{
	if ((id != 3U) || (out == NULL)) {
		return -EINVAL;
	}
	if (block_read) {
		k_sem_give(&read_entered_sem);
		(void)k_sem_take(&read_release_sem, K_FOREVER);
	}

	const struct spaghetti_sample sample = {
		.bus_voltage_microvolts = 5000000,
		.current_microamps = -120000,
		.power_microwatts = 600000U,
	};

	*out = sample;
	++read_count;
	return 0;
}

int spaghetti_module_manager_command(
	spaghetti_module_id_t id,
	const struct spaghetti_command *command)
{
	if ((id != 4U) || (command == NULL) ||
	    (command->type != SPAGHETTI_COMMAND_RELAY_SET)) {
		return -EINVAL;
	}

	++command_count;
	last_command_on = command->relay_on;
	k_sem_give(&command_sem);
	return command_error;
}

static void publish_current(int32_t current_microamps,
			    spaghetti_module_key_t source_key)
{
	const struct spaghetti_electrical_message message = {
		.source_id = 3U,
		.source_key = source_key,
		.current_microamps = current_microamps,
	};

	zassert_ok(spaghetti_data_publish_electrical(&message, K_MSEC(100)));
}

static void receive_sampling_message(void)
{
	const struct zbus_channel *channel;
	struct spaghetti_electrical_message message;

	zassert_ok(zbus_sub_wait_msg(&electrical_test_subscriber,
				    &channel, &message, K_MSEC(100)));
	zassert_equal(message.source_id, 3U);
	zassert_equal(message.source_key, 10U);
	zassert_equal(message.bus_voltage_microvolts, 5000000);
	zassert_equal(message.current_microamps, -120000);
	zassert_equal(message.power_microwatts, 600000U);
	zassert_true(message.timestamp_ms > 0);
}

ZTEST(runtime, test_sampling_threshold_hysteresis_and_bounded_stop)
{
	const struct spaghetti_runtime_sampling_task invalid_id_task = {
		.module_id = 99U,
		.period_ms = 10U,
		.enabled = true,
	};
	const struct spaghetti_runtime_sampling_task zero_period_task = {
		.module_id = 3U,
		.period_ms = 0U,
		.enabled = true,
	};
	const struct spaghetti_runtime_sampling_task sampling_task = {
		.module_id = 3U,
		.period_ms = 10U,
		.enabled = true,
	};
	const struct spaghetti_runtime_sampling_task disabled_task = {0};
	const struct spaghetti_runtime_threshold_rule threshold_rule = {
		.source_id = 3U,
		.lower_current_microamps = 450000,
		.upper_current_microamps = 500000,
		.relay_id = 4U,
		.relay_on_above = true,
	};
	struct spaghetti_runtime_threshold_rule invalid_rule = threshold_rule;
	uint32_t stopped_count;

	zassert_equal(spaghetti_runtime_load(&sampling_task), -EACCES);
	zassert_equal(spaghetti_runtime_start(), -EACCES);
	zassert_equal(spaghetti_runtime_stop(K_NO_WAIT), -EACCES);
	zassert_ok(spaghetti_data_init());
	zassert_ok(zbus_obs_set_enable(&electrical_logger_subscriber, false));
	zassert_ok(zbus_obs_set_enable(&electrical_test_subscriber, true));
	zassert_ok(spaghetti_runtime_init());
	zassert_equal(spaghetti_runtime_init(), -EALREADY);
	zassert_equal(spaghetti_runtime_load(NULL), -EINVAL);
	zassert_equal(spaghetti_runtime_load(&zero_period_task), -EINVAL);
	zassert_equal(spaghetti_runtime_load(&invalid_id_task), -ENOENT);
	zassert_ok(spaghetti_runtime_load(&sampling_task));
	zassert_ok(spaghetti_runtime_start());
	zassert_equal(spaghetti_runtime_start(), -EALREADY);
	zassert_equal(spaghetti_runtime_load(&sampling_task), -EBUSY);

	for (size_t sample_idx = 0U; sample_idx < 3U; ++sample_idx) {
		receive_sampling_message();
	}
	zassert_ok(spaghetti_runtime_stop(K_MSEC(100)));
	stopped_count = read_count;
	k_sleep(K_MSEC(30));
	zassert_equal(read_count, stopped_count);
	zassert_equal(spaghetti_runtime_stop(K_NO_WAIT), -EALREADY);
	zassert_ok(zbus_obs_set_enable(&electrical_test_subscriber, false));
	zassert_ok(spaghetti_runtime_load(&disabled_task));

	invalid_rule.lower_current_microamps = -1;
	zassert_equal(spaghetti_runtime_load_threshold_rule(&invalid_rule),
		      -EINVAL);
	invalid_rule = threshold_rule;
	invalid_rule.upper_current_microamps = 450000;
	zassert_equal(spaghetti_runtime_load_threshold_rule(&invalid_rule),
		      -EINVAL);
	invalid_rule = threshold_rule;
	invalid_rule.relay_id = 99U;
	zassert_equal(spaghetti_runtime_load_threshold_rule(&invalid_rule),
		      -ENOENT);
	zassert_ok(spaghetti_runtime_load_threshold_rule(&threshold_rule));
	zassert_ok(spaghetti_runtime_start());
	publish_current(449999, 10U);
	zassert_ok(k_sem_take(&command_sem, K_MSEC(100)));
	zassert_false(last_command_on);
	publish_current(450000, 10U);
	publish_current(475000, 10U);
	publish_current(500000, 10U);
	publish_current(500001, 99U);
	publish_current(500001, 10U);
	zassert_ok(k_sem_take(&command_sem, K_MSEC(100)));
	zassert_true(last_command_on);
	publish_current(600000, 10U);
	k_sleep(K_MSEC(20));
	zassert_equal(command_count, 2U);
	zassert_ok(spaghetti_runtime_stop(K_MSEC(100)));

	command_error = -ENODEV;
	zassert_ok(spaghetti_runtime_load_threshold_rule(&threshold_rule));
	zassert_ok(spaghetti_runtime_start());
	publish_current(500001, 10U);
	zassert_ok(k_sem_take(&command_sem, K_MSEC(100)));
	zassert_equal(command_count, 3U);
	zassert_ok(spaghetti_runtime_stop(K_MSEC(100)));
	command_error = 0;

	zassert_ok(spaghetti_runtime_clear_threshold_rule());
	block_read = true;
	zassert_ok(spaghetti_runtime_load(&sampling_task));
	zassert_ok(spaghetti_runtime_start());
	zassert_ok(k_sem_take(&read_entered_sem, K_MSEC(100)));
	zassert_equal(spaghetti_runtime_stop(K_MSEC(5)), -ETIMEDOUT);
	k_sem_give(&read_release_sem);
	k_sleep(K_MSEC(20));
	zassert_equal(spaghetti_runtime_stop(K_NO_WAIT), -EALREADY);
}

ZTEST_SUITE(runtime, NULL, NULL, NULL, NULL, NULL);
