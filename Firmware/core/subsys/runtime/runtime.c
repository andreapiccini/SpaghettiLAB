#include <spaghetti/runtime.h>

#include <errno.h>
#include <stdbool.h>
#include <string.h>

#include <zephyr/kernel.h>
#include <zephyr/logging/log.h>
#include <zephyr/zbus/zbus.h>

#include <spaghetti/data.h>
#include <spaghetti/health.h>
#include <spaghetti/module_driver.h>
#include <spaghetti/module_manager.h>
#include <spaghetti/core.h>
#include <spaghetti/timer.h>

LOG_MODULE_REGISTER(spaghetti_runtime, CONFIG_SPAGHETTI_RUNTIME_LOG_LEVEL);

SPAGHETTI_HEALTH_COMPONENT_DEFINE(runtime_health) = {
	.id = SPAGHETTI_HEALTH_ID_RUNTIME,
	.name = "runtime",
	.maximum_silence_ms = 3000U,
	.required_core_modes = BIT(SPAGHETTI_CORE_MODE_NORMAL),
};

static void runtime_health_keepalive_handler(struct k_work *work);

K_WORK_DELAYABLE_DEFINE(runtime_health_keepalive,
			runtime_health_keepalive_handler);

static void runtime_health_keepalive_handler(struct k_work *work)
{
	ARG_UNUSED(work);
	(void)spaghetti_health_heartbeat(SPAGHETTI_HEALTH_ID_RUNTIME);
	(void)k_work_reschedule(&runtime_health_keepalive,
		K_MSEC(CONFIG_SPAGHETTI_HEALTH_KEEPALIVE_MS));
}

ZBUS_CHAN_DECLARE(spaghetti_electrical_chan);
ZBUS_OBS_DECLARE(electrical_runtime_subscriber);

enum spaghetti_runtime_state {
	SPAGHETTI_RUNTIME_UNINITIALIZED,
	SPAGHETTI_RUNTIME_STOPPED,
	SPAGHETTI_RUNTIME_RUNNING,
	SPAGHETTI_RUNTIME_STOPPING,
};

static enum spaghetti_runtime_state runtime_state =
	SPAGHETTI_RUNTIME_UNINITIALIZED;
static struct spaghetti_runtime_sampling_task sampling_task;
static struct spaghetti_runtime_threshold_rule threshold_rule;
static spaghetti_module_key_t sampling_source_key;
static spaghetti_module_key_t threshold_source_key;
static bool has_sampling_task;
static bool has_threshold_rule;
static bool has_relay_state;
static bool last_relay_on;
static uint32_t sequence;
static uint8_t active_operations;
K_MUTEX_DEFINE(runtime_lock);
K_SEM_DEFINE(runtime_tick_sem, 0, 1);
K_SEM_DEFINE(runtime_stopped_sem, 0, 1);
K_SEM_DEFINE(runtime_initialized_sem, 0, 1);

static void finish_stop_if_quiescent(void)
{
	if ((runtime_state == SPAGHETTI_RUNTIME_STOPPING) &&
	    (active_operations == 0U)) {
		runtime_state = SPAGHETTI_RUNTIME_STOPPED;
		k_sem_give(&runtime_stopped_sem);
	}
}

static void complete_operation(void)
{
	(void)k_mutex_lock(&runtime_lock, K_FOREVER);
	if (active_operations > 0U) {
		--active_operations;
	}
	finish_stop_if_quiescent();
	k_mutex_unlock(&runtime_lock);
}

static void runtime_sampling_thread_entry(void *first, void *second, void *third)
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
		if ((runtime_state != SPAGHETTI_RUNTIME_RUNNING) ||
		    !has_sampling_task || !sampling_task.enabled) {
			k_mutex_unlock(&runtime_lock);
			continue;
		}

		task = sampling_task;
		source_key = sampling_source_key;
		++active_operations;
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

		complete_operation();
		(void)spaghetti_health_heartbeat(SPAGHETTI_HEALTH_ID_RUNTIME);
	}
}

static void runtime_rule_thread_entry(void *first, void *second, void *third)
{
	const struct zbus_channel *channel;
	struct spaghetti_electrical_message message;

	ARG_UNUSED(first);
	ARG_UNUSED(second);
	ARG_UNUSED(third);
	(void)k_sem_take(&runtime_initialized_sem, K_FOREVER);

	while (true) {
		spaghetti_module_id_t relay_id;
		bool desired_relay_on;
		bool must_command;
		int err = zbus_sub_wait_msg(&electrical_runtime_subscriber,
					    &channel, &message, K_FOREVER);

		if (err < 0) {
			LOG_ERR("rule receive failed: err=%d", err);
			continue;
		}
		if (channel != &spaghetti_electrical_chan) {
			LOG_ERR("rule received an unexpected channel");
			continue;
		}

		(void)k_mutex_lock(&runtime_lock, K_FOREVER);
		if ((runtime_state != SPAGHETTI_RUNTIME_RUNNING) ||
		    !has_threshold_rule ||
		    (message.source_id != threshold_rule.source_id) ||
		    (message.source_key != threshold_source_key)) {
			k_mutex_unlock(&runtime_lock);
			continue;
		}

		must_command = true;
		if (message.current_microamps >
		    threshold_rule.upper_current_microamps) {
			desired_relay_on = threshold_rule.relay_on_above;
		} else if (message.current_microamps <
			   threshold_rule.lower_current_microamps) {
			desired_relay_on = !threshold_rule.relay_on_above;
		} else {
			must_command = false;
			desired_relay_on = false;
		}

		if (!must_command ||
		    (has_relay_state && (last_relay_on == desired_relay_on))) {
			k_mutex_unlock(&runtime_lock);
			continue;
		}

		relay_id = threshold_rule.relay_id;
		++active_operations;
		k_mutex_unlock(&runtime_lock);

		const struct spaghetti_command command = {
			.type = SPAGHETTI_COMMAND_RELAY_SET,
			.relay_on = desired_relay_on,
		};

		err = spaghetti_module_manager_command(relay_id, &command);
		(void)k_mutex_lock(&runtime_lock, K_FOREVER);
		if (err == 0) {
			has_relay_state = true;
			last_relay_on = desired_relay_on;
		} else {
			LOG_WRN("Relay command failed: id=%u err=%d",
				(uint32_t)relay_id, err);
		}
		if (active_operations > 0U) {
			--active_operations;
		}
		finish_stop_if_quiescent();
		k_mutex_unlock(&runtime_lock);
		(void)spaghetti_health_heartbeat(SPAGHETTI_HEALTH_ID_RUNTIME);
	}
}

K_THREAD_DEFINE(runtime_sampling_thread_id,
		CONFIG_SPAGHETTI_RUNTIME_STACK_SIZE,
		runtime_sampling_thread_entry, NULL, NULL, NULL,
		CONFIG_SPAGHETTI_RUNTIME_PRIORITY, 0, 0);

K_THREAD_DEFINE(runtime_rule_thread_id,
		CONFIG_SPAGHETTI_RUNTIME_RULE_STACK_SIZE,
		runtime_rule_thread_entry, NULL, NULL, NULL,
		CONFIG_SPAGHETTI_RUNTIME_RULE_PRIORITY, 0, 0);

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

	err = zbus_obs_set_enable(&electrical_runtime_subscriber, true);
	if (err < 0) {
		k_mutex_unlock(&runtime_lock);
		return err;
	}
	err = spaghetti_timer_init(&runtime_tick_sem);
	if (err < 0) {
		(void)zbus_obs_set_enable(&electrical_runtime_subscriber, false);
		k_mutex_unlock(&runtime_lock);
		return err;
	}

	memset(&sampling_task, 0, sizeof(sampling_task));
	memset(&threshold_rule, 0, sizeof(threshold_rule));
	sampling_source_key = 0U;
	threshold_source_key = 0U;
	has_sampling_task = false;
	has_threshold_rule = false;
	has_relay_state = false;
	last_relay_on = false;
	sequence = 0U;
	active_operations = 0U;
	k_sem_reset(&runtime_tick_sem);
	k_sem_reset(&runtime_stopped_sem);
	runtime_state = SPAGHETTI_RUNTIME_STOPPED;
	k_sem_give(&runtime_initialized_sem);
	k_mutex_unlock(&runtime_lock);

	(void)k_work_reschedule(&runtime_health_keepalive,
		K_MSEC(CONFIG_SPAGHETTI_HEALTH_KEEPALIVE_MS));
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

int spaghetti_runtime_load_threshold_rule(
	const struct spaghetti_runtime_threshold_rule *rule)
{
	struct spaghetti_module_snapshot source;
	struct spaghetti_module_snapshot relay;
	int err;

	if ((rule == NULL) || (rule->lower_current_microamps < 0) ||
	    (rule->lower_current_microamps >= rule->upper_current_microamps)) {
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

	err = spaghetti_module_manager_get_by_id(rule->source_id, &source);
	if ((err < 0) || (source.state != SPAGHETTI_MODULE_READY)) {
		err = -ENOENT;
		goto unlock;
	}
	err = spaghetti_module_manager_get_by_id(rule->relay_id, &relay);
	if ((err < 0) || (relay.state != SPAGHETTI_MODULE_READY)) {
		err = -ENOENT;
		goto unlock;
	}

	threshold_rule = *rule;
	threshold_source_key = source.key;
	has_threshold_rule = true;
	has_relay_state = false;
	err = 0;

unlock:
	k_mutex_unlock(&runtime_lock);
	return err;
}

int spaghetti_runtime_clear_threshold_rule(void)
{
	int err = k_mutex_lock(&runtime_lock, K_FOREVER);

	if (err < 0) {
		return err;
	}
	if (runtime_state == SPAGHETTI_RUNTIME_UNINITIALIZED) {
		err = -EACCES;
	} else if (runtime_state != SPAGHETTI_RUNTIME_STOPPED) {
		err = -EBUSY;
	} else {
		memset(&threshold_rule, 0, sizeof(threshold_rule));
		threshold_source_key = 0U;
		has_threshold_rule = false;
		has_relay_state = false;
		err = 0;
	}

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
	if (!has_sampling_task && !has_threshold_rule) {
		err = -ENOENT;
		goto unlock;
	}

	k_sem_reset(&runtime_tick_sem);
	k_sem_reset(&runtime_stopped_sem);
	has_relay_state = false;
	if (has_sampling_task && sampling_task.enabled) {
		err = spaghetti_timer_start(sampling_task.period_ms);
		if (err < 0) {
			goto unlock;
		}
	}
	runtime_state = SPAGHETTI_RUNTIME_RUNNING;
	err = 0;

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

	if (has_sampling_task && sampling_task.enabled) {
		err = spaghetti_timer_stop();
		if (err < 0) {
			goto unlock;
		}
	}
	runtime_state = SPAGHETTI_RUNTIME_STOPPING;
	k_sem_reset(&runtime_stopped_sem);
	finish_stop_if_quiescent();
	k_mutex_unlock(&runtime_lock);

	err = k_sem_take(&runtime_stopped_sem, timeout);
	return (err < 0) ? -ETIMEDOUT : 0;

unlock:
	k_mutex_unlock(&runtime_lock);
	return err;
}
