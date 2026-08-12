#include <spaghetti/protocol.h>

#include <errno.h>
#include <stddef.h>
#include <stdint.h>

#include <zcbor_common.h>
#include <zcbor_encode.h>

#include <spaghetti/access_control.h>
#include <spaghetti/update.h>

#include "../communication_internal.h"

static const struct spaghetti_schema_descriptor empty_schema = {
	.schema_id = "spaghetti.protocol.update",
	.version = 1U,
	.fields = NULL,
	.field_count = 0U,
};

static int execute_get_update_status(
	const struct spaghetti_request_context *context,
	const struct spaghetti_protocol_payload *request,
	struct spaghetti_protocol_payload *response)
{
	struct spaghetti_update_status status;
	int err;

	ARG_UNUSED(context);
	ARG_UNUSED(request);
	err = spaghetti_update_get_status(&status);
	if (err < 0) {
		return err;
	}
	{
		ZCBOR_STATE_E(state, SPAGHETTI_OPS_CBOR_BACKUP, response->bytes,
			       sizeof(response->bytes), 1U);

		if (!zcbor_map_start_encode(state, 5U) ||
		    !zcbor_uint32_put(state, 0U) ||
		    !zcbor_uint32_put(state, (uint32_t)status.state) ||
		    !zcbor_uint32_put(state, 1U) ||
		    !zcbor_uint32_put(state, (uint32_t)status.transport) ||
		    !zcbor_uint32_put(state, 2U) ||
		    !zcbor_uint32_put(state, status.timeout_remaining_ms) ||
		    !zcbor_uint32_put(state, 3U) ||
		    !zcbor_uint32_put(state, status.active_slot) ||
		    !zcbor_uint32_put(state, 4U) ||
		    !zcbor_bool_put(state, status.image_confirmed) ||
		    !zcbor_map_end_encode(state, 5U)) {
			return -EMSGSIZE;
		}
		response->size = (size_t)(state->payload - response->bytes);
	}
	return 0;
}

static int execute_open_wifi_update(
	const struct spaghetti_request_context *context,
	const struct spaghetti_protocol_payload *request,
	struct spaghetti_protocol_payload *response)
{
	uint32_t timeout_ms = 60000U;
	int err;

	ARG_UNUSED(context);
	err = spaghetti_ops_decode_optional_u32(request, 0U, 60000U, &timeout_ms);
	if (err < 0) {
		return err;
	}
	err = spaghetti_update_arm(timeout_ms);
	if (err < 0) {
		return err;
	}
	err = spaghetti_update_begin(SPAGHETTI_UPDATE_TRANSPORT_UDP);
	if (err < 0) {
		(void)spaghetti_update_cancel();
		return err;
	}
	return spaghetti_ops_encode_empty_map(response);
}

SPAGHETTI_OPERATION_HANDLER_DEFINE(op_get_update_status) = {
	.operation = SPAGHETTI_PROTOCOL_GET_UPDATE_STATUS,
	.required_permissions = SPAGHETTI_PERMISSION_READ,
	.execution = SPAGHETTI_OPERATION_IMMEDIATE_READ,
	.request_schema = &empty_schema,
	.response_schema = &empty_schema,
	.execute = execute_get_update_status,
};

SPAGHETTI_OPERATION_HANDLER_DEFINE(op_open_wifi_update) = {
	.operation = SPAGHETTI_PROTOCOL_OPEN_WIFI_UPDATE,
	.required_permissions = SPAGHETTI_PERMISSION_UPDATE,
	.execution = SPAGHETTI_OPERATION_ASYNC_JOB,
	.request_schema = &empty_schema,
	.response_schema = &empty_schema,
	.execute = execute_open_wifi_update,
};
