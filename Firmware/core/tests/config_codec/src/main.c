#include <errno.h>
#include <stdbool.h>
#include <stddef.h>
#include <stdint.h>
#include <string.h>

#include <zephyr/ztest.h>

#include <spaghetti/config.h>
#include <spaghetti/config_codec.h>

#include <ina219.h>

static const uint8_t valid_payload[] = {
	0xA3U, 0x00U, 0x01U, 0x01U, 0x82U,
	0xA4U, 0x00U, 0x0AU, 0x01U, 0x00U, 0x02U, 0x66U,
	'i', 'n', 'a', '2', '1', '9',
	0x03U, 0xA3U, 0x00U, 0x18U, 0x40U, 0x01U, 0x18U, 0x64U,
	0x02U, 0x18U, 0xC8U,
	0xA4U, 0x00U, 0x0BU, 0x01U, 0x00U, 0x02U, 0x66U,
	'i', 'n', 'a', '2', '1', '9',
	0x03U, 0xA3U, 0x00U, 0x18U, 0x41U, 0x01U, 0x18U, 0x64U,
	0x02U, 0x18U, 0xC8U,
	0x02U, 0xA3U, 0x00U, 0x0AU, 0x01U, 0x19U, 0x03U, 0xE8U,
	0x02U, 0xF5U,
};

static const uint8_t mqtt_fields[] = {
	0x03U, 0xA4U,
	0x00U, 0xF5U,
	0x01U, 0x66U, 'b', 'r', 'o', 'k', 'e', 'r',
	0x02U, 0x19U, 0x07U, 0x5BU,
	0x03U, 0x68U, 'l', 'a', 'b', '/', 'c', 'o', 'r', 'e',
};

static uint32_t validation_count;

static int find_module_index(const struct spaghetti_config *candidate,
			     spaghetti_module_key_t key)
{
	for (size_t module_idx = 0U; module_idx < candidate->module_count;
	     ++module_idx) {
		if (candidate->modules[module_idx].key == key) {
			return (int)module_idx;
		}
	}

	return -1;
}

int spaghetti_config_validate(const struct spaghetti_config *candidate,
			      struct spaghetti_config_error *error)
{
	struct spaghetti_ina219_config configs[SPAGHETTI_CONFIG_MAX_MODULES];

	ARG_UNUSED(error);
	++validation_count;
	if ((candidate == NULL) ||
	    (candidate->version != SPAGHETTI_CONFIG_VERSION) ||
	    (candidate->module_count > SPAGHETTI_CONFIG_MAX_MODULES)) {
		return -EINVAL;
	}

	for (size_t module_idx = 0U; module_idx < candidate->module_count;
	     ++module_idx) {
		const struct spaghetti_module_config *module =
			&candidate->modules[module_idx];

		if ((strcmp(module->type_id, "ina219") != 0) ||
		    (module->driver_config_size != sizeof(configs[module_idx]))) {
			return -EINVAL;
		}
		memcpy(&configs[module_idx], module->driver_config,
		       sizeof(configs[module_idx]));

		for (size_t previous_idx = 0U; previous_idx < module_idx;
		     ++previous_idx) {
			if (candidate->modules[previous_idx].key == module->key) {
				return -EEXIST;
			}
			if ((candidate->modules[previous_idx].port_id ==
			     module->port_id) &&
			    (configs[previous_idx].i2c_address ==
			     configs[module_idx].i2c_address)) {
				return -EADDRINUSE;
			}
		}
	}

	if (candidate->sampling.enabled &&
	    (find_module_index(candidate,
			       candidate->sampling.source_key) < 0)) {
		return -EINVAL;
	}
	if ((!candidate->mqtt.enabled &&
	     ((candidate->mqtt.host[0] != '\0') ||
	      (candidate->mqtt.port != 0U) ||
	      (candidate->mqtt.base_topic[0] != '\0'))) ||
	    (candidate->mqtt.enabled &&
	     ((candidate->mqtt.host[0] == '\0') ||
	      (candidate->mqtt.port == 0U) ||
	      (candidate->mqtt.base_topic[0] == '\0')))) {
		return -EINVAL;
	}

	return 0;
}

static void assert_decode_failure(const uint8_t *payload, size_t payload_size,
				  int expected_error)
{
	const struct spaghetti_config sentinel = {
		.version = UINT32_MAX,
		.module_count = 1U,
	};
	struct spaghetti_config output = sentinel;

	zassert_equal(spaghetti_config_decode_cbor(payload, payload_size, &output),
		      expected_error);
	zassert_mem_equal(&output, &sentinel, sizeof(output));
}

static size_t find_sequence(const uint8_t *payload, size_t payload_size,
			    const uint8_t *sequence, size_t sequence_size,
			    size_t occurrence)
{
	for (size_t byte_idx = 0U; byte_idx + sequence_size <= payload_size;
	     ++byte_idx) {
		if (memcmp(&payload[byte_idx], sequence, sequence_size) != 0) {
			continue;
		}
		if (occurrence == 0U) {
			return byte_idx;
		}
		--occurrence;
	}

	return SIZE_MAX;
}

ZTEST(config_codec, test_valid_payload_decodes_two_modules_on_one_port)
{
	struct spaghetti_ina219_config first_config;
	struct spaghetti_ina219_config second_config;
	struct spaghetti_config decoded;

	validation_count = 0U;
	zassert_ok(spaghetti_config_decode_cbor(valid_payload,
					       sizeof(valid_payload), &decoded));
	zassert_equal(validation_count, 1U);
	zassert_equal(decoded.version, SPAGHETTI_CONFIG_VERSION);
	zassert_equal(decoded.module_count, 2U);
	zassert_equal(decoded.modules[0].key, 10U);
	zassert_equal(decoded.modules[0].port_id, 0U);
	zassert_equal(strcmp(decoded.modules[0].type_id, "ina219"), 0);
	zassert_equal(decoded.modules[1].key, 11U);
	zassert_equal(decoded.modules[1].port_id, 0U);
	zassert_equal(decoded.sampling.source_key, 10U);
	zassert_equal(decoded.sampling.period_ms, 1000U);
	zassert_true(decoded.sampling.enabled);
	zassert_false(decoded.threshold_rule.enabled);
	zassert_false(decoded.mqtt.enabled);

	memcpy(&first_config, decoded.modules[0].driver_config,
	       sizeof(first_config));
	memcpy(&second_config, decoded.modules[1].driver_config,
	       sizeof(second_config));
	zassert_equal(first_config.i2c_address, 0x40U);
	zassert_equal(first_config.shunt_milliohm, 100U);
	zassert_equal(first_config.current_lsb_microamp, 200U);
	zassert_equal(second_config.i2c_address, 0x41U);
}

ZTEST(config_codec, test_wire_v1_decodes_mqtt_configuration)
{
	uint8_t payload[sizeof(valid_payload) + sizeof(mqtt_fields)];
	struct spaghetti_config decoded;

	memcpy(payload, valid_payload, sizeof(valid_payload));
	payload[0] = 0xA4U;
	payload[2] = 0x02U;
	memcpy(&payload[sizeof(valid_payload)], mqtt_fields,
	       sizeof(mqtt_fields));

	zassert_ok(spaghetti_config_decode_cbor(payload, sizeof(payload),
					       &decoded));
	zassert_true(decoded.mqtt.enabled);
	zassert_equal(strcmp(decoded.mqtt.host, "broker"), 0);
	zassert_equal(decoded.mqtt.port, 1883U);
	zassert_equal(strcmp(decoded.mqtt.base_topic, "lab/core"), 0);

	payload[sizeof(valid_payload) + 3U] = 0xF4U;
	assert_decode_failure(payload, sizeof(payload), -EINVAL);
}

ZTEST(config_codec, test_public_boundaries_and_malformed_payloads)
{
	uint8_t oversized[SPAGHETTI_CONFIG_CBOR_MAX_SIZE + 1U] = {0};
	uint8_t changed[sizeof(valid_payload) + 2U];
	struct spaghetti_config output;

	zassert_equal(spaghetti_config_decode_cbor(NULL, sizeof(valid_payload),
						   &output), -EINVAL);
	zassert_equal(spaghetti_config_decode_cbor(valid_payload,
						   sizeof(valid_payload), NULL),
		      -EINVAL);
	zassert_equal(spaghetti_config_decode_cbor(valid_payload, 0U, &output),
		      -EINVAL);
	zassert_equal(spaghetti_config_decode_cbor(oversized, sizeof(oversized),
						   &output), -EMSGSIZE);
	assert_decode_failure(valid_payload, sizeof(valid_payload) - 1U,
			      -EBADMSG);

	memcpy(changed, valid_payload, sizeof(valid_payload));
	changed[sizeof(valid_payload)] = 0x00U;
	assert_decode_failure(changed, sizeof(valid_payload) + 1U, -EBADMSG);

	memcpy(changed, valid_payload, sizeof(valid_payload));
	changed[2] = 0x03U;
	assert_decode_failure(changed, sizeof(valid_payload), -ENOTSUP);

	memcpy(changed, valid_payload, sizeof(valid_payload));
	changed[2] = 0x61U;
	assert_decode_failure(changed, sizeof(valid_payload), -EBADMSG);

	memcpy(changed, valid_payload, sizeof(valid_payload));
	changed[0] = 0xA2U;
	assert_decode_failure(changed, sizeof(valid_payload), -EBADMSG);

	memcpy(changed, valid_payload, sizeof(valid_payload));
	changed[0] = 0xA4U;
	changed[sizeof(valid_payload)] = 0x03U;
	changed[sizeof(valid_payload) + 1U] = 0x00U;
	assert_decode_failure(changed, sizeof(changed), -EBADMSG);

	memcpy(changed, valid_payload, sizeof(valid_payload));
	changed[0] = 0xA4U;
	changed[sizeof(valid_payload)] = 0x02U;
	changed[sizeof(valid_payload) + 1U] = 0xF4U;
	assert_decode_failure(changed, sizeof(changed), -EBADMSG);

	memcpy(changed, valid_payload, sizeof(valid_payload));
	changed[sizeof(valid_payload) - 1U] = 0x01U;
	assert_decode_failure(changed, sizeof(valid_payload), -EBADMSG);
}

ZTEST(config_codec, test_type_ranges_and_semantic_collisions)
{
	static const uint8_t type_marker[] = {
		0x02U, 0x66U, 'i', 'n', 'a', '2', '1', '9',
	};
	static const uint8_t first_address_marker[] = {
		0xA3U, 0x00U, 0x18U, 0x40U,
	};
	static const uint8_t second_address_marker[] = {
		0xA3U, 0x00U, 0x18U, 0x41U,
	};
	static const uint8_t second_key_marker[] = {
		0xA4U, 0x00U, 0x0BU,
	};
	static const uint8_t first_shunt_marker[] = {
		0x01U, 0x18U, 0x64U,
	};
	uint8_t changed[SPAGHETTI_CONFIG_CBOR_MAX_SIZE];
	size_t marker_idx;

	memcpy(changed, valid_payload, sizeof(valid_payload));
	marker_idx = find_sequence(changed, sizeof(valid_payload),
				  first_address_marker,
				  sizeof(first_address_marker), 0U);
	zassert_not_equal(marker_idx, SIZE_MAX);
	changed[marker_idx + 3U] = 0x3FU;
	assert_decode_failure(changed, sizeof(valid_payload), -EINVAL);

	memcpy(changed, valid_payload, sizeof(valid_payload));
	marker_idx = find_sequence(changed, sizeof(valid_payload),
				  first_shunt_marker,
				  sizeof(first_shunt_marker), 0U);
	zassert_not_equal(marker_idx, SIZE_MAX);
	changed[marker_idx + 2U] = 0x00U;
	assert_decode_failure(changed, sizeof(valid_payload), -EINVAL);

	memcpy(changed, valid_payload, sizeof(valid_payload));
	marker_idx = find_sequence(changed, sizeof(valid_payload),
				  second_key_marker,
				  sizeof(second_key_marker), 0U);
	zassert_not_equal(marker_idx, SIZE_MAX);
	changed[marker_idx + 2U] = 0x0AU;
	assert_decode_failure(changed, sizeof(valid_payload), -EEXIST);

	memcpy(changed, valid_payload, sizeof(valid_payload));
	marker_idx = find_sequence(changed, sizeof(valid_payload),
				  second_address_marker,
				  sizeof(second_address_marker), 0U);
	zassert_not_equal(marker_idx, SIZE_MAX);
	changed[marker_idx + 3U] = 0x40U;
	assert_decode_failure(changed, sizeof(valid_payload), -EADDRINUSE);

	memcpy(changed, valid_payload, sizeof(valid_payload));
	marker_idx = find_sequence(changed, sizeof(valid_payload), type_marker,
				  sizeof(type_marker), 0U);
	zassert_not_equal(marker_idx, SIZE_MAX);
	changed[marker_idx + 2U] = 'x';
	assert_decode_failure(changed, sizeof(valid_payload), -ENOTSUP);

	marker_idx = find_sequence(valid_payload, sizeof(valid_payload),
				  type_marker, sizeof(type_marker), 0U);
	zassert_not_equal(marker_idx, SIZE_MAX);
	memcpy(changed, valid_payload, marker_idx + 1U);
	changed[marker_idx + 1U] = 0x78U;
	changed[marker_idx + 2U] = 24U;
	memset(&changed[marker_idx + 3U], 'a', 24U);
	memcpy(&changed[marker_idx + 27U],
	       &valid_payload[marker_idx + sizeof(type_marker)],
	       sizeof(valid_payload) - marker_idx - sizeof(type_marker));
	assert_decode_failure(
		changed,
		marker_idx + 27U + sizeof(valid_payload) - marker_idx -
			sizeof(type_marker),
		-EMSGSIZE);
}

ZTEST(config_codec, test_module_count_is_bounded)
{
	static const uint8_t root_prefix[] = {
		0xA3U, 0x00U, 0x01U, 0x01U, 0x89U,
	};
	static const uint8_t compact_module[] = {
		0xA4U, 0x00U, 0x01U, 0x01U, 0x00U, 0x02U, 0x66U,
		'i', 'n', 'a', '2', '1', '9',
		0x03U, 0xA3U, 0x00U, 0x18U, 0x40U, 0x01U, 0x01U,
		0x02U, 0x01U,
	};
	static const uint8_t sampling[] = {
		0x02U, 0xA3U, 0x00U, 0x01U, 0x01U, 0x01U, 0x02U, 0xF4U,
	};
	uint8_t payload[SPAGHETTI_CONFIG_CBOR_MAX_SIZE];
	size_t payload_size = 0U;

	memcpy(&payload[payload_size], root_prefix, sizeof(root_prefix));
	payload_size += sizeof(root_prefix);
	for (size_t module_idx = 0U;
	     module_idx < (SPAGHETTI_CONFIG_MAX_MODULES + 1U); ++module_idx) {
		memcpy(&payload[payload_size], compact_module,
		       sizeof(compact_module));
		payload_size += sizeof(compact_module);
	}
	memcpy(&payload[payload_size], sampling, sizeof(sampling));
	payload_size += sizeof(sampling);

	zassert_true(payload_size <= sizeof(payload));
	assert_decode_failure(payload, payload_size, -EMSGSIZE);
}

ZTEST_SUITE(config_codec, NULL, NULL, NULL, NULL, NULL);
