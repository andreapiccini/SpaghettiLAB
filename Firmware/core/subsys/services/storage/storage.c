#include <spaghetti/storage.h>

#include <errno.h>
#include <stdbool.h>
#include <stdint.h>
#include <string.h>
#include <sys/types.h>

#include <zephyr/kernel.h>
#include <zephyr/logging/log.h>
#include <zephyr/settings/settings.h>

LOG_MODULE_REGISTER(spaghetti_storage, CONFIG_SPAGHETTI_STORAGE_LOG_LEVEL);

#define SPAGHETTI_STORAGE_RECORD_MAGIC 0x53504754U

enum spaghetti_storage_state {
	SPAGHETTI_STORAGE_UNINITIALIZED,
	SPAGHETTI_STORAGE_INITIALIZING,
	SPAGHETTI_STORAGE_READY,
};

struct spaghetti_storage_record {
	uint32_t magic;
	uint32_t version;
	struct spaghetti_config config;
};

static enum spaghetti_storage_state storage_state =
	SPAGHETTI_STORAGE_UNINITIALIZED;
static struct spaghetti_storage_record loaded_record;
static bool record_present;
static int record_load_error;
static bool maintenance_marker_present;
static bool maintenance_marker_corrupt;
K_MUTEX_DEFINE(storage_lock);

static bool stored_type_id_is_terminated(const char *type_id)
{
	return memchr(type_id, '\0', SPAGHETTI_CONFIG_TYPE_ID_SIZE) != NULL;
}

static int config_shape_validate(const struct spaghetti_config *config)
{
	if ((config->version != SPAGHETTI_CONFIG_VERSION) ||
	    (config->module_count > SPAGHETTI_CONFIG_MAX_MODULES)) {
		return -EINVAL;
	}

	for (size_t module_idx = 0U; module_idx < config->module_count;
	     ++module_idx) {
		const struct spaghetti_module_config *module =
			&config->modules[module_idx];

		if ((module->key == 0U) ||
		    !stored_type_id_is_terminated(module->type_id) ||
		    (module->driver_config_size == 0U) ||
		    (module->driver_config_size > SPAGHETTI_DRIVER_CONFIG_MAX)) {
			return -EINVAL;
		}
	}

	return 0;
}

static void canonicalize_config(const struct spaghetti_config *source,
				struct spaghetti_config *destination)
{
	destination->version = source->version;
	destination->module_count = source->module_count;

	for (size_t module_idx = 0U; module_idx < source->module_count;
	     ++module_idx) {
		const struct spaghetti_module_config *source_module =
			&source->modules[module_idx];
		struct spaghetti_module_config *destination_module =
			&destination->modules[module_idx];
		const size_t type_id_size =
			strlen(source_module->type_id) + 1U;

		destination_module->key = source_module->key;
		destination_module->port_id = source_module->port_id;
		memcpy(destination_module->type_id, source_module->type_id,
		       type_id_size);
		destination_module->driver_config_size =
			source_module->driver_config_size;
		memcpy(destination_module->driver_config,
		       source_module->driver_config,
		       source_module->driver_config_size);
	}

	destination->sampling = source->sampling;
	destination->threshold_rule = source->threshold_rule;
	destination->mqtt = source->mqtt;
}

static int storage_settings_set(const char *name, size_t len,
				settings_read_cb read_cb, void *read_cb_arg)
{
	struct spaghetti_storage_record record;
	ssize_t bytes_read;
	int err;

	if ((name != NULL) && (name[0] != '\0')) {
		return -ENOENT;
	}

	err = k_mutex_lock(&storage_lock, K_FOREVER);
	if (err < 0) {
		return err;
	}

	record_present = false;
	record_load_error = 0;
	memset(&loaded_record, 0, sizeof(loaded_record));
	if ((read_cb == NULL) || (len != sizeof(record))) {
		record_load_error = -EBADMSG;
		k_mutex_unlock(&storage_lock);
		return 0;
	}

	memset(&record, 0, sizeof(record));
	bytes_read = read_cb(read_cb_arg, &record, sizeof(record));
	if (bytes_read < 0) {
		record_load_error = (int)bytes_read;
		k_mutex_unlock(&storage_lock);
		return 0;
	}
	if ((size_t)bytes_read != sizeof(record)) {
		record_load_error = -EBADMSG;
		k_mutex_unlock(&storage_lock);
		return 0;
	}

	loaded_record = record;
	record_present = true;
	k_mutex_unlock(&storage_lock);
	return 0;
}

SETTINGS_STATIC_HANDLER_DEFINE(spaghetti_storage,
			       SPAGHETTI_STORAGE_CONFIG_KEY,
			       NULL, storage_settings_set, NULL, NULL);

static int maintenance_settings_set(const char *name, size_t len,
				    settings_read_cb read_cb, void *read_cb_arg)
{
	uint8_t marker = 0U;
	ssize_t bytes_read;
	int err;

	if ((name == NULL) || (strcmp(name, "boot_once") != 0)) {
		return -ENOENT;
	}

	err = k_mutex_lock(&storage_lock, K_FOREVER);
	if (err < 0) {
		return err;
	}
	maintenance_marker_present = false;
	maintenance_marker_corrupt = false;
	if ((read_cb == NULL) || (len != sizeof(marker))) {
		maintenance_marker_corrupt = true;
		k_mutex_unlock(&storage_lock);
		return 0;
	}

	bytes_read = read_cb(read_cb_arg, &marker, sizeof(marker));
	if ((bytes_read != (ssize_t)sizeof(marker)) || (marker != 1U)) {
		maintenance_marker_corrupt = true;
		k_mutex_unlock(&storage_lock);
		return 0;
	}

	maintenance_marker_present = true;
	k_mutex_unlock(&storage_lock);
	return 0;
}

SETTINGS_STATIC_HANDLER_DEFINE(spaghetti_maintenance,
			       "maintenance", NULL, maintenance_settings_set,
			       NULL, NULL);

int spaghetti_storage_init(void)
{
	bool is_record_present;
	int err = k_mutex_lock(&storage_lock, K_FOREVER);

	if (err < 0) {
		return err;
	}

	if (storage_state == SPAGHETTI_STORAGE_READY) {
		k_mutex_unlock(&storage_lock);
		return -EALREADY;
	}
	if (storage_state == SPAGHETTI_STORAGE_INITIALIZING) {
		k_mutex_unlock(&storage_lock);
		return -EBUSY;
	}

	storage_state = SPAGHETTI_STORAGE_INITIALIZING;
	record_present = false;
	record_load_error = 0;
	maintenance_marker_present = false;
	maintenance_marker_corrupt = false;
	memset(&loaded_record, 0, sizeof(loaded_record));
	k_mutex_unlock(&storage_lock);

	err = settings_subsys_init();
	if (err == 0) {
		err = settings_load_subtree(SPAGHETTI_STORAGE_CONFIG_KEY);
	}
	if (err == 0) {
		err = settings_load_subtree("maintenance");
	}

	(void)k_mutex_lock(&storage_lock, K_FOREVER);
	storage_state = (err == 0) ? SPAGHETTI_STORAGE_READY :
		SPAGHETTI_STORAGE_UNINITIALIZED;
	is_record_present = record_present;
	k_mutex_unlock(&storage_lock);
	if (err < 0) {
		return err;
	}

	LOG_INF("ready: config=%s", is_record_present ? "present" : "absent");
	return 0;
}

int spaghetti_storage_read_config(struct spaghetti_config *out)
{
	struct spaghetti_config config;
	int err;

	if (out == NULL) {
		return -EINVAL;
	}

	err = k_mutex_lock(&storage_lock, K_FOREVER);
	if (err < 0) {
		return err;
	}

	if (storage_state != SPAGHETTI_STORAGE_READY) {
		err = -EACCES;
		goto unlock;
	}
	if (record_load_error < 0) {
		err = record_load_error;
		goto unlock;
	}
	if (!record_present) {
		err = -ENOENT;
		goto unlock;
	}
	if ((loaded_record.magic != SPAGHETTI_STORAGE_RECORD_MAGIC) ||
	    (loaded_record.version != SPAGHETTI_CONFIG_VERSION) ||
	    (loaded_record.config.version != SPAGHETTI_CONFIG_VERSION)) {
		err = -EBADMSG;
		goto unlock;
	}

	config = loaded_record.config;
	err = 0;

unlock:
	k_mutex_unlock(&storage_lock);
	if (err == 0) {
		*out = config;
	}
	return err;
}

int spaghetti_storage_write_config(const struct spaghetti_config *config)
{
	struct spaghetti_storage_record record;
	int err;

	if ((config == NULL) || (config_shape_validate(config) < 0)) {
		return -EINVAL;
	}

	memset(&record, 0, sizeof(record));
	record.magic = SPAGHETTI_STORAGE_RECORD_MAGIC;
	record.version = SPAGHETTI_CONFIG_VERSION;
	canonicalize_config(config, &record.config);

	err = k_mutex_lock(&storage_lock, K_FOREVER);
	if (err < 0) {
		return err;
	}

	if (storage_state != SPAGHETTI_STORAGE_READY) {
		k_mutex_unlock(&storage_lock);
		return -EACCES;
	}

	err = settings_save_one(SPAGHETTI_STORAGE_CONFIG_KEY, &record,
				sizeof(record));
	if (err == 0) {
		loaded_record = record;
		record_present = true;
		record_load_error = 0;
	}
	k_mutex_unlock(&storage_lock);

	if (err == 0) {
		LOG_INF("Config persisted: modules=%u",
			(uint32_t)config->module_count);
	}
	return err;
}

int spaghetti_storage_request_maintenance_once(void)
{
	const uint8_t marker = 1U;
	int err = k_mutex_lock(&storage_lock, K_FOREVER);

	if (err < 0) {
		return err;
	}
	if (storage_state != SPAGHETTI_STORAGE_READY) {
		err = -EACCES;
		goto unlock;
	}

	err = settings_save_one(SPAGHETTI_STORAGE_MAINTENANCE_BOOT_ONCE_KEY,
				&marker, sizeof(marker));
	if (err == 0) {
		maintenance_marker_present = true;
		maintenance_marker_corrupt = false;
	}

unlock:
	k_mutex_unlock(&storage_lock);
	return err;
}

int spaghetti_storage_consume_maintenance_once(bool *requested)
{
	bool marker_exists;
	bool marker_valid;
	int err;

	if (requested == NULL) {
		return -EINVAL;
	}

	err = k_mutex_lock(&storage_lock, K_FOREVER);
	if (err < 0) {
		return err;
	}
	if (storage_state != SPAGHETTI_STORAGE_READY) {
		k_mutex_unlock(&storage_lock);
		return -EACCES;
	}

	marker_exists = maintenance_marker_present ||
			maintenance_marker_corrupt;
	marker_valid = maintenance_marker_present &&
		       !maintenance_marker_corrupt;
	if (!marker_exists) {
		k_mutex_unlock(&storage_lock);
		*requested = false;
		return 0;
	}

	err = settings_delete(SPAGHETTI_STORAGE_MAINTENANCE_BOOT_ONCE_KEY);
	if (err == 0) {
		maintenance_marker_present = false;
		maintenance_marker_corrupt = false;
	}
	k_mutex_unlock(&storage_lock);
	if (err < 0) {
		return err;
	}

	*requested = marker_valid;
	return 0;
}
