#include <errno.h>
#include <stdint.h>

#include <zephyr/kernel.h>
#include <zephyr/zbus/zbus.h>
#include <zephyr/ztest.h>

#include <spaghetti/data.h>

ZBUS_CHAN_DECLARE(spaghetti_electrical_chan);
ZBUS_OBS_DECLARE(electrical_logger_subscriber,
		 electrical_test_subscriber);

static void receive_and_assert(
	const struct zbus_observer *subscriber,
	const struct spaghetti_electrical_message *expected)
{
	const struct zbus_channel *channel;
	struct spaghetti_electrical_message received;

	zassert_ok(zbus_sub_wait_msg(subscriber, &channel, &received, K_NO_WAIT));
	zassert_equal(channel, &spaghetti_electrical_chan);
	zassert_mem_equal(&received, expected, sizeof(received));
}

static size_t drain_subscriber(const struct zbus_observer *subscriber)
{
	const struct zbus_channel *channel;
	struct spaghetti_electrical_message message;
	size_t count = 0U;

	while (zbus_sub_wait_msg(subscriber, &channel, &message,
				 K_NO_WAIT) == 0) {
		++count;
	}

	return count;
}

ZTEST(data, test_fan_out_and_bounded_pool_exhaustion)
{
	struct spaghetti_data_stats unchanged = {
		.published = 99U,
		.rejected = 99U,
		.delivery_errors = 99U,
	};
	struct spaghetti_data_stats stats = unchanged;
	struct spaghetti_electrical_message message = {
		.source_id = 3U,
		.source_key = 11U,
		.bus_voltage_microvolts = 12000000,
		.current_microamps = -25000,
		.power_microwatts = 300000U,
		.timestamp_ms = 1234,
		.sequence = 7U,
	};
	int publish_error = 0;
	size_t successful_fill_count = 0U;

	zassert_equal(spaghetti_data_publish_electrical(&message, K_NO_WAIT),
		      -EACCES);
	zassert_equal(spaghetti_data_get_stats(&stats), -EACCES);
	zassert_mem_equal(&stats, &unchanged, sizeof(stats));
	zassert_ok(spaghetti_data_init());
	zassert_equal(spaghetti_data_init(), -EALREADY);
	zassert_ok(zbus_obs_set_enable(&electrical_test_subscriber, true));

	zassert_ok(spaghetti_data_publish_electrical(&message, K_NO_WAIT));
	receive_and_assert(&electrical_logger_subscriber, &message);
	receive_and_assert(&electrical_test_subscriber, &message);

	zassert_equal(spaghetti_data_publish_electrical(NULL, K_NO_WAIT),
		      -EINVAL);
	for (size_t attempt = 0U; attempt < 8U; ++attempt) {
		message.sequence = 100U + (uint32_t)attempt;
		publish_error = spaghetti_data_publish_electrical(
			&message, K_NO_WAIT);
		if (publish_error < 0) {
			break;
		}
		++successful_fill_count;
	}

	zassert_equal(publish_error, -ENOMEM);
	zassert_true(successful_fill_count > 0U);
	zassert_true(successful_fill_count < 8U);
	zassert_ok(spaghetti_data_get_stats(&stats));
	zassert_equal(stats.published, 1U + successful_fill_count);
	zassert_equal(stats.rejected, 1U);
	zassert_equal(stats.delivery_errors, 1U);
	zassert_true(drain_subscriber(&electrical_logger_subscriber) >=
		     successful_fill_count);
	zassert_equal(drain_subscriber(&electrical_test_subscriber),
		      successful_fill_count);
	zassert_ok(zbus_obs_set_enable(&electrical_test_subscriber, false));
}

ZTEST_SUITE(data, NULL, NULL, NULL, NULL, NULL);
