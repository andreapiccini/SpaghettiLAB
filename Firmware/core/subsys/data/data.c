#include <spaghetti/data.h>

#include <errno.h>

#include <zephyr/kernel.h>
#include <zephyr/logging/log.h>
#include <zephyr/sys/atomic.h>
#include <zephyr/zbus/zbus.h>

LOG_MODULE_REGISTER(spaghetti_data, CONFIG_SPAGHETTI_DATA_LOG_LEVEL);

ZBUS_MSG_SUBSCRIBER_DEFINE(electrical_logger_subscriber);
ZBUS_MSG_SUBSCRIBER_DEFINE_WITH_ENABLE(electrical_test_subscriber, false);

ZBUS_CHAN_DEFINE(spaghetti_electrical_chan,
		 struct spaghetti_electrical_message,
		 NULL,
		 NULL,
		 ZBUS_OBSERVERS(electrical_logger_subscriber,
				electrical_test_subscriber),
		 ZBUS_MSG_INIT(0));

static atomic_t is_initialized;
static atomic_t published_count;
static atomic_t rejected_count;
static atomic_t delivery_error_count;
K_MUTEX_DEFINE(data_lock);

#if CONFIG_SPAGHETTI_DATA_LOGGER
static void electrical_logger_thread(void *first, void *second, void *third)
{
	const struct zbus_channel *channel;
	struct spaghetti_electrical_message message;

	ARG_UNUSED(first);
	ARG_UNUSED(second);
	ARG_UNUSED(third);

	while (true) {
		int err = zbus_sub_wait_msg(&electrical_logger_subscriber,
					    &channel, &message, K_FOREVER);

		if (err < 0) {
			LOG_ERR("logger receive failed: err=%d", err);
			continue;
		}
		if (channel != &spaghetti_electrical_chan) {
			LOG_ERR("logger received an unexpected channel");
			continue;
		}

		LOG_INF("electrical key=%u id=%u seq=%u bus=%d uV current=%d uA "
			"power=%u uW",
			message.source_key, (uint32_t)message.source_id,
			message.sequence, message.bus_voltage_microvolts,
			message.current_microamps, message.power_microwatts);
	}
}

K_THREAD_DEFINE(electrical_logger_thread_id,
		CONFIG_SPAGHETTI_DATA_LOGGER_STACK_SIZE,
		electrical_logger_thread, NULL, NULL, NULL,
		CONFIG_SPAGHETTI_DATA_LOGGER_PRIORITY, 0, 0);
#endif

int spaghetti_data_init(void)
{
	int err = k_mutex_lock(&data_lock, K_FOREVER);

	if (err < 0) {
		return err;
	}
	if (atomic_get(&is_initialized) != 0) {
		k_mutex_unlock(&data_lock);
		return -EALREADY;
	}

	atomic_set(&published_count, 0);
	atomic_set(&rejected_count, 0);
	atomic_set(&delivery_error_count, 0);
	atomic_set(&is_initialized, 1);
	k_mutex_unlock(&data_lock);

	LOG_INF("ready");
	return 0;
}

int spaghetti_data_publish_electrical(
	const struct spaghetti_electrical_message *message,
	k_timeout_t timeout)
{
	int err;

	if (message == NULL) {
		if (atomic_get(&is_initialized) != 0) {
			atomic_inc(&rejected_count);
		}
		return -EINVAL;
	}
	if (atomic_get(&is_initialized) == 0) {
		return -EACCES;
	}

	err = zbus_chan_pub(&spaghetti_electrical_chan, message, timeout);
	if (err < 0) {
		atomic_inc(&delivery_error_count);
		return err;
	}

	atomic_inc(&published_count);
	return 0;
}

int spaghetti_data_get_stats(struct spaghetti_data_stats *out)
{
	struct spaghetti_data_stats stats;

	if (out == NULL) {
		return -EINVAL;
	}
	if (atomic_get(&is_initialized) == 0) {
		return -EACCES;
	}

	stats.published = (uint32_t)atomic_get(&published_count);
	stats.rejected = (uint32_t)atomic_get(&rejected_count);
	stats.delivery_errors = (uint32_t)atomic_get(&delivery_error_count);
	*out = stats;
	return 0;
}
