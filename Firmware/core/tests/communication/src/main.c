#include <errno.h>
#include <stdbool.h>
#include <stddef.h>
#include <stdint.h>
#include <string.h>

#include <zephyr/ztest.h>
#include <zephyr/sys/reboot.h>

#include <spaghetti/communication.h>
#include <spaghetti/config_codec.h>
#include <spaghetti/core.h>
#include <spaghetti/maintenance_link.h>
#include <spaghetti/module.h>
#include <spaghetti/module_manager.h>
#include <spaghetti/port.h>
#include <spaghetti/remote_console.h>
#include <spaghetti/wifi_profiles.h>

#include "communication_internal.h"

static bool report_no_modules;
static bool report_long_type_id;
static int decode_error;
static int apply_error;
static uint32_t decode_count;
static uint32_t apply_count;
static bool stored_config_present;

FUNC_NORETURN void sys_reboot(int type)
{
	ARG_UNUSED(type);
	for (;;) {
	}
}

int spaghetti_storage_request_maintenance_once(void)
{
	return 0;
}

enum spaghetti_maintenance_link_state spaghetti_maintenance_link_get_state(void)
{
	return SPAGHETTI_MAINTENANCE_LINK_ACTIVE;
}

int spaghetti_storage_read_config(struct spaghetti_config *out)
{
	if (out == NULL) {
		return -EINVAL;
	}
	if (!stored_config_present) {
		return -ENOENT;
	}
	*out = (struct spaghetti_config) {
		.version = SPAGHETTI_CONFIG_VERSION,
	};
	return 0;
}

int spaghetti_storage_write_config(const struct spaghetti_config *config)
{
	if (config == NULL) {
		return -EINVAL;
	}
	stored_config_present = true;
	return 0;
}

int spaghetti_config_validate(
	const struct spaghetti_config *candidate,
	struct spaghetti_config_error *error)
{
	ARG_UNUSED(error);
	if ((candidate == NULL) ||
	    (candidate->version != SPAGHETTI_CONFIG_VERSION)) {
		return -EINVAL;
	}
	return 0;
}

int spaghetti_remote_console_set_credentials(
	const uint8_t *psk, size_t psk_size,
	const uint8_t *identity, size_t identity_size)
{
	if ((psk == NULL) ||
	    (psk_size != SPAGHETTI_REMOTE_CONSOLE_PSK_SIZE) ||
	    (identity == NULL) || (identity_size == 0U)) {
		return -EINVAL;
	}
	return 0;
}

int spaghetti_remote_console_clear_credentials(void)
{
	return 0;
}

int spaghetti_remote_console_get_status(
	struct spaghetti_remote_console_status *out)
{
	if (out == NULL) {
		return -EINVAL;
	}
	*out = (struct spaghetti_remote_console_status) {
		.state = SPAGHETTI_REMOTE_CONSOLE_DISABLED,
		.port = 1338U,
	};
	return 0;
}

int spaghetti_wifi_profiles_set(
	const struct spaghetti_wifi_profile_config *config)
{
	return (config != NULL) ? 0 : -EINVAL;
}

int spaghetti_wifi_profiles_remove(const char *ssid)
{
	return (ssid != NULL) ? 0 : -EINVAL;
}

int spaghetti_wifi_profiles_set_preferred(const char *ssid)
{
	return (ssid != NULL) ? 0 : -EINVAL;
}

int spaghetti_wifi_profiles_clear_preferred(void)
{
	return 0;
}

int spaghetti_wifi_profiles_list(
	struct spaghetti_wifi_profile_summary *out,
	size_t capacity,
	size_t *out_count)
{
	ARG_UNUSED(out);
	ARG_UNUSED(capacity);
	if (out_count == NULL) {
		return -EINVAL;
	}

	*out_count = 0U;
	return 0;
}

int spaghetti_wifi_profiles_request_connect(void)
{
	return 0;
}

int spaghetti_wifi_profiles_get_status(
	struct spaghetti_wifi_profiles_status *out)
{
	if (out == NULL) {
		return -EINVAL;
	}

	*out = (struct spaghetti_wifi_profiles_status) {
		.state = SPAGHETTI_WIFI_PROFILES_IDLE,
	};
	return 0;
}

int spaghetti_config_decode_cbor(const uint8_t *bytes, size_t length,
				 struct spaghetti_config *out)
{
	++decode_count;
	if ((bytes == NULL) || (length == 0U) || (out == NULL)) {
		return -EINVAL;
	}
	if (decode_error < 0) {
		return decode_error;
	}

	const struct spaghetti_config decoded = {
		.version = SPAGHETTI_CONFIG_VERSION,
	};

	*out = decoded;
	return 0;
}

int spaghetti_config_apply(const struct spaghetti_config *candidate,
			   uint32_t expected_generation)
{
	++apply_count;
	if (expected_generation != 7U) {
		return -ESTALE;
	}
	return (candidate != NULL) ? apply_error : -EINVAL;
}

int spaghetti_config_get_snapshot(struct spaghetti_config *out,
				  uint32_t *generation)
{
	if ((out == NULL) || (generation == NULL)) {
		return -EINVAL;
	}

	*out = (struct spaghetti_config) {
		.version = SPAGHETTI_CONFIG_VERSION,
	};
	*generation = 7U;
	return 0;
}

enum spaghetti_core_state spaghetti_core_get_state(void)
{
	return SPAGHETTI_CORE_READY;
}

int spaghetti_core_get_info(struct spaghetti_core_info *out)
{
	if (out == NULL) {
		return -EINVAL;
	}

	*out = (struct spaghetti_core_info) {
		.state = SPAGHETTI_CORE_READY,
		.mode = SPAGHETTI_CORE_MODE_NORMAL,
		.image_state = SPAGHETTI_CORE_IMAGE_CONFIRMED,
		.active_slot = 0U,
		.image_confirmed = true,
		.version = "1.2.3+4",
	};
	return 0;
}

size_t spaghetti_port_count(void)
{
	return 2U;
}

int spaghetti_module_manager_list_by_port(
	spaghetti_port_id_t port_id,
	struct spaghetti_module_snapshot *out,
	size_t capacity,
	size_t *out_count)
{
	if ((out_count == NULL) || (port_id > 1U) ||
	    ((out == NULL) != (capacity == 0U))) {
		return -EINVAL;
	}

	const size_t required =
		(!report_no_modules && (port_id == 0U)) ? 2U : 0U;

	*out_count = required;
	if (out == NULL) {
		return 0;
	}
	if (capacity < required) {
		return -ENOSPC;
	}

	const struct spaghetti_module_snapshot first = {
		.id = 3U,
		.key = 10U,
		.port_id = 0U,
		.type_id = "ina219",
		.endpoint = {
			.kind = SPAGHETTI_ENDPOINT_I2C_ADDRESS,
			.value_size = 1U,
			.value = {0x40U},
		},
		.state = SPAGHETTI_MODULE_READY,
	};
	const struct spaghetti_module_snapshot second = {
		.id = 4U,
		.key = 20U,
		.port_id = 0U,
		.type_id = "relay",
		.endpoint = {
			.kind = SPAGHETTI_ENDPOINT_PORT_EXCLUSIVE,
			.value_size = 0U,
		},
		.state = SPAGHETTI_MODULE_READY,
	};

	out[0] = first;
	out[1] = second;
	if (report_long_type_id) {
		memcpy(out[0].type_id, "1234567890123456",
		       sizeof("1234567890123456"));
	}
	return 0;
}

static void assert_response_unchanged(
	const struct spaghetti_response *response,
	const struct spaghetti_response *expected)
{
	zassert_mem_equal(response, expected, sizeof(*response));
}

ZTEST(communication, test_bounded_dispatch_status_and_hex_validation)
{
	const struct spaghetti_response sentinel = {
		.correlation_id = 99U,
		.status = -EIO,
		.payload_size = 1U,
		.payload = {0xAAU},
	};
	struct spaghetti_response response = sentinel;
	struct spaghetti_request request = {
		.correlation_id = 7U,
		.type = SPAGHETTI_REQUEST_GET_STATUS,
	};
	struct spaghetti_communication_status_payload status = {0};
	char oversized_hex[(SPAGHETTI_COMM_PAYLOAD_MAX * 2U) + 3U];

	zassert_equal(spaghetti_communication_handle_request(&request, &response),
		      -EACCES);
	assert_response_unchanged(&response, &sentinel);
	zassert_equal(spaghetti_communication_shell_decode_hex(NULL, &request),
		      -EINVAL);
	zassert_equal(spaghetti_communication_shell_decode_hex("", &request),
		      -EINVAL);
	zassert_equal(spaghetti_communication_shell_decode_hex("ABC", &request),
		      -EINVAL);
	zassert_equal(spaghetti_communication_shell_decode_hex("0G", &request),
		      -EINVAL);
	memset(oversized_hex, 'A', sizeof(oversized_hex) - 1U);
	oversized_hex[sizeof(oversized_hex) - 1U] = '\0';
	zassert_equal(spaghetti_communication_shell_decode_hex(
		oversized_hex, &request), -EMSGSIZE);
	oversized_hex[SPAGHETTI_COMM_PAYLOAD_MAX * 2U] = '\0';
	zassert_ok(spaghetti_communication_shell_decode_hex(
		oversized_hex, &request));
	zassert_equal(request.payload_size, SPAGHETTI_COMM_PAYLOAD_MAX);

	zassert_ok(spaghetti_communication_init());
	zassert_equal(spaghetti_communication_init(), -EALREADY);
	zassert_equal(spaghetti_communication_handle_request(NULL, &response),
		      -EINVAL);
	request.payload_size = SPAGHETTI_COMM_PAYLOAD_MAX + 1U;
	zassert_equal(spaghetti_communication_handle_request(&request, &response),
		      -EMSGSIZE);
	assert_response_unchanged(&response, &sentinel);
	request.payload_size = 0U;
	request.type = (enum spaghetti_request_type)99;
	zassert_equal(spaghetti_communication_handle_request(&request, &response),
		      -ENOTSUP);
	assert_response_unchanged(&response, &sentinel);

	request.type = SPAGHETTI_REQUEST_GET_STATUS;
	request.payload_size = 1U;
	zassert_equal(spaghetti_communication_handle_request(&request, &response),
		      -EINVAL);
	assert_response_unchanged(&response, &sentinel);
	request.payload_size = 0U;
	zassert_ok(spaghetti_communication_handle_request(&request, &response));
	zassert_equal(response.correlation_id, 7U);
	zassert_ok(response.status);
	zassert_equal(response.payload_size,
		offsetof(struct spaghetti_communication_status_payload, modules) +
		(2U * sizeof(struct spaghetti_communication_module_status)));
	memcpy(&status, response.payload, response.payload_size);
	zassert_equal(status.core_state, SPAGHETTI_CORE_READY);
	zassert_equal(status.core_mode, SPAGHETTI_CORE_MODE_NORMAL);
	zassert_equal(status.image_state, SPAGHETTI_CORE_IMAGE_CONFIRMED);
	zassert_equal(status.active_slot, 0U);
	zassert_equal(status.image_confirmed, 1U);
	zassert_equal(strcmp(status.version, "1.2.3+4"), 0);
	zassert_equal(status.port_count, 2U);
	zassert_equal(status.module_count, 2U);
	zassert_equal(status.modules[0].key, 10U);
	zassert_equal(status.modules[0].runtime_id, 3U);
	zassert_equal(status.modules[0].endpoint_value, 0x40U);
	zassert_equal(strcmp(status.modules[0].type_id, "ina219"), 0);
	zassert_equal(status.modules[1].key, 20U);
	zassert_equal(strcmp(status.modules[1].type_id, "relay"), 0);

	report_no_modules = true;
	zassert_ok(spaghetti_communication_handle_request(&request, &response));
	zassert_ok(response.status);
	memset(&status, 0, sizeof(status));
	memcpy(&status, response.payload, response.payload_size);
	zassert_equal(status.module_count, 0U);
	report_no_modules = false;
	report_long_type_id = true;
	zassert_ok(spaghetti_communication_handle_request(&request, &response));
	zassert_equal(response.status, -EMSGSIZE);
	zassert_equal(response.payload_size, 0U);
	report_long_type_id = false;

	request.correlation_id = 8U;
	zassert_ok(spaghetti_communication_shell_decode_hex("00aF", &request));
	zassert_equal(request.type, SPAGHETTI_REQUEST_SET_CONFIG);
	zassert_equal(request.payload_size, 2U);
	zassert_equal(request.payload[0], 0x00U);
	zassert_equal(request.payload[1], 0xAFU);
	decode_error = -EBADMSG;
	zassert_ok(spaghetti_communication_handle_request(&request, &response));
	zassert_equal(response.correlation_id, 8U);
	zassert_equal(response.status, -EBADMSG);
	zassert_equal(response.payload_size, 0U);
	zassert_equal(decode_count, 1U);
	zassert_equal(apply_count, 0U);

	decode_error = 0;
	apply_error = -EIO;
	zassert_ok(spaghetti_communication_handle_request(&request, &response));
	zassert_equal(response.status, -EIO);
	zassert_equal(decode_count, 2U);
	zassert_equal(apply_count, 1U);

	apply_error = 0;
	zassert_ok(spaghetti_communication_handle_request(&request, &response));
	zassert_ok(response.status);
	zassert_equal(decode_count, 3U);
	zassert_equal(apply_count, 2U);
}

ZTEST_SUITE(communication, NULL, NULL, NULL, NULL, NULL);
