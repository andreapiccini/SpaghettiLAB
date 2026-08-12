#include <errno.h>
#include <stdint.h>
#include <string.h>

#include <zephyr/kernel.h>
#include <zephyr/zbus/zbus.h>
#include <zephyr/ztest.h>

#include <spaghetti/data.h>
#include <spaghetti/maintenance_link.h>
#include <spaghetti/mqtt.h>
#include <spaghetti/schema.h>

#include "mqtt_internal.h"

ZBUS_OBS_DECLARE(record_logger_subscriber);

enum spaghetti_maintenance_link_state
spaghetti_maintenance_link_get_state(void)
{
	return SPAGHETTI_MAINTENANCE_LINK_NORMAL;
}

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

static struct spaghetti_record make_record(void)
{
	struct spaghetti_record record = {
		.source_id = 3U,
		.source_key = 10U,
		.boot_id = 7U,
		.timestamp_ms = 1000,
		.sequence = 4U,
		.payload = {
			.kind = SPAGHETTI_RECORD_SAMPLE,
			.schema_version = 1U,
		},
	};

	strncpy(record.payload.schema_id, "spaghetti.test.sample",
		sizeof(record.payload.schema_id) - 1U);
	return record;
}

ZTEST(mqtt, test_bounded_lifecycle_queue_and_record_mapping)
{
	const struct spaghetti_record message = make_record();
	const char expected_payload[] =
		"{\"module_key\":10,\"schema\":\"spaghetti.test.sample\","
		"\"version\":1,\"boot_id\":7,\"sequence\":4}";
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
	zassert_ok(zbus_obs_set_enable(&record_logger_subscriber, false));
	zassert_ok(spaghetti_mqtt_get_status(&status));
	zassert_equal(status.state, SPAGHETTI_MQTT_STOPPED);
	zassert_equal(spaghetti_mqtt_format_record(NULL, &publication),
		      -EINVAL);
	zassert_ok(spaghetti_mqtt_format_record(&message, &publication));
	zassert_equal(strcmp(publication.topic_suffix,
			     "modules/10/records"), 0);
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
	zassert_ok(spaghetti_data_publish(&message, K_NO_WAIT));

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
