#include <spaghetti/config_codec.h>

#include <errno.h>
#include <stdbool.h>
#include <stddef.h>
#include <stdint.h>
#include <string.h>

#include <zcbor_decode.h>

#include <ina219.h>

#define SPAGHETTI_CONFIG_CBOR_WIRE_VERSION_V0 1U
#define SPAGHETTI_CONFIG_CBOR_WIRE_VERSION_V1 2U
#define SPAGHETTI_CONFIG_CBOR_BACKUP_COUNT 4U
#define SPAGHETTI_CONFIG_CBOR_ROOT_KEY_VERSION 0U
#define SPAGHETTI_CONFIG_CBOR_ROOT_KEY_MODULES 1U
#define SPAGHETTI_CONFIG_CBOR_ROOT_KEY_SAMPLING 2U
#define SPAGHETTI_CONFIG_CBOR_ROOT_KEY_MQTT 3U
#define SPAGHETTI_CONFIG_CBOR_MODULE_KEY_STABLE_KEY 0U
#define SPAGHETTI_CONFIG_CBOR_MODULE_KEY_PORT 1U
#define SPAGHETTI_CONFIG_CBOR_MODULE_KEY_TYPE 2U
#define SPAGHETTI_CONFIG_CBOR_MODULE_KEY_DRIVER_CONFIG 3U
#define SPAGHETTI_CONFIG_CBOR_INA219_KEY_ADDRESS 0U
#define SPAGHETTI_CONFIG_CBOR_INA219_KEY_SHUNT 1U
#define SPAGHETTI_CONFIG_CBOR_INA219_KEY_CURRENT_LSB 2U
#define SPAGHETTI_CONFIG_CBOR_SAMPLING_KEY_SOURCE 0U
#define SPAGHETTI_CONFIG_CBOR_SAMPLING_KEY_PERIOD 1U
#define SPAGHETTI_CONFIG_CBOR_SAMPLING_KEY_ENABLED 2U
#define SPAGHETTI_CONFIG_CBOR_SAMPLING_PERIOD_MAX_MS 86400000U
#define SPAGHETTI_CONFIG_CBOR_MQTT_KEY_ENABLED 0U
#define SPAGHETTI_CONFIG_CBOR_MQTT_KEY_HOST 1U
#define SPAGHETTI_CONFIG_CBOR_MQTT_KEY_PORT 2U
#define SPAGHETTI_CONFIG_CBOR_MQTT_KEY_BASE_TOPIC 3U

static int expect_key(zcbor_state_t *state, uint32_t expected)
{
	return zcbor_uint32_expect(state, expected) ? 0 : -EBADMSG;
}

static int decode_ina219_config(
	zcbor_state_t *state,
	struct spaghetti_module_config *module)
{
	struct spaghetti_ina219_config ina219_config = {0};
	uint32_t address;
	uint32_t shunt_milliohm;
	uint32_t current_lsb_microamp;
	int err;

	if (!zcbor_map_start_decode(state)) {
		return -EBADMSG;
	}

	err = expect_key(state, SPAGHETTI_CONFIG_CBOR_INA219_KEY_ADDRESS);
	if ((err < 0) || !zcbor_uint32_decode(state, &address)) {
		return -EBADMSG;
	}
	err = expect_key(state, SPAGHETTI_CONFIG_CBOR_INA219_KEY_SHUNT);
	if ((err < 0) || !zcbor_uint32_decode(state, &shunt_milliohm)) {
		return -EBADMSG;
	}
	err = expect_key(state, SPAGHETTI_CONFIG_CBOR_INA219_KEY_CURRENT_LSB);
	if ((err < 0) || !zcbor_uint32_decode(state, &current_lsb_microamp)) {
		return -EBADMSG;
	}
	if (!zcbor_map_end_decode(state)) {
		return -EBADMSG;
	}

	if ((address < 0x40U) || (address > 0x4FU) ||
	    (shunt_milliohm == 0U) || (shunt_milliohm > UINT16_MAX) ||
	    (current_lsb_microamp == 0U) ||
	    (current_lsb_microamp > UINT16_MAX)) {
		return -EINVAL;
	}

	ina219_config.i2c_address = (uint8_t)address;
	ina219_config.shunt_milliohm = (uint16_t)shunt_milliohm;
	ina219_config.current_lsb_microamp =
		(uint16_t)current_lsb_microamp;
	module->driver_config_size = sizeof(ina219_config);
	memcpy(module->driver_config, &ina219_config, sizeof(ina219_config));
	return 0;
}

static int decode_module(zcbor_state_t *state,
			 struct spaghetti_module_config *module)
{
	struct zcbor_string type_id;
	uint32_t key;
	uint32_t port_id;
	int err;

	if (!zcbor_map_start_decode(state)) {
		return -EBADMSG;
	}

	err = expect_key(state, SPAGHETTI_CONFIG_CBOR_MODULE_KEY_STABLE_KEY);
	if ((err < 0) || !zcbor_uint32_decode(state, &key)) {
		return -EBADMSG;
	}
	err = expect_key(state, SPAGHETTI_CONFIG_CBOR_MODULE_KEY_PORT);
	if ((err < 0) || !zcbor_uint32_decode(state, &port_id)) {
		return -EBADMSG;
	}
	err = expect_key(state, SPAGHETTI_CONFIG_CBOR_MODULE_KEY_TYPE);
	if ((err < 0) || !zcbor_tstr_decode(state, &type_id)) {
		return -EBADMSG;
	}

	if ((key == 0U) || (port_id > UINT8_MAX)) {
		return -EINVAL;
	}
	if (type_id.len >= sizeof(module->type_id)) {
		return -EMSGSIZE;
	}
	if ((type_id.len != (sizeof("ina219") - 1U)) ||
	    (memcmp(type_id.value, "ina219", type_id.len) != 0)) {
		return -ENOTSUP;
	}

	module->key = key;
	module->port_id = (spaghetti_port_id_t)port_id;
	memcpy(module->type_id, type_id.value, type_id.len);
	module->type_id[type_id.len] = '\0';

	err = expect_key(state,
			 SPAGHETTI_CONFIG_CBOR_MODULE_KEY_DRIVER_CONFIG);
	if (err < 0) {
		return err;
	}
	err = decode_ina219_config(state, module);
	if (err < 0) {
		return err;
	}
	if (!zcbor_map_end_decode(state)) {
		return -EBADMSG;
	}

	return 0;
}

static int decode_modules(zcbor_state_t *state,
			  struct spaghetti_config *config)
{
	if (!zcbor_list_start_decode(state)) {
		return -EBADMSG;
	}

	while (!zcbor_array_at_end(state)) {
		int err;

		if (config->module_count >= SPAGHETTI_CONFIG_MAX_MODULES) {
			return -EMSGSIZE;
		}

		err = decode_module(state,
				    &config->modules[config->module_count]);
		if (err < 0) {
			return err;
		}
		++config->module_count;
	}

	return zcbor_list_end_decode(state) ? 0 : -EBADMSG;
}

static int decode_sampling(
	zcbor_state_t *state,
	struct spaghetti_runtime_sampling_config *sampling)
{
	uint32_t source_key;
	uint32_t period_ms;
	bool enabled;
	int err;

	if (!zcbor_map_start_decode(state)) {
		return -EBADMSG;
	}

	err = expect_key(state, SPAGHETTI_CONFIG_CBOR_SAMPLING_KEY_SOURCE);
	if ((err < 0) || !zcbor_uint32_decode(state, &source_key)) {
		return -EBADMSG;
	}
	err = expect_key(state, SPAGHETTI_CONFIG_CBOR_SAMPLING_KEY_PERIOD);
	if ((err < 0) || !zcbor_uint32_decode(state, &period_ms)) {
		return -EBADMSG;
	}
	err = expect_key(state, SPAGHETTI_CONFIG_CBOR_SAMPLING_KEY_ENABLED);
	if ((err < 0) || !zcbor_bool_decode(state, &enabled)) {
		return -EBADMSG;
	}
	if (!zcbor_map_end_decode(state)) {
		return -EBADMSG;
	}

	if ((source_key == 0U) || (period_ms == 0U) ||
	    (period_ms > SPAGHETTI_CONFIG_CBOR_SAMPLING_PERIOD_MAX_MS)) {
		return -EINVAL;
	}

	sampling->source_key = source_key;
	sampling->period_ms = period_ms;
	sampling->enabled = enabled;
	return 0;
}

static int copy_text(const struct zcbor_string *text, char *destination,
		     size_t capacity)
{
	if (text->len >= capacity) {
		return -EMSGSIZE;
	}

	memcpy(destination, text->value, text->len);
	destination[text->len] = '\0';
	return 0;
}

static int decode_mqtt(zcbor_state_t *state,
		       struct spaghetti_mqtt_config *mqtt)
{
	struct zcbor_string host;
	struct zcbor_string base_topic;
	uint32_t port;
	bool enabled;
	int err;

	if (!zcbor_map_start_decode(state)) {
		return -EBADMSG;
	}

	err = expect_key(state, SPAGHETTI_CONFIG_CBOR_MQTT_KEY_ENABLED);
	if ((err < 0) || !zcbor_bool_decode(state, &enabled)) {
		return -EBADMSG;
	}
	err = expect_key(state, SPAGHETTI_CONFIG_CBOR_MQTT_KEY_HOST);
	if ((err < 0) || !zcbor_tstr_decode(state, &host)) {
		return -EBADMSG;
	}
	err = expect_key(state, SPAGHETTI_CONFIG_CBOR_MQTT_KEY_PORT);
	if ((err < 0) || !zcbor_uint32_decode(state, &port)) {
		return -EBADMSG;
	}
	err = expect_key(state, SPAGHETTI_CONFIG_CBOR_MQTT_KEY_BASE_TOPIC);
	if ((err < 0) || !zcbor_tstr_decode(state, &base_topic)) {
		return -EBADMSG;
	}
	if (!zcbor_map_end_decode(state)) {
		return -EBADMSG;
	}
	if (port > UINT16_MAX) {
		return -EINVAL;
	}

	err = copy_text(&host, mqtt->host, sizeof(mqtt->host));
	if (err < 0) {
		return err;
	}
	err = copy_text(&base_topic, mqtt->base_topic,
			sizeof(mqtt->base_topic));
	if (err < 0) {
		return err;
	}

	mqtt->enabled = enabled;
	mqtt->port = (uint16_t)port;
	return 0;
}

int spaghetti_config_decode_cbor(const uint8_t *bytes, size_t length,
				 struct spaghetti_config *out)
{
	struct spaghetti_config temporary = {
		.version = SPAGHETTI_CONFIG_VERSION,
	};
	uint32_t wire_version;
	int err;

	if ((bytes == NULL) || (out == NULL) || (length == 0U)) {
		return -EINVAL;
	}
	if (length > SPAGHETTI_CONFIG_CBOR_MAX_SIZE) {
		return -EMSGSIZE;
	}

	ZCBOR_STATE_D(state, SPAGHETTI_CONFIG_CBOR_BACKUP_COUNT, bytes,
		       length, 1U, 0U);

	if (!zcbor_map_start_decode(state)) {
		return -EBADMSG;
	}

	err = expect_key(state, SPAGHETTI_CONFIG_CBOR_ROOT_KEY_VERSION);
	if ((err < 0) || !zcbor_uint32_decode(state, &wire_version)) {
		return -EBADMSG;
	}
	if ((wire_version != SPAGHETTI_CONFIG_CBOR_WIRE_VERSION_V0) &&
	    (wire_version != SPAGHETTI_CONFIG_CBOR_WIRE_VERSION_V1)) {
		return -ENOTSUP;
	}

	err = expect_key(state, SPAGHETTI_CONFIG_CBOR_ROOT_KEY_MODULES);
	if (err < 0) {
		return err;
	}
	err = decode_modules(state, &temporary);
	if (err < 0) {
		return err;
	}

	err = expect_key(state, SPAGHETTI_CONFIG_CBOR_ROOT_KEY_SAMPLING);
	if (err < 0) {
		return err;
	}
	err = decode_sampling(state, &temporary.sampling);
	if (err < 0) {
		return err;
	}

	if (wire_version == SPAGHETTI_CONFIG_CBOR_WIRE_VERSION_V1) {
		err = expect_key(state, SPAGHETTI_CONFIG_CBOR_ROOT_KEY_MQTT);
		if (err < 0) {
			return err;
		}
		err = decode_mqtt(state, &temporary.mqtt);
		if (err < 0) {
			return err;
		}
	}
	if (!zcbor_map_end_decode(state) ||
	    (state->payload != state->payload_end)) {
		return -EBADMSG;
	}

	err = spaghetti_config_validate(&temporary);
	if (err < 0) {
		return err;
	}

	*out = temporary;
	return 0;
}
