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
#include <spaghetti/module.h>
#include <spaghetti/module_manager.h>
#include <spaghetti/port.h>

#include "communication_internal.h"

LOG_MODULE_REGISTER(spaghetti_communication,
		    CONFIG_SPAGHETTI_COMMUNICATION_LOG_LEVEL);

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
	struct spaghetti_module_snapshot
		snapshots[SPAGHETTI_CONFIG_MAX_MODULES];
	struct spaghetti_communication_status_payload status = {0};
	size_t module_count;
	int err = collect_module_snapshots(snapshots, &module_count);

	if (err < 0) {
		return err;
	}

	status.core_state = (uint8_t)spaghetti_core_get_state();
	status.port_count = (uint8_t)spaghetti_port_count();
	status.module_count = (uint8_t)module_count;
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
		module_status->endpoint_value = snapshot->endpoint.value;
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
		result.status = -ENOTSUP;
	}

	*response = result;
	return 0;
}
