#include <spaghetti/protocol.h>

#include <errno.h>
#include <stddef.h>
#include <stdint.h>

#include <zcbor_common.h>
#include <zcbor_encode.h>

#include <spaghetti/access_control.h>
#include <spaghetti/connectivity.h>
#include <spaghetti/storage.h>

#include "../communication_internal.h"

static const struct spaghetti_schema_descriptor empty_schema = {
	.schema_id = "spaghetti.protocol.connectivity",
	.version = 1U,
	.fields = NULL,
	.field_count = 0U,
};

static int execute_get_connectivity_status(
	const struct spaghetti_request_context *context,
	const struct spaghetti_protocol_payload *request,
	struct spaghetti_protocol_payload *response)
{
	struct spaghetti_connectivity_snapshot snap;
	int err;

	ARG_UNUSED(context);
	ARG_UNUSED(request);
	err = spaghetti_connectivity_get_snapshot(&snap);
	if (err < 0) {
		return err;
	}
	{
		ZCBOR_STATE_E(state, SPAGHETTI_OPS_CBOR_BACKUP, response->bytes,
			       sizeof(response->bytes), 1U);

		if (!zcbor_map_start_encode(state, 5U) ||
		    !zcbor_uint32_put(state, 0U) ||
		    !zcbor_uint32_put(state, (uint32_t)snap.policy) ||
		    !zcbor_uint32_put(state, 1U) ||
		    !zcbor_uint32_put(state, snap.active_services) ||
		    !zcbor_uint32_put(state, 2U) ||
		    !zcbor_uint32_put(state, snap.leased_services) ||
		    !zcbor_uint32_put(state, 3U) ||
		    !zcbor_int64_put(state, snap.lease_expires_at_ms) ||
		    !zcbor_uint32_put(state, 4U) ||
		    !zcbor_int32_put(state, snap.last_error) ||
		    !zcbor_map_end_encode(state, 5U)) {
			return -EMSGSIZE;
		}
		response->size = (size_t)(state->payload - response->bytes);
	}
	return 0;
}

static int execute_acquire_lease(
	const struct spaghetti_request_context *context,
	const struct spaghetti_protocol_payload *request,
	struct spaghetti_protocol_payload *response)
{
	uint32_t services = 0U;
	uint32_t duration_ms = 0U;
	struct spaghetti_connectivity_lease_request lease;
	int err;

	ARG_UNUSED(context);
	err = spaghetti_ops_decode_u32(request, 0U, &services);
	if (err < 0) {
		return err;
	}
	err = spaghetti_ops_decode_u32(request, 1U, &duration_ms);
	if (err < 0) {
		return err;
	}
	lease.services = services;
	lease.duration_ms = duration_ms;
	err = spaghetti_connectivity_acquire_lease(&lease);
	if (err < 0) {
		return err;
	}
	return spaghetti_ops_encode_empty_map(response);
}

static int execute_release_lease(
	const struct spaghetti_request_context *context,
	const struct spaghetti_protocol_payload *request,
	struct spaghetti_protocol_payload *response)
{
	int err;

	ARG_UNUSED(context);
	ARG_UNUSED(request);
	err = spaghetti_connectivity_release_lease();
	if (err < 0) {
		return err;
	}
	return spaghetti_ops_encode_empty_map(response);
}

static int execute_open_network_maintenance(
	const struct spaghetti_request_context *context,
	const struct spaghetti_protocol_payload *request,
	struct spaghetti_protocol_payload *response)
{
	int err;

	ARG_UNUSED(context);
	ARG_UNUSED(request);
	err = spaghetti_storage_request_maintenance_once();
	if (err < 0) {
		return err;
	}
	return spaghetti_ops_encode_empty_map(response);
}

SPAGHETTI_OPERATION_HANDLER_DEFINE(op_get_connectivity_status) = {
	.operation = SPAGHETTI_PROTOCOL_GET_CONNECTIVITY_STATUS,
	.required_permissions = SPAGHETTI_PERMISSION_READ,
	.execution = SPAGHETTI_OPERATION_IMMEDIATE_READ,
	.request_schema = &empty_schema,
	.response_schema = &empty_schema,
	.execute = execute_get_connectivity_status,
};

SPAGHETTI_OPERATION_HANDLER_DEFINE(op_acquire_connectivity_lease) = {
	.operation = SPAGHETTI_PROTOCOL_ACQUIRE_CONNECTIVITY_LEASE,
	.required_permissions = SPAGHETTI_PERMISSION_COMMAND,
	.execution = SPAGHETTI_OPERATION_SERIALIZED_MUTATION,
	.request_schema = &empty_schema,
	.response_schema = &empty_schema,
	.execute = execute_acquire_lease,
};

SPAGHETTI_OPERATION_HANDLER_DEFINE(op_release_connectivity_lease) = {
	.operation = SPAGHETTI_PROTOCOL_RELEASE_CONNECTIVITY_LEASE,
	.required_permissions = SPAGHETTI_PERMISSION_COMMAND,
	.execution = SPAGHETTI_OPERATION_SERIALIZED_MUTATION,
	.request_schema = &empty_schema,
	.response_schema = &empty_schema,
	.execute = execute_release_lease,
};

SPAGHETTI_OPERATION_HANDLER_DEFINE(op_open_network_maintenance) = {
	.operation = SPAGHETTI_PROTOCOL_OPEN_NETWORK_MAINTENANCE,
	.required_permissions = SPAGHETTI_PERMISSION_PROVISION,
	.execution = SPAGHETTI_OPERATION_ASYNC_JOB,
	.request_schema = &empty_schema,
	.response_schema = &empty_schema,
	.execute = execute_open_network_maintenance,
};
