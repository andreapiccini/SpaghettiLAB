#include <spaghetti/runtime.h>

#include <errno.h>
#include <stdbool.h>
#include <string.h>

#include <zephyr/kernel.h>
#include <zephyr/logging/log.h>

#include <spaghetti/data.h>
#include <spaghetti/module_manager.h>
#include <spaghetti/timer.h>

LOG_MODULE_REGISTER(spaghetti_runtime, CONFIG_SPAGHETTI_RUNTIME_LOG_LEVEL);

enum spaghetti_runtime_state {
	SPAGHETTI_RUNTIME_UNINITIALIZED,
	SPAGHETTI_RUNTIME_STOPPED,
	SPAGHETTI_RUNTIME_RUNNING,
	SPAGHETTI_RUNTIME_STOPPING,
};

static enum spaghetti_runtime_state runtime_state =
	SPAGHETTI_RUNTIME_UNINITIALIZED;
static struct spaghetti_runtime_sampling_task sampling_task;
static spaghetti_module_key_t sampling_source_key;
static bool has_sampling_task;
static uint32_t sequence;
K_MUTEX_DEFINE(runtime_lock);
K_SEM_DEFINE(runtime_tick_sem, 0, 1);
K_SEM_DEFINE(runtime_stopped_sem, 0, 1);

static void finish_stop_if_requested(void)
{
	if (runtime_state == SPAGHETTI_RUNTIME_STOPPING) {
		runtime_state = SPAGHETTI_RUNTIME_STOPPED;
		k_sem_give(&runtime_stopped_sem);
	}
}

static void runtime_thread_entry(void *first, void *second, void *third)
{
	ARG_UNUSED(first);
	ARG_UNUSED(second);
	ARG_UNUSED(third);

	while (true) {
		struct spaghetti_runtime_sampling_task task;
		spaghetti_module_key_t source_key;
		struct spaghetti_sample sample;
		int err;

		(void)k_sem_take(&runtime_tick_sem, K_FOREVER);
		(void)k_mutex_lock(&runtime_lock, K_FOREVER);
		if (runtime_state != SPAGHETTI_RUNTIME_RUNNING) {
			finish_stop_if_requested();
			k_mutex_unlock(&runtime_lock);
			continue;
		}

		task = sampling_task;
		source_key = sampling_source_key;
		k_mutex_unlock(&runtime_lock);

		err = spaghetti_module_manager_read(task.module_id, &sample);
		if (err < 0) {
			LOG_WRN("sample read failed: id=%u err=%d",
				(uint32_t)task.module_id, err);
		} else {
			const struct spaghetti_electrical_message message = {
				.source_id = task.module_id,
				.source_key = source_key,
				.bus_voltage_microvolts =
					sample.bus_voltage_microvolts,
				.current_microamps = sample.current_microamps,
				.power_microwatts = sample.power_microwatts,
				.timestamp_ms = k_uptime_get(),
				.sequence = sequence++,
			};

			err = spaghetti_data_publish_electrical(&message, K_NO_WAIT);
			if (err < 0) {
				LOG_WRN("sample publish failed: key=%u err=%d",
					source_key, err);
			}
		}

		(void)k_mutex_lock(&runtime_lock, K_FOREVER);
		finish_stop_if_requested();
		k_mutex_unlock(&runtime_lock);
	}
}

K_THREAD_DEFINE(runtime_thread_id, CONFIG_SPAGHETTI_RUNTIME_STACK_SIZE,
		runtime_thread_entry, NULL, NULL, NULL,
		CONFIG_SPAGHETTI_RUNTIME_PRIORITY, 0, 0);

int spaghetti_runtime_init(void)
{
	int err = k_mutex_lock(&runtime_lock, K_FOREVER);

	if (err < 0) {
		return err;
	}
	if (runtime_state != SPAGHETTI_RUNTIME_UNINITIALIZED) {
		k_mutex_unlock(&runtime_lock);
		return -EALREADY;
	}

	err = spaghetti_timer_init(&runtime_tick_sem);
	if (err < 0) {
		k_mutex_unlock(&runtime_lock);
		return err;
	}

	memset(&sampling_task, 0, sizeof(sampling_task));
	sampling_source_key = 0U;
	has_sampling_task = false;
	sequence = 0U;
	k_sem_reset(&runtime_tick_sem);
	k_sem_reset(&runtime_stopped_sem);
	runtime_state = SPAGHETTI_RUNTIME_STOPPED;
	k_mutex_unlock(&runtime_lock);

	LOG_INF("ready");
	return 0;
}

int spaghetti_runtime_load(const struct spaghetti_runtime_sampling_task *task)
{
	struct spaghetti_module_snapshot source;
	int err;

	if (task == NULL) {
		return -EINVAL;
	}

	err = k_mutex_lock(&runtime_lock, K_FOREVER);
	if (err < 0) {
		return err;
	}
	if (runtime_state == SPAGHETTI_RUNTIME_UNINITIALIZED) {
		err = -EACCES;
		goto unlock;
	}
	if (runtime_state != SPAGHETTI_RUNTIME_STOPPED) {
		err = -EBUSY;
		goto unlock;
	}

	if (!task->enabled) {
		memset(&sampling_task, 0, sizeof(sampling_task));
		sampling_source_key = 0U;
		has_sampling_task = false;
		err = 0;
		goto unlock;
	}
	if (task->period_ms == 0U) {
		err = -EINVAL;
		goto unlock;
	}

	err = spaghetti_module_manager_get_by_id(task->module_id, &source);
	if ((err < 0) || (source.state != SPAGHETTI_MODULE_READY)) {
		err = -ENOENT;
		goto unlock;
	}

	sampling_task = *task;
	sampling_source_key = source.key;
	has_sampling_task = true;
	err = 0;

unlock:
	k_mutex_unlock(&runtime_lock);
	return err;
}

int spaghetti_runtime_start(void)
{
	int err = k_mutex_lock(&runtime_lock, K_FOREVER);

	if (err < 0) {
		return err;
	}
	if (runtime_state == SPAGHETTI_RUNTIME_UNINITIALIZED) {
		err = -EACCES;
		goto unlock;
	}
	if (runtime_state == SPAGHETTI_RUNTIME_RUNNING) {
		err = -EALREADY;
		goto unlock;
	}
	if (runtime_state == SPAGHETTI_RUNTIME_STOPPING) {
		err = -EBUSY;
		goto unlock;
	}
	if (!has_sampling_task || !sampling_task.enabled) {
		err = -ENOENT;
		goto unlock;
	}

	k_sem_reset(&runtime_tick_sem);
	k_sem_reset(&runtime_stopped_sem);
	err = spaghetti_timer_start(sampling_task.period_ms);
	if (err < 0) {
		goto unlock;
	}
	runtime_state = SPAGHETTI_RUNTIME_RUNNING;

unlock:
	k_mutex_unlock(&runtime_lock);
	return err;
}

int spaghetti_runtime_stop(k_timeout_t timeout)
{
	int err = k_mutex_lock(&runtime_lock, K_FOREVER);

	if (err < 0) {
		return err;
	}
	if (runtime_state == SPAGHETTI_RUNTIME_UNINITIALIZED) {
		err = -EACCES;
		goto unlock;
	}
	if (runtime_state == SPAGHETTI_RUNTIME_STOPPED) {
		err = -EALREADY;
		goto unlock;
	}
	if (runtime_state == SPAGHETTI_RUNTIME_STOPPING) {
		err = -EBUSY;
		goto unlock;
	}

	err = spaghetti_timer_stop();
	if (err < 0) {
		goto unlock;
	}
	runtime_state = SPAGHETTI_RUNTIME_STOPPING;
	k_sem_reset(&runtime_stopped_sem);
	k_sem_give(&runtime_tick_sem);
	k_mutex_unlock(&runtime_lock);

	err = k_sem_take(&runtime_stopped_sem, timeout);
	return (err < 0) ? -ETIMEDOUT : 0;

unlock:
	k_mutex_unlock(&runtime_lock);
	return err;
}
