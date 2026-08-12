#include <spaghetti/communication.h>

#include <errno.h>
#include <stdbool.h>
#include <stddef.h>
#include <stdint.h>
#include <string.h>

#include <zephyr/kernel.h>
#include <zephyr/logging/log.h>
#include <zephyr/sys/atomic.h>
#include <zephyr/sys/util.h>

#include <spaghetti/core.h>
#include <spaghetti/config.h>
#include <spaghetti/config_codec.h>
#include <spaghetti/health.h>
#include <spaghetti/module.h>
#include <spaghetti/module_manager.h>
#include <spaghetti/port.h>

#include "communication_internal.h"

LOG_MODULE_REGISTER(spaghetti_communication,
		    CONFIG_SPAGHETTI_COMMUNICATION_LOG_LEVEL);

SPAGHETTI_HEALTH_COMPONENT_DEFINE(communication_health) = {
	.id = SPAGHETTI_HEALTH_ID_COMMUNICATION,
	.name = "communication",
	.maximum_silence_ms = 3000U,
	.required_core_modes = BIT(SPAGHETTI_CORE_MODE_UNPROVISIONED) |
		BIT(SPAGHETTI_CORE_MODE_NORMAL) |
		BIT(SPAGHETTI_CORE_MODE_MAINTENANCE),
};

static void communication_health_keepalive_handler(struct k_work *work);

K_WORK_DELAYABLE_DEFINE(communication_health_keepalive,
			communication_health_keepalive_handler);

static void communication_health_keepalive_handler(struct k_work *work)
{
	ARG_UNUSED(work);
	(void)spaghetti_health_heartbeat(SPAGHETTI_HEALTH_ID_COMMUNICATION);
	(void)k_work_reschedule(&communication_health_keepalive,
		K_MSEC(CONFIG_SPAGHETTI_HEALTH_KEEPALIVE_MS));
}

static atomic_t is_initialized;
K_MUTEX_DEFINE(communication_lock);

BUILD_ASSERT(sizeof(struct spaghetti_communication_status_payload) <=
	     SPAGHETTI_COMM_PAYLOAD_MAX);
BUILD_ASSERT(SPAGHETTI_CONFIG_MAX_MODULES <= UINT8_MAX);

static int collect_module_snapshots(
	struct spaghetti_module_snapshot *snapshots,
	size_t *out_module_count)
{
	const size_t port_count = spaghetti_port_count();
	size_t total_count = 0U;

	if (port_count > UINT8_MAX) {
		return -EOVERFLOW;
	}

	for (size_t port_idx = 0U; port_idx < port_count; ++port_idx) {
		size_t port_module_count;
		int err = spaghetti_module_manager_list_by_port(
			(spaghetti_port_id_t)port_idx, NULL, 0U,
			&port_module_count);

		if (err < 0) {
			return err;
		}
		if (port_module_count >
		    (SPAGHETTI_CONFIG_MAX_MODULES - total_count)) {
			return -ENOSPC;
		}
		if (port_module_count == 0U) {
			continue;
		}

		err = spaghetti_module_manager_list_by_port(
			(spaghetti_port_id_t)port_idx, &snapshots[total_count],
			SPAGHETTI_CONFIG_MAX_MODULES - total_count,
			&port_module_count);
		if (err < 0) {
			return err;
		}
		total_count += port_module_count;
	}

	*out_module_count = total_count;
	return 0;
}

static int build_status_payload(struct spaghetti_response *response)
{
	struct spaghetti_core_info core_info;
	struct spaghetti_module_snapshot
		snapshots[SPAGHETTI_CONFIG_MAX_MODULES];
	struct spaghetti_communication_status_payload status = {0};
	size_t module_count;
	int err = spaghetti_core_get_info(&core_info);

	if (err < 0) {
		return err;
	}
	err = collect_module_snapshots(snapshots, &module_count);

	if (err < 0) {
		return err;
	}

	status.core_state = (uint8_t)core_info.state;
	status.core_mode = (uint8_t)core_info.mode;
	status.image_state = (uint8_t)core_info.image_state;
	status.active_slot = core_info.active_slot;
	status.image_confirmed = core_info.image_confirmed ? 1U : 0U;
	status.port_count = (uint8_t)spaghetti_port_count();
	status.module_count = (uint8_t)module_count;
	memcpy(status.version, core_info.version, sizeof(status.version));
	for (size_t module_idx = 0U; module_idx < module_count; ++module_idx) {
		const struct spaghetti_module_snapshot *snapshot =
			&snapshots[module_idx];
		struct spaghetti_communication_module_status *module_status =
			&status.modules[module_idx];
		const size_t type_id_size = strlen(snapshot->type_id) + 1U;

		if (type_id_size > sizeof(module_status->type_id)) {
			return -EMSGSIZE;
		}

		module_status->key = snapshot->key;
		module_status->endpoint_value = 0U;
		if (snapshot->endpoint.value_size > 0U) {
			const size_t copy_size = MIN(
				snapshot->endpoint.value_size,
				sizeof(module_status->endpoint_value));

			memcpy(&module_status->endpoint_value,
			       snapshot->endpoint.value, copy_size);
		}
		module_status->runtime_id = snapshot->id;
		module_status->port_id = snapshot->port_id;
		module_status->state = (uint8_t)snapshot->state;
		module_status->endpoint_kind =
			(uint8_t)snapshot->endpoint.kind;
		memcpy(module_status->type_id, snapshot->type_id, type_id_size);
	}

	response->payload_size =
		offsetof(struct spaghetti_communication_status_payload, modules) +
		(module_count *
		 sizeof(struct spaghetti_communication_module_status));
	memcpy(response->payload, &status, response->payload_size);
	return 0;
}

int spaghetti_communication_init(void)
{
	int err = k_mutex_lock(&communication_lock, K_FOREVER);

	if (err < 0) {
		return err;
	}
	if (atomic_get(&is_initialized) != 0) {
		k_mutex_unlock(&communication_lock);
		return -EALREADY;
	}

	err = spaghetti_communication_shell_init();
	if (err == 0) {
		atomic_set(&is_initialized, 1);
	}
	k_mutex_unlock(&communication_lock);
	if (err < 0) {
		return err;
	}

	(void)k_work_reschedule(&communication_health_keepalive,
		K_MSEC(CONFIG_SPAGHETTI_HEALTH_KEEPALIVE_MS));
	LOG_INF("ready");
	return 0;
}

int spaghetti_communication_handle_request(
	const struct spaghetti_request *request,
	struct spaghetti_response *response)
{
	struct spaghetti_response result = {0};

	if ((request == NULL) || (response == NULL)) {
		return -EINVAL;
	}
	if (request->payload_size > SPAGHETTI_COMM_PAYLOAD_MAX) {
		return -EMSGSIZE;
	}
	if (atomic_get(&is_initialized) == 0) {
		return -EACCES;
	}
	if ((request->type != SPAGHETTI_REQUEST_GET_STATUS) &&
	    (request->type != SPAGHETTI_REQUEST_SET_CONFIG)) {
		return -ENOTSUP;
	}
	if ((request->type == SPAGHETTI_REQUEST_GET_STATUS) &&
	    (request->payload_size != 0U)) {
		return -EINVAL;
	}
	if ((request->type == SPAGHETTI_REQUEST_SET_CONFIG) &&
	    (request->payload_size == 0U)) {
		return -EINVAL;
	}

	result.correlation_id = request->correlation_id;
	if (request->type == SPAGHETTI_REQUEST_GET_STATUS) {
		result.status = build_status_payload(&result);
		if (result.status < 0) {
			result.payload_size = 0U;
		}
	} else {
		struct spaghetti_config candidate;
		struct spaghetti_config current;
		struct spaghetti_config_revision revision;

		result.status = spaghetti_config_decode_cbor(
			request->payload, request->payload_size, &candidate);
		if (result.status == 0) {
			result.status = spaghetti_config_get_snapshot(
				&current, &revision);
		}
		if (result.status == 0) {
			result.status = spaghetti_config_apply(
				&candidate, revision.generation, NULL);
		}
	}

	*response = result;
	(void)spaghetti_health_heartbeat(SPAGHETTI_HEALTH_ID_COMMUNICATION);
	return 0;
}

void spaghetti_communication_invalidate_sessions(void)
{
	/* Phase 360 will close transport sessions. */
}

void spaghetti_communication_invalidate_principal(
	spaghetti_principal_id_t principal_id)
{
	ARG_UNUSED(principal_id);
	/* Phase 360 will close sessions owned by principal_id. */
}
