#include <spaghetti/power.h>

#include <errno.h>
#include <stdbool.h>
#include <string.h>

#include <zephyr/kernel.h>
#include <zephyr/logging/log.h>
#include <zephyr/sys/atomic.h>
#include <zephyr/sys/util.h>

#include "power_internal.h"

LOG_MODULE_REGISTER(spaghetti_power, CONFIG_SPAGHETTI_POWER_LOG_LEVEL);

#define SPAGHETTI_POWER_MAX_OWNERS 8U
#define SPAGHETTI_POWER_STORAGE_CAPACITY 1U

struct spaghetti_power_resource {
	spaghetti_power_resource_id_t id;
	enum spaghetti_power_state state;
	spaghetti_power_owner_id_t owners[SPAGHETTI_POWER_MAX_OWNERS];
	uint16_t reference_count;
	int last_error;
	struct k_mutex lock;
};

static struct spaghetti_power_resource resources[SPAGHETTI_POWER_STORAGE_CAPACITY] = {
	{
		.id = 0U,
	},
};
static atomic_t is_initialized;
K_MUTEX_DEFINE(init_lock);

static size_t resource_count(void)
{
#if defined(CONFIG_SPAGHETTI_POWER_FAKE_BACKEND)
	return 1U;
#else
	return 0U;
#endif
}

static int set_resource_enabled(spaghetti_power_resource_id_t id, bool enabled)
{
#if defined(CONFIG_SPAGHETTI_POWER_FAKE_BACKEND)
	return spaghetti_power_backend_set(id, enabled);
#else
	ARG_UNUSED(id);
	ARG_UNUSED(enabled);
	return -ENOTSUP;
#endif
}

static struct spaghetti_power_resource *find_resource(
	spaghetti_power_resource_id_t id)
{
	for (size_t resource_idx = 0U; resource_idx < resource_count();
	     ++resource_idx) {
		if (resources[resource_idx].id == id) {
			return &resources[resource_idx];
		}
	}

	return NULL;
}

static int find_owner(const struct spaghetti_power_resource *resource,
		      spaghetti_power_owner_id_t owner)
{
	for (size_t owner_idx = 0U; owner_idx < resource->reference_count;
	     ++owner_idx) {
		if (resource->owners[owner_idx] == owner) {
			return (int)owner_idx;
		}
	}

	return -1;
}

int spaghetti_power_init(void)
{
	int err = k_mutex_lock(&init_lock, K_FOREVER);

	if (err < 0) {
		return err;
	}
	if (atomic_get(&is_initialized) != 0) {
		k_mutex_unlock(&init_lock);
		return -EALREADY;
	}

	for (size_t resource_idx = 0U; resource_idx < resource_count();
	     ++resource_idx) {
		struct spaghetti_power_resource *resource = &resources[resource_idx];

		k_mutex_init(&resource->lock);
		memset(resource->owners, SPAGHETTI_POWER_OWNER_INVALID,
		       sizeof(resource->owners));
		resource->reference_count = 0U;
		resource->last_error = 0;
		resource->state = SPAGHETTI_POWER_STOPPING;

		err = set_resource_enabled(resource->id, false);
		if (err < 0) {
			resource->state = SPAGHETTI_POWER_ERROR;
			resource->last_error = err;
			k_mutex_unlock(&init_lock);
			return err;
		}

		resource->state = SPAGHETTI_POWER_OFF;
	}

	atomic_set(&is_initialized, 1);
	k_mutex_unlock(&init_lock);
	LOG_INF("ready: resources=%u", (uint32_t)resource_count());
	return 0;
}

int spaghetti_power_acquire(spaghetti_power_resource_id_t id,
			    spaghetti_power_owner_id_t owner)
{
	struct spaghetti_power_resource *resource;
	int err;

	if (owner == SPAGHETTI_POWER_OWNER_INVALID) {
		return -EINVAL;
	}
	if (atomic_get(&is_initialized) == 0) {
		return -EACCES;
	}

	resource = find_resource(id);
	if (resource == NULL) {
		return -ENOENT;
	}

	err = k_mutex_lock(&resource->lock, K_FOREVER);
	if (err < 0) {
		return err;
	}
	if (find_owner(resource, owner) >= 0) {
		err = -EALREADY;
		goto unlock;
	}
	if (resource->reference_count >= ARRAY_SIZE(resource->owners)) {
		err = -ENOSPC;
		goto unlock;
	}
	if ((resource->state == SPAGHETTI_POWER_STARTING) ||
	    (resource->state == SPAGHETTI_POWER_STOPPING) ||
	    ((resource->state == SPAGHETTI_POWER_ERROR) &&
	     (resource->reference_count > 0U))) {
		err = (resource->last_error < 0) ? resource->last_error : -EBUSY;
		goto unlock;
	}

	if (resource->reference_count == 0U) {
		resource->state = SPAGHETTI_POWER_STARTING;
		err = set_resource_enabled(resource->id, true);
		if (err < 0) {
			resource->state = SPAGHETTI_POWER_ERROR;
			resource->last_error = err;
			goto unlock;
		}
		resource->state = SPAGHETTI_POWER_ON;
		resource->last_error = 0;
	}

	resource->owners[resource->reference_count] = owner;
	++resource->reference_count;
	err = 0;

unlock:
	k_mutex_unlock(&resource->lock);
	return err;
}

int spaghetti_power_release(spaghetti_power_resource_id_t id,
			    spaghetti_power_owner_id_t owner)
{
	struct spaghetti_power_resource *resource;
	int owner_idx;
	int err;

	if (owner == SPAGHETTI_POWER_OWNER_INVALID) {
		return -EINVAL;
	}
	if (atomic_get(&is_initialized) == 0) {
		return -EACCES;
	}

	resource = find_resource(id);
	if (resource == NULL) {
		return -ENOENT;
	}

	err = k_mutex_lock(&resource->lock, K_FOREVER);
	if (err < 0) {
		return err;
	}
	if (resource->reference_count == 0U) {
		err = -EALREADY;
		goto unlock;
	}

	owner_idx = find_owner(resource, owner);
	if (owner_idx < 0) {
		err = -ENOENT;
		goto unlock;
	}

	if (resource->reference_count == 1U) {
		resource->state = SPAGHETTI_POWER_STOPPING;
		err = set_resource_enabled(resource->id, false);
		if (err < 0) {
			resource->state = SPAGHETTI_POWER_ERROR;
			resource->last_error = err;
			goto unlock;
		}
		resource->state = SPAGHETTI_POWER_OFF;
		resource->last_error = 0;
	}

	--resource->reference_count;
	resource->owners[owner_idx] =
		resource->owners[resource->reference_count];
	resource->owners[resource->reference_count] =
		SPAGHETTI_POWER_OWNER_INVALID;
	err = 0;

unlock:
	k_mutex_unlock(&resource->lock);
	return err;
}

int spaghetti_power_get_status(spaghetti_power_resource_id_t id,
			       struct spaghetti_power_status *out)
{
	struct spaghetti_power_resource *resource;
	struct spaghetti_power_status status;
	int err;

	if (out == NULL) {
		return -EINVAL;
	}
	if (atomic_get(&is_initialized) == 0) {
		return -EACCES;
	}

	resource = find_resource(id);
	if (resource == NULL) {
		return -ENOENT;
	}

	err = k_mutex_lock(&resource->lock, K_FOREVER);
	if (err < 0) {
		return err;
	}
	status.state = resource->state;
	status.reference_count = resource->reference_count;
	status.last_error = resource->last_error;
	*out = status;
	k_mutex_unlock(&resource->lock);
	return 0;
}
