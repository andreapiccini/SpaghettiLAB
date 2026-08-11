#include <spaghetti/discovery.h>

#include <errno.h>
#include <stdbool.h>
#include <string.h>

#include <zephyr/kernel.h>
#include <zephyr/logging/log.h>
#include <zephyr/sys/util.h>

LOG_MODULE_REGISTER(spaghetti_discovery, CONFIG_SPAGHETTI_DISCOVERY_LOG_LEVEL);

struct spaghetti_discovery_slot {
	bool used;
	bool busy;
	struct spaghetti_discovery_result result;
};

static struct spaghetti_discovery_slot
	results[CONFIG_SPAGHETTI_DISCOVERY_MAX_RESULTS];
static spaghetti_discovery_sink_t event_sink;
static void *event_sink_user_data;
static bool is_initialized;
K_MUTEX_DEFINE(results_lock);

BUILD_ASSERT(CONFIG_SPAGHETTI_DISCOVERY_MAX_RESULTS <=
	     CONFIG_SPAGHETTI_MAX_MODULES);

static int canonicalize_result(
	const struct spaghetti_discovery_result *input,
	struct spaghetti_discovery_result *output)
{
	const char *terminator;

	if ((input == NULL) || (output == NULL) || (input->key == 0U) ||
	    (input->generation == 0U) ||
	    (input->driver_config_size > SPAGHETTI_DRIVER_CONFIG_MAX) ||
	    ((input->source != SPAGHETTI_DISCOVERY_SOURCE_CONFIG) &&
	     (input->source != SPAGHETTI_DISCOVERY_SOURCE_PROVIDER))) {
		return -EINVAL;
	}

	terminator = memchr(input->type_id, '\0', sizeof(input->type_id));
	if ((terminator == NULL) || (terminator == input->type_id)) {
		return -EINVAL;
	}

	if (spaghetti_port_get(input->port_id) == NULL) {
		return -ENOENT;
	}

	memset(output, 0, sizeof(*output));
	output->key = input->key;
	output->port_id = input->port_id;
	output->driver_config_size = input->driver_config_size;
	output->source = input->source;
	output->generation = input->generation;
	memcpy(output->type_id, input->type_id,
	       (size_t)(terminator - input->type_id) + 1U);
	memcpy(output->driver_config, input->driver_config,
	       input->driver_config_size);
	return 0;
}

static struct spaghetti_discovery_slot *find_slot_by_key(
	spaghetti_module_key_t key)
{
	for (size_t result_idx = 0U; result_idx < ARRAY_SIZE(results);
	     ++result_idx) {
		if (results[result_idx].used &&
		    (results[result_idx].result.key == key)) {
			return &results[result_idx];
		}
	}

	return NULL;
}

static struct spaghetti_discovery_slot *find_free_slot(void)
{
	for (size_t result_idx = 0U; result_idx < ARRAY_SIZE(results);
	     ++result_idx) {
		if (!results[result_idx].used) {
			return &results[result_idx];
		}
	}

	return NULL;
}

int spaghetti_discovery_init(spaghetti_discovery_sink_t sink, void *user_data)
{
	int err;

	if (sink == NULL) {
		return -EINVAL;
	}

	err = k_mutex_lock(&results_lock, K_FOREVER);
	if (err < 0) {
		return err;
	}

	if (is_initialized) {
		k_mutex_unlock(&results_lock);
		return -EALREADY;
	}

	memset(results, 0, sizeof(results));
	event_sink = sink;
	event_sink_user_data = user_data;
	is_initialized = true;
	k_mutex_unlock(&results_lock);

	LOG_INF("ready: capacity=%u", (uint32_t)ARRAY_SIZE(results));
	return 0;
}

int spaghetti_discovery_submit_manual(
	const struct spaghetti_discovery_result *result)
{
	struct spaghetti_discovery_result canonical;
	struct spaghetti_discovery_slot previous = {0};
	struct spaghetti_discovery_slot *slot;
	struct spaghetti_discovery_event event;
	int err = canonicalize_result(result, &canonical);

	if (err < 0) {
		return err;
	}

	err = k_mutex_lock(&results_lock, K_FOREVER);
	if (err < 0) {
		return err;
	}

	if (!is_initialized) {
		err = -EACCES;
		goto unlock;
	}

	slot = find_slot_by_key(canonical.key);
	if (slot != NULL) {
		if (slot->busy) {
			err = -EBUSY;
			goto unlock;
		}
		if (canonical.generation <= slot->result.generation) {
			err = -ESTALE;
			goto unlock;
		}
		previous = *slot;
	} else {
		slot = find_free_slot();
		if (slot == NULL) {
			err = -ENOSPC;
			goto unlock;
		}
	}

	slot->used = true;
	slot->busy = true;
	slot->result = canonical;
	k_mutex_unlock(&results_lock);

	event.type = SPAGHETTI_DISCOVERY_UPSERT;
	event.result = canonical;
	err = event_sink(&event, event_sink_user_data);

	(void)k_mutex_lock(&results_lock, K_FOREVER);
	if (err < 0) {
		*slot = previous;
	} else {
		slot->busy = false;
	}
	k_mutex_unlock(&results_lock);

	if (err < 0) {
		return err;
	}

	LOG_INF("upsert: key=%u port=%u generation=%u", canonical.key,
		(uint32_t)canonical.port_id, canonical.generation);
	return 0;

unlock:
	k_mutex_unlock(&results_lock);
	return err;
}

int spaghetti_discovery_scan_port(spaghetti_port_id_t port_id,
				  k_timeout_t timeout)
{
	int err;

	ARG_UNUSED(timeout);

	if (spaghetti_port_get(port_id) == NULL) {
		return -ENOENT;
	}

	err = k_mutex_lock(&results_lock, K_FOREVER);
	if (err < 0) {
		return err;
	}
	if (!is_initialized) {
		k_mutex_unlock(&results_lock);
		return -EACCES;
	}
	k_mutex_unlock(&results_lock);

	return -ENOTSUP;
}

int spaghetti_discovery_invalidate(spaghetti_module_key_t key,
				   uint32_t expected_generation)
{
	struct spaghetti_discovery_slot *slot;
	struct spaghetti_discovery_event event;
	int err;

	if ((key == 0U) || (expected_generation == 0U)) {
		return -EINVAL;
	}

	err = k_mutex_lock(&results_lock, K_FOREVER);
	if (err < 0) {
		return err;
	}

	if (!is_initialized) {
		err = -EACCES;
		goto unlock;
	}

	slot = find_slot_by_key(key);
	if (slot == NULL) {
		err = -ENOENT;
		goto unlock;
	}
	if (slot->busy) {
		err = -EBUSY;
		goto unlock;
	}
	if (slot->result.generation != expected_generation) {
		err = -ESTALE;
		goto unlock;
	}

	slot->busy = true;
	event.type = SPAGHETTI_DISCOVERY_REMOVE;
	event.result = slot->result;
	k_mutex_unlock(&results_lock);

	err = event_sink(&event, event_sink_user_data);

	(void)k_mutex_lock(&results_lock, K_FOREVER);
	if (err < 0) {
		slot->busy = false;
	} else {
		memset(slot, 0, sizeof(*slot));
	}
	k_mutex_unlock(&results_lock);

	if (err < 0) {
		return err;
	}

	LOG_INF("remove: key=%u generation=%u", key, expected_generation);
	return 0;

unlock:
	k_mutex_unlock(&results_lock);
	return err;
}
