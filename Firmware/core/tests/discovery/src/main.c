#include <errno.h>
#include <stdbool.h>
#include <stdint.h>
#include <string.h>

#include <zephyr/sys/util.h>
#include <zephyr/ztest.h>

#include <spaghetti/discovery.h>
#include <spaghetti/port.h>

struct spaghetti_port {
	spaghetti_port_id_t id;
};

static const struct spaghetti_port fake_port = {
	.id = 0U,
};

static struct spaghetti_discovery_event events[16];
static size_t event_count;
static int sink_error;
static bool reenter_sink;
static int reenter_result;

const struct spaghetti_port *spaghetti_port_get(spaghetti_port_id_t id)
{
	return (id == fake_port.id) ? &fake_port : NULL;
}

static struct spaghetti_discovery_result make_result(
	spaghetti_module_key_t key,
	uint8_t i2c_address,
	uint32_t generation)
{
	struct spaghetti_discovery_result result = {
		.key = key,
		.port_id = 0U,
		.type_id = "ina219",
		.driver_config_size = sizeof(i2c_address),
		.source = SPAGHETTI_DISCOVERY_SOURCE_CONFIG,
		.generation = generation,
	};

	result.driver_config[0] = i2c_address;
	return result;
}

static int record_event(const struct spaghetti_discovery_event *event,
			void *user_data)
{
	ARG_UNUSED(user_data);

	zassert_not_null(event);
	if (reenter_sink) {
		reenter_sink = false;
		reenter_result = spaghetti_discovery_submit_manual(&event->result);
	}
	if (sink_error < 0) {
		return sink_error;
	}
	if (event_count >= ARRAY_SIZE(events)) {
		return -ENOSPC;
	}

	events[event_count] = *event;
	++event_count;
	return 0;
}

ZTEST(discovery, test_key_scoped_lifecycle_and_failures)
{
	struct spaghetti_discovery_result key_10 = make_result(10U, 0x40U, 1U);
	struct spaghetti_discovery_result key_11 = make_result(11U, 0x41U, 1U);
	struct spaghetti_discovery_result invalid = key_10;

	zassert_equal(spaghetti_discovery_scan_port(0U, K_MSEC(10)), -EACCES);
	zassert_equal(spaghetti_discovery_init(NULL, NULL), -EINVAL);
	zassert_ok(spaghetti_discovery_init(record_event, NULL));
	zassert_equal(spaghetti_discovery_init(record_event, NULL), -EALREADY);

	zassert_equal(spaghetti_discovery_submit_manual(NULL), -EINVAL);
	invalid.key = 0U;
	zassert_equal(spaghetti_discovery_submit_manual(&invalid), -EINVAL);
	invalid = key_10;
	invalid.generation = 0U;
	zassert_equal(spaghetti_discovery_submit_manual(&invalid), -EINVAL);
	invalid = key_10;
	invalid.port_id = 1U;
	zassert_equal(spaghetti_discovery_submit_manual(&invalid), -ENOENT);
	invalid = key_10;
	memset(invalid.type_id, 'x', sizeof(invalid.type_id));
	zassert_equal(spaghetti_discovery_submit_manual(&invalid), -EINVAL);
	invalid = key_10;
	invalid.driver_config_size = sizeof(invalid.driver_config) + 1U;
	zassert_equal(spaghetti_discovery_submit_manual(&invalid), -EINVAL);
	invalid = key_10;
	invalid.source = (enum spaghetti_discovery_source)99;
	zassert_equal(spaghetti_discovery_submit_manual(&invalid), -EINVAL);

	zassert_ok(spaghetti_discovery_submit_manual(&key_10));
	zassert_ok(spaghetti_discovery_submit_manual(&key_11));
	zassert_equal(event_count, 2U);
	zassert_equal(events[0].type, SPAGHETTI_DISCOVERY_UPSERT);
	zassert_equal(events[0].result.key, 10U);
	zassert_equal(events[1].result.key, 11U);
	zassert_equal(events[0].result.port_id, events[1].result.port_id);
	zassert_equal(events[0].result.driver_config[0], 0x40U);
	zassert_equal(events[1].result.driver_config[0], 0x41U);

	zassert_equal(spaghetti_discovery_submit_manual(&key_10), -ESTALE);
	key_10.generation = 2U;
	reenter_sink = true;
	zassert_ok(spaghetti_discovery_submit_manual(&key_10));
	zassert_equal(reenter_result, -EBUSY);

	key_10.generation = 3U;
	sink_error = -EIO;
	zassert_equal(spaghetti_discovery_submit_manual(&key_10), -EIO);
	sink_error = 0;
	zassert_equal(spaghetti_discovery_invalidate(10U, 3U), -ESTALE);
	zassert_equal(spaghetti_discovery_invalidate(10U, 2U), 0);

	sink_error = -EIO;
	zassert_equal(spaghetti_discovery_invalidate(11U, 1U), -EIO);
	sink_error = 0;
	zassert_equal(spaghetti_discovery_invalidate(11U, 1U), 0);
	zassert_equal(events[event_count - 1U].type, SPAGHETTI_DISCOVERY_REMOVE);
	zassert_equal(events[event_count - 1U].result.key, 11U);

	key_10 = make_result(10U, 0x40U, 4U);
	key_11 = make_result(11U, 0x41U, 2U);
	struct spaghetti_discovery_result key_12 = make_result(12U, 0x42U, 1U);
	struct spaghetti_discovery_result key_13 = make_result(13U, 0x43U, 1U);

	zassert_ok(spaghetti_discovery_submit_manual(&key_10));
	zassert_ok(spaghetti_discovery_submit_manual(&key_11));
	zassert_ok(spaghetti_discovery_submit_manual(&key_12));
	zassert_equal(spaghetti_discovery_submit_manual(&key_13), -ENOSPC);
	zassert_equal(spaghetti_discovery_invalidate(0U, 1U), -EINVAL);
	zassert_equal(spaghetti_discovery_invalidate(99U, 1U), -ENOENT);
	zassert_equal(spaghetti_discovery_invalidate(10U, 3U), -ESTALE);
	zassert_equal(spaghetti_discovery_scan_port(1U, K_MSEC(10)), -ENOENT);
	zassert_equal(spaghetti_discovery_scan_port(0U, K_MSEC(10)), -ENOTSUP);
}

ZTEST_SUITE(discovery, NULL, NULL, NULL, NULL, NULL);
