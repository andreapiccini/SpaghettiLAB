#include <spaghetti/config.h>

#include <errno.h>
#include <stdbool.h>
#include <string.h>

#include <zephyr/kernel.h>
#include <zephyr/logging/log.h>
#include <zephyr/sys/util.h>

#include <spaghetti/driver_registry.h>
#include <spaghetti/module_driver.h>
#include <spaghetti/module_manager.h>

LOG_MODULE_REGISTER(spaghetti_config, CONFIG_SPAGHETTI_CONFIG_LOG_LEVEL);

#define SPAGHETTI_CONFIG_MODULE_REVISION 1U

struct spaghetti_config_transaction {
	bool old_removed[SPAGHETTI_CONFIG_MAX_MODULES];
	bool candidate_added[SPAGHETTI_CONFIG_MAX_MODULES];
	struct spaghetti_module_snapshot old_live[SPAGHETTI_CONFIG_MAX_MODULES];
	struct spaghetti_module_snapshot candidate_live[SPAGHETTI_CONFIG_MAX_MODULES];
};

static struct spaghetti_config current_config;
static bool has_current_config;
K_MUTEX_DEFINE(config_lock);

BUILD_ASSERT(SPAGHETTI_CONFIG_MAX_MODULES <= CONFIG_SPAGHETTI_MAX_MODULES);
BUILD_ASSERT(SPAGHETTI_CONFIG_TYPE_ID_SIZE == SPAGHETTI_TYPE_ID_MAX);

static bool type_id_is_valid(const char *type_id)
{
	if (type_id[0] == '\0') {
		return false;
	}

	return memchr(type_id, '\0', SPAGHETTI_CONFIG_TYPE_ID_SIZE) != NULL;
}

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

static int describe_module(
	const struct spaghetti_module_config *module_config,
	struct spaghetti_module_endpoint *out_endpoint)
{
	const struct spaghetti_module_driver *driver;
	const struct spaghetti_port *port;
	int err;

	if ((module_config->key == 0U) ||
	    !type_id_is_valid(module_config->type_id) ||
	    (module_config->driver_config_size == 0U) ||
	    (module_config->driver_config_size > SPAGHETTI_DRIVER_CONFIG_MAX)) {
		return -EINVAL;
	}
	port = spaghetti_port_get(module_config->port_id);
	if (port == NULL) {
		return -ENOENT;
	}

	driver = spaghetti_driver_registry_find(module_config->type_id);
	if ((driver == NULL) || (driver->ops == NULL) ||
	    (driver->ops->validate_config == NULL) ||
	    (driver->ops->describe_endpoint == NULL) ||
	    (driver->ops->init == NULL) || (driver->ops->deinit == NULL)) {
		return -ENOTSUP;
	}
	if (!spaghetti_port_has_capability(port,
					   driver->required_capabilities)) {
		return -ENOTSUP;
	}

	err = driver->ops->validate_config(module_config->driver_config,
					  module_config->driver_config_size);
	if (err < 0) {
		return err;
	}

	err = driver->ops->describe_endpoint(module_config->driver_config,
					    module_config->driver_config_size,
					    out_endpoint);
	if (err < 0) {
		return err;
	}

	if (!endpoint_is_valid(out_endpoint)) {
		return -EINVAL;
	}

	return 0;
}

static int find_module_index(const struct spaghetti_config *config,
			     spaghetti_module_key_t key)
{
	for (size_t module_idx = 0U; module_idx < config->module_count;
	     ++module_idx) {
		if (config->modules[module_idx].key == key) {
			return (int)module_idx;
		}
	}

	return -1;
}

static bool module_configs_are_equal(
	const struct spaghetti_module_config *first,
	const struct spaghetti_module_config *second)
{
	return (first->port_id == second->port_id) &&
	       (strcmp(first->type_id, second->type_id) == 0) &&
	       (first->driver_config_size == second->driver_config_size) &&
	       (memcmp(first->driver_config, second->driver_config,
		       first->driver_config_size) == 0);
}

static int configure_module(
	const struct spaghetti_module_config *module_config,
	struct spaghetti_module_snapshot *out)
{
	const struct spaghetti_module_request request = {
		.key = module_config->key,
		.port_id = module_config->port_id,
		.type_id = module_config->type_id,
		.driver_config = module_config->driver_config,
		.driver_config_size = module_config->driver_config_size,
		.revision = SPAGHETTI_CONFIG_MODULE_REVISION,
	};
	spaghetti_module_id_t id;
	int err = spaghetti_module_manager_configure(&request, &id);

	if (err < 0) {
		return err;
	}

	err = spaghetti_module_manager_get_by_id(id, out);
	if (err < 0) {
		(void)spaghetti_module_manager_remove(
			id, SPAGHETTI_CONFIG_MODULE_REVISION);
	}

	return err;
}

static int remove_module(const struct spaghetti_module_snapshot *module)
{
	return spaghetti_module_manager_remove(module->id, module->revision);
}

static bool module_is_absent(spaghetti_module_key_t key)
{
	struct spaghetti_module_snapshot ignored;

	return spaghetti_module_manager_get_by_key(key, &ignored) == -ENOENT;
}

static int rollback_transaction(
	const struct spaghetti_config *old_config,
	struct spaghetti_config_transaction *transaction)
{
	int first_error = 0;

	for (size_t candidate_idx = SPAGHETTI_CONFIG_MAX_MODULES;
	     candidate_idx > 0U; --candidate_idx) {
		const size_t index = candidate_idx - 1U;

		if (!transaction->candidate_added[index]) {
			continue;
		}

		const int err = remove_module(&transaction->candidate_live[index]);

		if ((err < 0) && (first_error == 0)) {
			first_error = err;
		}
	}

	for (size_t old_idx = 0U; old_idx < old_config->module_count; ++old_idx) {
		struct spaghetti_module_snapshot restored;

		if (!transaction->old_removed[old_idx]) {
			continue;
		}

		const int err = configure_module(&old_config->modules[old_idx],
						 &restored);

		if ((err < 0) && (first_error == 0)) {
			first_error = err;
		}
	}

	return first_error;
}

int spaghetti_config_validate(const struct spaghetti_config *candidate)
{
	struct spaghetti_module_endpoint
		endpoints[SPAGHETTI_CONFIG_MAX_MODULES];

	if ((candidate == NULL) ||
	    (candidate->version != SPAGHETTI_CONFIG_VERSION) ||
	    (candidate->module_count > SPAGHETTI_CONFIG_MAX_MODULES)) {
		return -EINVAL;
	}

	for (size_t module_idx = 0U; module_idx < candidate->module_count;
	     ++module_idx) {
		int err = describe_module(&candidate->modules[module_idx],
					  &endpoints[module_idx]);

		if (err < 0) {
			return err;
		}

		for (size_t previous_idx = 0U; previous_idx < module_idx;
		     ++previous_idx) {
			if (candidate->modules[previous_idx].key ==
			    candidate->modules[module_idx].key) {
				return -EEXIST;
			}

			if ((candidate->modules[previous_idx].port_id ==
			     candidate->modules[module_idx].port_id) &&
			    endpoints_conflict(&endpoints[previous_idx],
					       &endpoints[module_idx])) {
				return -EADDRINUSE;
			}
		}
	}

	if (candidate->sampling.enabled) {
		if ((candidate->sampling.source_key == 0U) ||
		    (candidate->sampling.period_ms == 0U) ||
		    (find_module_index(candidate,
				       candidate->sampling.source_key) < 0)) {
			return -EINVAL;
		}
	}

	return 0;
}

int spaghetti_config_apply(const struct spaghetti_config *candidate)
{
	struct spaghetti_config_transaction transaction = {0};
	struct spaghetti_config old_config = {0};
	bool had_old_config;
	int apply_error = 0;
	int err;

	err = spaghetti_config_validate(candidate);
	if (err < 0) {
		return err;
	}

	err = k_mutex_lock(&config_lock, K_FOREVER);
	if (err < 0) {
		return err;
	}

	had_old_config = has_current_config;
	if (had_old_config) {
		old_config = current_config;
	}

	for (size_t old_idx = 0U; old_idx < old_config.module_count; ++old_idx) {
		err = spaghetti_module_manager_get_by_key(
			old_config.modules[old_idx].key,
			&transaction.old_live[old_idx]);
		if (err < 0) {
			apply_error = err;
			goto rollback;
		}
	}

	for (size_t old_idx = 0U; old_idx < old_config.module_count; ++old_idx) {
		const int candidate_idx = find_module_index(
			candidate, old_config.modules[old_idx].key);
		const bool unchanged =
			(candidate_idx >= 0) &&
			module_configs_are_equal(
				&old_config.modules[old_idx],
				&candidate->modules[candidate_idx]);

		if (unchanged) {
			continue;
		}

		err = remove_module(&transaction.old_live[old_idx]);
		if ((err == 0) ||
		    module_is_absent(old_config.modules[old_idx].key)) {
			transaction.old_removed[old_idx] = true;
		}
		if (err < 0) {
			apply_error = err;
			goto rollback;
		}
	}

	for (size_t candidate_idx = 0U;
	     candidate_idx < candidate->module_count; ++candidate_idx) {
		const int old_idx = find_module_index(
			&old_config, candidate->modules[candidate_idx].key);
		const bool unchanged =
			(old_idx >= 0) &&
			module_configs_are_equal(
				&old_config.modules[old_idx],
				&candidate->modules[candidate_idx]);

		if (unchanged) {
			continue;
		}

		err = configure_module(&candidate->modules[candidate_idx],
				       &transaction.candidate_live[candidate_idx]);
		if (err < 0) {
			apply_error = err;
			goto rollback;
		}
		transaction.candidate_added[candidate_idx] = true;
	}

	if (candidate->sampling.enabled) {
		struct spaghetti_module_snapshot source;

		err = spaghetti_module_manager_get_by_key(
			candidate->sampling.source_key, &source);
		if (err < 0) {
			apply_error = err;
			goto rollback;
		}
	}

	current_config = *candidate;
	has_current_config = true;
	k_mutex_unlock(&config_lock);

	LOG_INF("applied: modules=%u sampling=%u", (uint32_t)candidate->module_count,
		candidate->sampling.enabled ? 1U : 0U);
	return 0;

rollback:
	err = rollback_transaction(&old_config, &transaction);
	k_mutex_unlock(&config_lock);
	if (err < 0) {
		LOG_ERR("apply failed: err=%d rollback=%d", apply_error, err);
		return err;
	}

	LOG_WRN("apply rejected and previous state restored: err=%d", apply_error);
	return apply_error;
}

int spaghetti_config_get_snapshot(struct spaghetti_config *out)
{
	int err;

	if (out == NULL) {
		return -EINVAL;
	}

	err = k_mutex_lock(&config_lock, K_FOREVER);
	if (err < 0) {
		return err;
	}

	if (!has_current_config) {
		k_mutex_unlock(&config_lock);
		return -ENOENT;
	}

	*out = current_config;
	k_mutex_unlock(&config_lock);
	return 0;
}
