#include <errno.h>
#include <stdbool.h>
#include <stdint.h>

#include <zephyr/kernel.h>
#include <zephyr/ztest.h>

#include <spaghetti/data.h>
#include <spaghetti/module_manager.h>
#include <spaghetti/runtime.h>

static bool block_read;
static uint32_t publish_count;
static struct spaghetti_electrical_message last_message;
K_SEM_DEFINE(read_entered_sem, 0, 1);
K_SEM_DEFINE(read_release_sem, 0, 1);
K_SEM_DEFINE(published_sem, 0, 8);

int spaghetti_module_manager_get_by_id(
	spaghetti_module_id_t id,
	struct spaghetti_module_snapshot *out)
{
	if (out == NULL) {
		return -EINVAL;
	}
	if (id != 3U) {
		return -ENOENT;
	}

	const struct spaghetti_module_snapshot snapshot = {
		.id = 3U,
		.key = 10U,
		.state = SPAGHETTI_MODULE_READY,
	};

	*out = snapshot;
	return 0;
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
	return 0;
}

int spaghetti_data_publish_electrical(
	const struct spaghetti_electrical_message *message,
	k_timeout_t timeout)
{
	ARG_UNUSED(timeout);

	if (message == NULL) {
		return -EINVAL;
	}

	last_message = *message;
	++publish_count;
	k_sem_give(&published_sem);
	return 0;
}

ZTEST(runtime, test_periodic_sampling_lifecycle_and_bounded_stop)
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
	uint32_t stopped_count;

	zassert_equal(spaghetti_runtime_load(&sampling_task), -EACCES);
	zassert_equal(spaghetti_runtime_start(), -EACCES);
	zassert_equal(spaghetti_runtime_stop(K_NO_WAIT), -EACCES);
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
		zassert_ok(k_sem_take(&published_sem, K_MSEC(100)));
	}
	zassert_equal(last_message.source_id, 3U);
	zassert_equal(last_message.source_key, 10U);
	zassert_equal(last_message.bus_voltage_microvolts, 5000000);
	zassert_equal(last_message.current_microamps, -120000);
	zassert_equal(last_message.power_microwatts, 600000U);
	zassert_true(last_message.timestamp_ms > 0);
	zassert_equal(last_message.sequence, publish_count - 1U);
	zassert_ok(spaghetti_runtime_stop(K_MSEC(100)));
	stopped_count = publish_count;
	k_sleep(K_MSEC(30));
	zassert_equal(publish_count, stopped_count);
	zassert_equal(spaghetti_runtime_stop(K_NO_WAIT), -EALREADY);
	zassert_ok(spaghetti_runtime_load(&disabled_task));
	zassert_equal(spaghetti_runtime_start(), -ENOENT);

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
