#include <spaghetti/module_manager.h>

#include <errno.h>
#include <stdbool.h>
#include <string.h>

#include <zephyr/kernel.h>
#include <zephyr/logging/log.h>
#include <zephyr/sys/util.h>

#include <spaghetti/driver_registry.h>
#include <spaghetti/module_driver.h>

LOG_MODULE_REGISTER(spaghetti_module_manager,
		    CONFIG_SPAGHETTI_MODULE_MANAGER_LOG_LEVEL);

struct spaghetti_module_slot {
	bool used;
	bool reserved;
	bool busy;
	spaghetti_port_id_t port_id;
	uint32_t revision;
	struct spaghetti_module module;
};

static struct spaghetti_module_slot slots[CONFIG_SPAGHETTI_MAX_MODULES];
static bool is_initialized;
K_MUTEX_DEFINE(slots_lock);

BUILD_ASSERT(CONFIG_SPAGHETTI_MAX_MODULES <= (UINT8_MAX + 1U));

static bool endpoint_is_valid(const struct spaghetti_module_endpoint *endpoint)
{
	switch (endpoint->kind) {
	case SPAGHETTI_ENDPOINT_PORT_EXCLUSIVE:
		return endpoint->value == 0U;
	case SPAGHETTI_ENDPOINT_I2C_ADDRESS:
		return endpoint->value <= 0x7FU;
	case SPAGHETTI_ENDPOINT_SPI_CHIP_SELECT:
		return true;
	default:
		return false;
	}
}

static bool endpoints_conflict(
	const struct spaghetti_module_endpoint *first,
	const struct spaghetti_module_endpoint *second)
{
	if ((first->kind == SPAGHETTI_ENDPOINT_PORT_EXCLUSIVE) ||
	    (second->kind == SPAGHETTI_ENDPOINT_PORT_EXCLUSIVE)) {
		return true;
	}

	return (first->kind == second->kind) && (first->value == second->value);
}

static struct spaghetti_module_slot *find_slot_by_id(spaghetti_module_id_t id)
{
	const size_t slot_idx = (size_t)id;

	if ((slot_idx >= ARRAY_SIZE(slots)) || !slots[slot_idx].used) {
		return NULL;
	}

	return &slots[slot_idx];
}

static void copy_snapshot(const struct spaghetti_module_slot *slot,
			  struct spaghetti_module_snapshot *out)
{
	struct spaghetti_module_snapshot snapshot = {
		.id = slot->module.id,
		.key = slot->module.key,
		.port_id = slot->port_id,
		.endpoint = slot->module.endpoint,
		.state = slot->module.state,
		.revision = slot->revision,
	};
	size_t type_id_len = 0U;

	while ((type_id_len < (SPAGHETTI_TYPE_ID_MAX - 1U)) &&
	       (slot->module.driver->type_id[type_id_len] != '\0')) {
		++type_id_len;
	}

	memcpy(snapshot.type_id, slot->module.driver->type_id, type_id_len);
	snapshot.type_id[type_id_len] = '\0';
	*out = snapshot;
}

int spaghetti_module_manager_init(void)
{
	int err = k_mutex_lock(&slots_lock, K_FOREVER);

	if (err < 0) {
		return err;
	}

	if (is_initialized) {
		k_mutex_unlock(&slots_lock);
		return -EALREADY;
	}

	memset(slots, 0, sizeof(slots));
	is_initialized = true;
	k_mutex_unlock(&slots_lock);

	LOG_INF("ready: capacity=%u", (uint32_t)ARRAY_SIZE(slots));
	return 0;
}

int spaghetti_module_manager_configure(
	const struct spaghetti_module_request *request,
	spaghetti_module_id_t *out_id)
{
	struct spaghetti_module_endpoint endpoint;
	const struct spaghetti_module_driver *driver;
	const struct spaghetti_port *port;
	struct spaghetti_module_slot *slot = NULL;
	int err;

	if ((request == NULL) || (out_id == NULL) || (request->key == 0U) ||
	    (request->revision == 0U) || (request->type_id == NULL) ||
	    ((request->driver_config == NULL) != (request->driver_config_size == 0U))) {
		return -EINVAL;
	}

	port = spaghetti_port_get(request->port_id);
	if (port == NULL) {
		return -ENOENT;
	}

	driver = spaghetti_driver_registry_find(request->type_id);
	if (driver == NULL) {
		return -ENOENT;
	}

	if (!spaghetti_port_has_capability(port, driver->required_capabilities)) {
		return -ENOTSUP;
	}

	if ((driver->ops == NULL) || (driver->ops->validate_config == NULL) ||
	    (driver->ops->describe_endpoint == NULL) || (driver->ops->init == NULL)) {
		return -ENOTSUP;
	}

	err = driver->ops->validate_config(request->driver_config,
					  request->driver_config_size);
	if (err < 0) {
		return err;
	}

	err = driver->ops->describe_endpoint(request->driver_config,
					    request->driver_config_size, &endpoint);
	if (err < 0) {
		return err;
	}

	if (!endpoint_is_valid(&endpoint)) {
		return -EINVAL;
	}

	err = k_mutex_lock(&slots_lock, K_FOREVER);
	if (err < 0) {
		return err;
	}

	for (size_t slot_idx = 0U; slot_idx < ARRAY_SIZE(slots); ++slot_idx) {
		struct spaghetti_module_slot *candidate = &slots[slot_idx];

		if (!candidate->used && !candidate->reserved) {
			if (slot == NULL) {
				slot = candidate;
			}
			continue;
		}

		if (candidate->module.key == request->key) {
			err = candidate->reserved ? -EBUSY : -EEXIST;
			goto unlock;
		}

		if ((candidate->port_id == request->port_id) &&
		    endpoints_conflict(&candidate->module.endpoint, &endpoint)) {
			err = candidate->reserved ? -EBUSY : -EADDRINUSE;
			goto unlock;
		}
	}

	if (slot == NULL) {
		err = -ENOSPC;
		goto unlock;
	}

	const spaghetti_module_id_t module_id =
		(spaghetti_module_id_t)(slot - slots);

	memset(slot, 0, sizeof(*slot));
	slot->reserved = true;
	slot->port_id = request->port_id;
	slot->revision = request->revision;
	slot->module.id = module_id;
	slot->module.key = request->key;
	slot->module.state = SPAGHETTI_MODULE_UNINITIALIZED;
	slot->module.port = port;
	slot->module.driver = driver;
	slot->module.endpoint = endpoint;
	k_mutex_unlock(&slots_lock);

	err = driver->ops->init(&slot->module, request->driver_config,
				request->driver_config_size);

	(void)k_mutex_lock(&slots_lock, K_FOREVER);
	if (err < 0) {
		memset(slot, 0, sizeof(*slot));
		k_mutex_unlock(&slots_lock);
		return err;
	}

	slot->module.state = SPAGHETTI_MODULE_READY;
	slot->used = true;
	slot->reserved = false;
	*out_id = slot->module.id;
	k_mutex_unlock(&slots_lock);

	LOG_INF("configured: key=%u id=%u port=%u endpoint=%u", request->key,
		(uint32_t)*out_id, (uint32_t)request->port_id, endpoint.value);
	return 0;

unlock:
	k_mutex_unlock(&slots_lock);
	return err;
}

int spaghetti_module_manager_remove(spaghetti_module_id_t id,
				    uint32_t expected_revision)
{
	struct spaghetti_module_slot *slot;
	spaghetti_module_key_t key;
	int err;

	if (expected_revision == 0U) {
		return -EINVAL;
	}

	err = k_mutex_lock(&slots_lock, K_FOREVER);
	if (err < 0) {
		return err;
	}

	slot = find_slot_by_id(id);
	if (slot == NULL) {
		err = -ENOENT;
		goto unlock;
	}

	if (slot->revision != expected_revision) {
		err = -ESTALE;
		goto unlock;
	}

	if (slot->busy) {
		err = -EBUSY;
		goto unlock;
	}

	slot->busy = true;
	key = slot->module.key;
	k_mutex_unlock(&slots_lock);

	err = slot->module.driver->ops->deinit(&slot->module);

	(void)k_mutex_lock(&slots_lock, K_FOREVER);
	memset(slot, 0, sizeof(*slot));
	k_mutex_unlock(&slots_lock);

	LOG_INF("removed: key=%u id=%u err=%d", key, (uint32_t)id, err);
	return err;

unlock:
	k_mutex_unlock(&slots_lock);
	return err;
}

int spaghetti_module_manager_get_by_id(
	spaghetti_module_id_t id,
	struct spaghetti_module_snapshot *out)
{
	struct spaghetti_module_slot *slot;
	int err;

	if (out == NULL) {
		return -EINVAL;
	}

	err = k_mutex_lock(&slots_lock, K_FOREVER);
	if (err < 0) {
		return err;
	}

	slot = find_slot_by_id(id);
	if (slot == NULL) {
		k_mutex_unlock(&slots_lock);
		return -ENOENT;
	}

	copy_snapshot(slot, out);
	k_mutex_unlock(&slots_lock);
	return 0;
}

int spaghetti_module_manager_get_by_key(
	spaghetti_module_key_t key,
	struct spaghetti_module_snapshot *out)
{
	int err;

	if ((key == 0U) || (out == NULL)) {
		return -EINVAL;
	}

	err = k_mutex_lock(&slots_lock, K_FOREVER);
	if (err < 0) {
		return err;
	}

	for (size_t slot_idx = 0U; slot_idx < ARRAY_SIZE(slots); ++slot_idx) {
		if (slots[slot_idx].used && (slots[slot_idx].module.key == key)) {
			copy_snapshot(&slots[slot_idx], out);
			k_mutex_unlock(&slots_lock);
			return 0;
		}
	}

	k_mutex_unlock(&slots_lock);
	return -ENOENT;
}

int spaghetti_module_manager_list_by_port(
	spaghetti_port_id_t port_id,
	struct spaghetti_module_snapshot *out,
	size_t capacity,
	size_t *out_count)
{
	size_t module_count = 0U;
	int err;

	if ((out_count == NULL) || ((out == NULL) != (capacity == 0U))) {
		return -EINVAL;
	}

	if (spaghetti_port_get(port_id) == NULL) {
		return -ENOENT;
	}

	err = k_mutex_lock(&slots_lock, K_FOREVER);
	if (err < 0) {
		return err;
	}

	for (size_t slot_idx = 0U; slot_idx < ARRAY_SIZE(slots); ++slot_idx) {
		if (slots[slot_idx].used && (slots[slot_idx].port_id == port_id)) {
			++module_count;
		}
	}

	if (out == NULL) {
		*out_count = module_count;
		k_mutex_unlock(&slots_lock);
		return 0;
	}

	if (capacity < module_count) {
		*out_count = module_count;
		k_mutex_unlock(&slots_lock);
		return -ENOSPC;
	}

	size_t output_idx = 0U;

	for (size_t slot_idx = 0U; slot_idx < ARRAY_SIZE(slots); ++slot_idx) {
		if (slots[slot_idx].used && (slots[slot_idx].port_id == port_id)) {
			copy_snapshot(&slots[slot_idx], &out[output_idx]);
			++output_idx;
		}
	}

	*out_count = module_count;
	k_mutex_unlock(&slots_lock);
	return 0;
}

int spaghetti_module_manager_read(
	spaghetti_module_id_t id,
	struct spaghetti_sample *out)
{
	struct spaghetti_module_slot *slot;
	struct spaghetti_sample sample;
	int err;

	if (out == NULL) {
		return -EINVAL;
	}

	err = k_mutex_lock(&slots_lock, K_FOREVER);
	if (err < 0) {
		return err;
	}

	slot = find_slot_by_id(id);
	if (slot == NULL) {
		err = -ENOENT;
		goto unlock;
	}

	if (slot->busy) {
		err = -EBUSY;
		goto unlock;
	}

	if ((slot->module.state != SPAGHETTI_MODULE_READY) ||
	    (slot->module.driver->ops->read == NULL)) {
		err = -ENOTSUP;
		goto unlock;
	}

	slot->busy = true;
	k_mutex_unlock(&slots_lock);

	err = slot->module.driver->ops->read(&slot->module, &sample);

	(void)k_mutex_lock(&slots_lock, K_FOREVER);
	slot->busy = false;
	if (err == 0) {
		*out = sample;
	}
	k_mutex_unlock(&slots_lock);
	return err;

unlock:
	k_mutex_unlock(&slots_lock);
	return err;
}
