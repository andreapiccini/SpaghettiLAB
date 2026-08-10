#include <errno.h>
#include <stdbool.h>
#include <stddef.h>
#include <stdint.h>
#include <string.h>

#include <zephyr/ztest.h>

#include <spaghetti/communication.h>
#include <spaghetti/core.h>
#include <spaghetti/module.h>
#include <spaghetti/module_manager.h>
#include <spaghetti/port.h>

#include "communication_internal.h"

static bool report_no_modules;
static bool report_long_type_id;

enum spaghetti_core_state spaghetti_core_get_state(void)
{
	return SPAGHETTI_CORE_READY;
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
			.value = 0x40U,
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
			.value = 0U,
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
	zassert_ok(spaghetti_communication_handle_request(&request, &response));
	zassert_equal(response.correlation_id, 8U);
	zassert_equal(response.status, -ENOTSUP);
	zassert_equal(response.payload_size, 0U);
}

ZTEST_SUITE(communication, NULL, NULL, NULL, NULL, NULL);
