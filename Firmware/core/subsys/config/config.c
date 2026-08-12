#include <spaghetti/config.h>

#include <errno.h>
#include <stdbool.h>
#include <string.h>

#include <zephyr/kernel.h>
#include <zephyr/logging/log.h>
#include <zephyr/sys/util.h>

#include <spaghetti/driver_registry.h>
#include <spaghetti/discovery.h>
#include <spaghetti/module_driver.h>
#include <spaghetti/module_manager.h>
#include <spaghetti/mqtt.h>
#include <spaghetti/runtime.h>
#include <spaghetti/schema.h>
#include <spaghetti/service.h>
#include <spaghetti/storage.h>

#include "legacy_driver_config.h"

LOG_MODULE_REGISTER(spaghetti_config, CONFIG_SPAGHETTI_CONFIG_LOG_LEVEL);

struct spaghetti_config_transaction {
	bool old_removed[SPAGHETTI_CONFIG_MAX_MODULES];
	bool candidate_added[SPAGHETTI_CONFIG_MAX_MODULES];
	struct spaghetti_module_snapshot old_live[SPAGHETTI_CONFIG_MAX_MODULES];
	struct spaghetti_module_snapshot candidate_live[SPAGHETTI_CONFIG_MAX_MODULES];
};

static struct spaghetti_config current_config;
static uint32_t current_generation;
static bool is_initialized;
K_MUTEX_DEFINE(config_lock);

BUILD_ASSERT(SPAGHETTI_CONFIG_MAX_MODULES <= CONFIG_SPAGHETTI_MAX_MODULES);
BUILD_ASSERT(SPAGHETTI_CONFIG_TYPE_ID_SIZE == SPAGHETTI_TYPE_ID_MAX);

static bool module_is_absent(spaghetti_module_key_t key);

static bool type_id_is_valid(const char *type_id)
{
	if (type_id[0] == '\0') {
		return false;
	}

	return memchr(type_id, '\0', SPAGHETTI_CONFIG_TYPE_ID_SIZE) != NULL;
}

static bool mqtt_config_is_valid(const struct spaghetti_mqtt_config *mqtt)
{
	const char *host_end = memchr(mqtt->host, '\0', sizeof(mqtt->host));
	const char *topic_end = memchr(mqtt->base_topic, '\0',
				       sizeof(mqtt->base_topic));

	if (!mqtt->enabled) {
		return (mqtt->host[0] == '\0') && (mqtt->port == 0U) &&
		       (mqtt->base_topic[0] == '\0');
	}
	if ((host_end == NULL) || (host_end == mqtt->host) ||
	    (topic_end == NULL) || (topic_end == mqtt->base_topic) ||
	    (mqtt->port == 0U)) {
		return false;
	}

	return (mqtt->base_topic[0] != '/') &&
	       (topic_end[-1] != '/');
}

static bool endpoint_is_valid(const struct spaghetti_module_endpoint *endpoint)
{
	switch (endpoint->kind) {
	case SPAGHETTI_ENDPOINT_PORT_EXCLUSIVE:
	case SPAGHETTI_ENDPOINT_UART_EXCLUSIVE:
		return endpoint->value_size == 0U;
	case SPAGHETTI_ENDPOINT_I2C_ADDRESS:
		return (endpoint->value_size == 1U) &&
		       (endpoint->value[0] <= 0x7FU);
	case SPAGHETTI_ENDPOINT_SPI_CHIP_SELECT:
		return (endpoint->value_size == 1U) &&
		       (endpoint->value[0] <= 4U);
	case SPAGHETTI_ENDPOINT_GPIO_LINE:
	case SPAGHETTI_ENDPOINT_ADC_CHANNEL:
		return (endpoint->value_size == 1U) &&
		       (endpoint->value[0] <= 4U);
	case SPAGHETTI_ENDPOINT_W1_ROM:
		return endpoint->value_size == SPAGHETTI_ENDPOINT_VALUE_MAX;
	default:
		return false;
	}
}

static bool endpoints_conflict(
	const struct spaghetti_module_endpoint *first,
	const struct spaghetti_module_endpoint *second)
{
	if ((first->kind == SPAGHETTI_ENDPOINT_PORT_EXCLUSIVE) ||
	    (second->kind == SPAGHETTI_ENDPOINT_PORT_EXCLUSIVE) ||
	    (first->kind == SPAGHETTI_ENDPOINT_UART_EXCLUSIVE) ||
	    (second->kind == SPAGHETTI_ENDPOINT_UART_EXCLUSIVE)) {
		return true;
	}

	return (first->kind == second->kind) &&
	       (first->value_size == second->value_size) &&
	       (memcmp(first->value, second->value, first->value_size) == 0);
}

static int describe_module(
	const struct spaghetti_module_config *module_config,
	struct spaghetti_module_endpoint *out_endpoint)
{
	const struct spaghetti_module_driver *driver;
	const struct spaghetti_port *port;
	struct spaghetti_property_set properties;
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
	    (driver->ops->init == NULL) ||
	    ((driver->ops->read == NULL) &&
	     (driver->ops->command == NULL) &&
	     (driver->ops->start == NULL)) ||
	    (driver->ops->deinit == NULL)) {
		return -ENOTSUP;
	}
	if (!spaghetti_port_has_capability(port,
					   driver->required_capabilities)) {
		return -ENOTSUP;
	}

	err = spaghetti_legacy_driver_config_bytes_to_properties(
		module_config->type_id, module_config->driver_config,
		module_config->driver_config_size, &properties);
	if (err < 0) {
		return err;
	}

	err = driver->ops->validate_config(&properties);
	if (err < 0) {
		return err;
	}

	err = driver->ops->describe_endpoint(&properties, out_endpoint);
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

static bool module_supports_read(const struct spaghetti_config *config,
				 spaghetti_module_key_t key)
{
	const int module_idx = find_module_index(config, key);

	if (module_idx < 0) {
		return false;
	}

	const struct spaghetti_module_driver *driver =
		spaghetti_driver_registry_find(config->modules[module_idx].type_id);

	return (driver != NULL) && (driver->ops != NULL) &&
	       (driver->ops->read != NULL);
}

static bool module_supports_command(const struct spaghetti_config *config,
				    spaghetti_module_key_t key)
{
	const int module_idx = find_module_index(config, key);

	if (module_idx < 0) {
		return false;
	}

	const struct spaghetti_module_driver *driver =
		spaghetti_driver_registry_find(config->modules[module_idx].type_id);

	return (driver != NULL) && (driver->ops != NULL) &&
	       (driver->ops->command != NULL);
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
	uint32_t revision,
	struct spaghetti_module_snapshot *out)
{
	struct spaghetti_discovery_result result = {
		.key = module_config->key,
		.port_id = module_config->port_id,
		.driver_config_size = module_config->driver_config_size,
		.source = SPAGHETTI_DISCOVERY_SOURCE_CONFIG,
		.generation = revision,
	};
	int err;

	memcpy(result.type_id, module_config->type_id,
	       strlen(module_config->type_id) + 1U);
	memcpy(result.driver_config, module_config->driver_config,
	       module_config->driver_config_size);
	err = spaghetti_discovery_submit_manual(&result);

	if (err < 0) {
		return err;
	}

	err = spaghetti_module_manager_get_by_key(module_config->key, out);
	if (err < 0) {
		(void)spaghetti_discovery_invalidate(module_config->key,
						     revision);
	}

	return err;
}

static int remove_module(const struct spaghetti_module_snapshot *module)
{
	int err = spaghetti_discovery_invalidate(module->key, module->revision);

	if ((err < 0) && module_is_absent(module->key)) {
		const int cleanup_error = spaghetti_discovery_invalidate(
			module->key, module->revision);

		if ((cleanup_error < 0) && (cleanup_error != -ENOENT)) {
			return -EIO;
		}
	}

	return err;
}

static int load_runtime(const struct spaghetti_config *config)
{
	struct spaghetti_runtime_sampling_task task = {0};
	struct spaghetti_module_snapshot source;
	struct spaghetti_module_snapshot relay;
	int err;

	if (config->sampling.enabled) {
		err = spaghetti_module_manager_get_by_key(
			config->sampling.source_key, &source);
		if (err < 0) {
			return err;
		}

		task.module_id = source.id;
		task.period_ms = config->sampling.period_ms;
		task.enabled = true;
	}
	err = spaghetti_runtime_load(&task);
	if (err < 0) {
		return err;
	}

	if (config->threshold_rule.enabled) {
		const struct spaghetti_runtime_threshold_config *rule_config =
			&config->threshold_rule;

		err = spaghetti_module_manager_get_by_key(rule_config->source_key,
						  &source);
		if (err < 0) {
			return err;
		}
		err = spaghetti_module_manager_get_by_key(rule_config->relay_key,
						  &relay);
		if (err < 0) {
			return err;
		}

		const struct spaghetti_runtime_threshold_rule rule = {
			.source_id = source.id,
			.lower_current_microamps =
				rule_config->lower_current_microamps,
			.upper_current_microamps =
				rule_config->upper_current_microamps,
			.relay_id = relay.id,
			.relay_on_above = rule_config->relay_on_above,
		};

		err = spaghetti_runtime_load_threshold_rule(&rule);
	} else {
		err = spaghetti_runtime_clear_threshold_rule();
	}
	if (err < 0) {
		return err;
	}
	return 0;
}

static int start_runtime(const struct spaghetti_config *config)
{
	int err;

	if (!config->sampling.enabled && !config->threshold_rule.enabled) {
		return 0;
	}

	err = spaghetti_runtime_start();
	return err;
}

static bool mqtt_configs_are_equal(
	const struct spaghetti_mqtt_config *first,
	const struct spaghetti_mqtt_config *second)
{
	return (first->enabled == second->enabled) &&
	       (first->port == second->port) &&
	       (strcmp(first->host, second->host) == 0) &&
	       (strcmp(first->base_topic, second->base_topic) == 0);
}

static int configure_mqtt(const struct spaghetti_mqtt_config *mqtt)
{
	enum spaghetti_service_state state;
	bool restart_service;
	int err = spaghetti_service_get_state(
		SPAGHETTI_SERVICE_ID_MQTT, &state);

	if (err < 0) {
		return err;
	}
	restart_service = state != SPAGHETTI_SERVICE_STOPPED;
	if (state != SPAGHETTI_SERVICE_STOPPED) {
		err = spaghetti_service_stop(
			SPAGHETTI_SERVICE_ID_MQTT,
			K_MSEC(CONFIG_SPAGHETTI_MQTT_STOP_TIMEOUT_MS));
		if ((err < 0) && (err != -EALREADY)) {
			return err;
		}
	}

	err = spaghetti_mqtt_init(mqtt);
	if ((err == 0) && restart_service) {
		err = spaghetti_service_start(SPAGHETTI_SERVICE_ID_MQTT);
	}

	return err;
}

static int restore_runtime(const struct spaghetti_config *config)
{
	int err = spaghetti_runtime_stop(
		K_MSEC(CONFIG_SPAGHETTI_RUNTIME_STOP_TIMEOUT_MS));

	if ((err < 0) && (err != -EALREADY)) {
		return err;
	}

	err = load_runtime(config);
	if (err < 0) {
		return err;
	}

	return start_runtime(config);
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
			transaction->old_live[old_idx].revision,
			&restored);

		if ((err < 0) && (first_error == 0)) {
			first_error = err;
		}
	}

	return first_error;
}

static int validation_failure(struct spaghetti_config_error *error,
			      enum spaghetti_config_error_field field,
			      size_t index,
			      enum spaghetti_config_error_reason reason,
			      int err)
{
	if (error != NULL) {
		error->field = field;
		error->index = index;
		error->reason = reason;
	}

	return err;
}

int spaghetti_config_init(const struct spaghetti_config *defaults)
{
	int err = spaghetti_config_validate(defaults, NULL);

	if (err < 0) {
		return err;
	}

	err = k_mutex_lock(&config_lock, K_FOREVER);
	if (err < 0) {
		return err;
	}
	if (is_initialized) {
		k_mutex_unlock(&config_lock);
		return -EALREADY;
	}

	current_config = *defaults;
	current_generation = 1U;
	is_initialized = true;
	k_mutex_unlock(&config_lock);
	LOG_INF("ready: generation=1");
	return 0;
}

int spaghetti_config_validate(const struct spaghetti_config *candidate,
			      struct spaghetti_config_error *error)
{
	struct spaghetti_module_endpoint
		endpoints[SPAGHETTI_CONFIG_MAX_MODULES];

	if ((candidate == NULL) ||
	    (candidate->version != SPAGHETTI_CONFIG_VERSION) ||
	    (candidate->module_count > SPAGHETTI_CONFIG_MAX_MODULES)) {
		return validation_failure(error, SPAGHETTI_CONFIG_ERROR_ROOT, 0U,
			SPAGHETTI_CONFIG_ERROR_RANGE, -EINVAL);
	}
	if (!mqtt_config_is_valid(&candidate->mqtt)) {
		return validation_failure(error, SPAGHETTI_CONFIG_ERROR_MQTT, 0U,
			SPAGHETTI_CONFIG_ERROR_INCONSISTENT, -EINVAL);
	}

	for (size_t module_idx = 0U; module_idx < candidate->module_count;
	     ++module_idx) {
		int err = describe_module(&candidate->modules[module_idx],
					  &endpoints[module_idx]);

		if (err < 0) {
			const enum spaghetti_config_error_reason reason =
				(err == -ENOTSUP) ?
				SPAGHETTI_CONFIG_ERROR_UNKNOWN_TYPE :
				SPAGHETTI_CONFIG_ERROR_INCONSISTENT;

			return validation_failure(error,
				SPAGHETTI_CONFIG_ERROR_MODULE, module_idx,
				reason, err);
		}

		for (size_t previous_idx = 0U; previous_idx < module_idx;
		     ++previous_idx) {
			if (candidate->modules[previous_idx].key ==
			    candidate->modules[module_idx].key) {
				return validation_failure(error,
					SPAGHETTI_CONFIG_ERROR_MODULE, module_idx,
					SPAGHETTI_CONFIG_ERROR_DUPLICATE, -EEXIST);
			}

			if ((candidate->modules[previous_idx].port_id ==
			     candidate->modules[module_idx].port_id) &&
			    endpoints_conflict(&endpoints[previous_idx],
					       &endpoints[module_idx])) {
				return validation_failure(error,
					SPAGHETTI_CONFIG_ERROR_MODULE, module_idx,
					SPAGHETTI_CONFIG_ERROR_DUPLICATE,
					-EADDRINUSE);
			}
		}
	}

	if (candidate->sampling.enabled) {
		if ((candidate->sampling.source_key == 0U) ||
		    (candidate->sampling.period_ms == 0U) ||
		    (find_module_index(candidate,
				       candidate->sampling.source_key) < 0)) {
			return validation_failure(error,
				SPAGHETTI_CONFIG_ERROR_SAMPLING, 0U,
				SPAGHETTI_CONFIG_ERROR_INCONSISTENT, -EINVAL);
		}
		if (!module_supports_read(candidate,
					  candidate->sampling.source_key)) {
			return validation_failure(error,
				SPAGHETTI_CONFIG_ERROR_SAMPLING, 0U,
				SPAGHETTI_CONFIG_ERROR_INCONSISTENT, -ENOTSUP);
		}
	}

	if (candidate->threshold_rule.enabled) {
		const struct spaghetti_runtime_threshold_config *rule =
			&candidate->threshold_rule;

		if ((rule->source_key == 0U) || (rule->relay_key == 0U) ||
		    (rule->lower_current_microamps < 0) ||
		    (rule->lower_current_microamps >=
		     rule->upper_current_microamps) ||
		    (find_module_index(candidate, rule->source_key) < 0) ||
		    (find_module_index(candidate, rule->relay_key) < 0)) {
			return validation_failure(error,
				SPAGHETTI_CONFIG_ERROR_THRESHOLD_RULE, 0U,
				SPAGHETTI_CONFIG_ERROR_INCONSISTENT, -EINVAL);
		}
		if (!module_supports_read(candidate, rule->source_key) ||
		    !module_supports_command(candidate, rule->relay_key)) {
			return validation_failure(error,
				SPAGHETTI_CONFIG_ERROR_THRESHOLD_RULE, 0U,
				SPAGHETTI_CONFIG_ERROR_INCONSISTENT, -ENOTSUP);
		}
	}

	return 0;
}

int spaghetti_config_apply(const struct spaghetti_config *candidate,
			   uint32_t expected_generation)
{
	struct spaghetti_config_transaction transaction = {0};
	struct spaghetti_config old_config = {0};
	bool mqtt_changed;
	bool mqtt_reconfigured = false;
	bool candidate_persisted = false;
	uint32_t next_generation;
	int apply_error = 0;
	int err;

	err = spaghetti_config_validate(candidate, NULL);
	if (err < 0) {
		return err;
	}
	if (expected_generation == 0U) {
		return -EINVAL;
	}

	err = k_mutex_lock(&config_lock, K_FOREVER);
	if (err < 0) {
		return err;
	}
	if (!is_initialized) {
		err = -EACCES;
		goto unlock;
	}
	if (expected_generation != current_generation) {
		err = -ESTALE;
		goto unlock;
	}
	if (current_generation == UINT32_MAX) {
		err = -EOVERFLOW;
		goto unlock;
	}

	old_config = current_config;
	next_generation = current_generation + 1U;
	mqtt_changed = !mqtt_configs_are_equal(&old_config.mqtt,
					       &candidate->mqtt);
	if (old_config.sampling.enabled || old_config.threshold_rule.enabled) {
		err = spaghetti_runtime_stop(
			K_MSEC(CONFIG_SPAGHETTI_RUNTIME_STOP_TIMEOUT_MS));
		if ((err < 0) && (err != -EALREADY)) {
			k_mutex_unlock(&config_lock);
			return err;
		}
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
				       next_generation,
				       &transaction.candidate_live[candidate_idx]);
		if (err < 0) {
			apply_error = err;
			goto rollback;
		}
		transaction.candidate_added[candidate_idx] = true;
	}

	err = load_runtime(candidate);
	if (err < 0) {
		apply_error = err;
		goto rollback;
	}

	if (mqtt_changed) {
		mqtt_reconfigured = true;
		err = configure_mqtt(&candidate->mqtt);
		if (err < 0) {
			apply_error = err;
			goto rollback;
		}
	}

	err = spaghetti_storage_write_config(candidate);
	if (err < 0) {
		apply_error = err;
		goto rollback;
	}
	candidate_persisted = true;

	err = start_runtime(candidate);
	if (err < 0) {
		apply_error = err;
		goto rollback;
	}

	current_config = *candidate;
	current_generation = next_generation;
	k_mutex_unlock(&config_lock);

	LOG_INF("applied: generation=%u modules=%u sampling=%u",
		current_generation, (uint32_t)candidate->module_count,
		candidate->sampling.enabled ? 1U : 0U);
	return 0;

rollback:
	err = rollback_transaction(&old_config, &transaction);
	if (err == 0) {
		err = restore_runtime(&old_config);
	}
	if (mqtt_reconfigured) {
		const int mqtt_error = configure_mqtt(&old_config.mqtt);

		if ((err == 0) && (mqtt_error < 0)) {
			err = mqtt_error;
		}
	}
	if (candidate_persisted) {
		const int storage_error = spaghetti_storage_write_config(&old_config);

		if ((err == 0) && (storage_error < 0)) {
			err = storage_error;
		}
	}
	k_mutex_unlock(&config_lock);
	if (err < 0) {
		LOG_ERR("apply failed: err=%d rollback=%d", apply_error, err);
		return -EIO;
	}

	LOG_WRN("apply rejected and previous state restored: err=%d", apply_error);
	return apply_error;

unlock:
	k_mutex_unlock(&config_lock);
	return err;
}

int spaghetti_config_get_snapshot(struct spaghetti_config *out,
				  uint32_t *generation)
{
	int err;

	if ((out == NULL) || (generation == NULL)) {
		return -EINVAL;
	}

	err = k_mutex_lock(&config_lock, K_FOREVER);
	if (err < 0) {
		return err;
	}

	if (!is_initialized) {
		k_mutex_unlock(&config_lock);
		return -EACCES;
	}

	*out = current_config;
	*generation = current_generation;
	k_mutex_unlock(&config_lock);
	return 0;
}
