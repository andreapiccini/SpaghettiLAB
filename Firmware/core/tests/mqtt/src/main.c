#include <errno.h>
#include <stdint.h>
#include <string.h>

#include <zephyr/kernel.h>
#include <zephyr/zbus/zbus.h>
#include <zephyr/ztest.h>

#include <spaghetti/data.h>
#include <spaghetti/mqtt.h>

#include "mqtt_internal.h"

ZBUS_OBS_DECLARE(electrical_logger_subscriber);

static struct spaghetti_mqtt_config valid_config(void)
{
	const struct spaghetti_mqtt_config config = {
		.enabled = true,
		.host = "broker.invalid",
		.port = 1883U,
		.base_topic = "spaghetti/test",
	};

	return config;
}

ZTEST(mqtt, test_bounded_lifecycle_queue_and_electrical_mapping)
{
	const struct spaghetti_electrical_message message = {
		.source_id = 3U,
		.source_key = 10U,
		.bus_voltage_microvolts = 12000000,
		.current_microamps = 125000,
		.power_microwatts = 1500000U,
		.timestamp_ms = 1000,
		.sequence = 4U,
	};
	const char expected_payload[] =
		"{\"module_key\":10,\"bus_uv\":12000000,"
		"\"current_ua\":125000,\"power_uw\":1500000}";
	struct spaghetti_mqtt_publication publication;
	struct spaghetti_mqtt_status status;
	struct spaghetti_mqtt_config config = valid_config();

	zassert_equal(spaghetti_mqtt_get_status(&status), -EACCES);
	zassert_equal(spaghetti_mqtt_init(NULL), -EINVAL);
	zassert_equal(spaghetti_mqtt_init(&(struct spaghetti_mqtt_config){0}),
		      0);
	zassert_equal(spaghetti_mqtt_start(), -EACCES);

	memset(config.base_topic, 'x', sizeof(config.base_topic));
	zassert_equal(spaghetti_mqtt_init(&config), -EINVAL);
	config = valid_config();
	memcpy(config.base_topic, "trailing/", sizeof("trailing/"));
	zassert_equal(spaghetti_mqtt_init(&config), -EINVAL);

	config = valid_config();
	zassert_ok(spaghetti_mqtt_init(&config));
	zassert_ok(zbus_obs_set_enable(&electrical_logger_subscriber, false));
	zassert_ok(spaghetti_mqtt_get_status(&status));
	zassert_equal(status.state, SPAGHETTI_MQTT_STOPPED);
	zassert_equal(spaghetti_mqtt_format_electrical(NULL, &publication),
		      -EINVAL);
	zassert_ok(spaghetti_mqtt_format_electrical(&message, &publication));
	zassert_equal(strcmp(publication.topic_suffix,
			     "modules/10/electrical"), 0);
	zassert_equal(publication.payload_size, sizeof(expected_payload) - 1U);
	zassert_mem_equal(publication.payload, expected_payload,
			  publication.payload_size);

	for (size_t publication_idx = 0U;
	     publication_idx < CONFIG_SPAGHETTI_MQTT_QUEUE_DEPTH;
	     ++publication_idx) {
		zassert_ok(spaghetti_mqtt_publish(&publication));
	}
	zassert_equal(spaghetti_mqtt_publish(&publication), -ENOMSG);
	zassert_ok(spaghetti_mqtt_get_status(&status));
	zassert_equal(status.queued, CONFIG_SPAGHETTI_MQTT_QUEUE_DEPTH);
	zassert_equal(status.dropped, 1U);

	zassert_ok(spaghetti_mqtt_start());
	zassert_equal(spaghetti_mqtt_start(), -EALREADY);
	zassert_equal(spaghetti_mqtt_init(&config), -EBUSY);
	zassert_ok(spaghetti_mqtt_stop(K_SECONDS(1)));
	zassert_equal(spaghetti_mqtt_stop(K_NO_WAIT), -EALREADY);

	zassert_ok(spaghetti_mqtt_init(&config));
	zassert_ok(spaghetti_data_init());
	zassert_ok(spaghetti_mqtt_start());
	zassert_ok(spaghetti_data_publish_electrical(&message, K_NO_WAIT));

	for (size_t attempt = 0U; attempt < 20U; ++attempt) {
		zassert_ok(spaghetti_mqtt_get_status(&status));
		if (status.queued == 1U) {
			break;
		}
		k_sleep(K_MSEC(10));
	}
	zassert_equal(status.queued, 1U);
	zassert_equal(status.state, SPAGHETTI_MQTT_WAIT_NETWORK);
	zassert_ok(spaghetti_mqtt_stop(K_SECONDS(1)));

	zassert_ok(spaghetti_mqtt_init(&(struct spaghetti_mqtt_config){0}));
	zassert_equal(spaghetti_mqtt_publish(&publication), -EACCES);
}

ZTEST_SUITE(mqtt, NULL, NULL, NULL, NULL, NULL);
