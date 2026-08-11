#include <spaghetti/core.h>

#include <errno.h>
#include <stdbool.h>
#include <string.h>

#include <zephyr/kernel.h>
#include <zephyr/logging/log.h>
#include <zephyr/sys/atomic.h>

#include <spaghetti/communication.h>
#include <spaghetti/config.h>
#include <spaghetti/data.h>
#include <spaghetti/discovery.h>
#include <spaghetti/driver_registry.h>
#include <spaghetti/maintenance_link.h>
#include <spaghetti/module_manager.h>
#include <spaghetti/mqtt.h>
#include <spaghetti/ota.h>
#include <spaghetti/port.h>
#include <spaghetti/power.h>
#include <spaghetti/runtime.h>
#include <spaghetti/remote_console.h>
#include <spaghetti/storage.h>
#include <spaghetti/update.h>
#include <spaghetti/wifi_profiles.h>

#include "core_boot_internal.h"

LOG_MODULE_REGISTER(spaghetti_core, CONFIG_SPAGHETTI_CORE_LOG_LEVEL);

static const struct spaghetti_config empty_config = {
	.version = SPAGHETTI_CONFIG_VERSION,
	.sampling = {
		.enabled = false,
		.source_key = 0U,
		.period_ms = 1000U,
	},
};

static struct spaghetti_config startup_config;
static bool startup_config_present;
static bool core_info_available;
static struct spaghetti_core_info core_info;
static enum spaghetti_maintenance_entry_reason maintenance_reason;
static atomic_t core_state = ATOMIC_INIT(SPAGHETTI_CORE_UNINITIALIZED);
K_MUTEX_DEFINE(core_lock);

BUILD_ASSERT(sizeof(CONFIG_MCUBOOT_IMGTOOL_SIGN_VERSION) <=
	     SPAGHETTI_CORE_VERSION_SIZE);

static int fail_initialization(const char *component, int err)
{
	atomic_set(&core_state, SPAGHETTI_CORE_FAILED);
	LOG_ERR("%s initialization failed: err=%d", component, err);
	return err;
}

static int discovery_event_sink(const struct spaghetti_discovery_event *event,
				void *user_data)
{
	struct spaghetti_module_snapshot module;
	spaghetti_module_id_t module_id;
	int err;

	ARG_UNUSED(user_data);
	if (event == NULL) {
		return -EINVAL;
	}

	if (event->type == SPAGHETTI_DISCOVERY_UPSERT) {
		const struct spaghetti_module_request request = {
			.key = event->result.key,
			.port_id = event->result.port_id,
			.type_id = event->result.type_id,
			.driver_config = event->result.driver_config,
			.driver_config_size = event->result.driver_config_size,
			.revision = event->result.generation,
		};

		return spaghetti_module_manager_configure(&request, &module_id);
	}
	if (event->type != SPAGHETTI_DISCOVERY_REMOVE) {
		return -EINVAL;
	}

	err = spaghetti_module_manager_get_by_key(event->result.key, &module);
	if (err == -ENOENT) {
		return 0;
	}
	if (err < 0) {
		return err;
	}
	if (module.revision != event->result.generation) {
		return -ESTALE;
	}

	return spaghetti_module_manager_remove(module.id, module.revision);
}

static int retain_startup_config(void)
{
	struct spaghetti_config_error validation_error;
	int err = spaghetti_storage_read_config(&startup_config);

	startup_config_present = false;
	if (err == -ENOENT) {
		LOG_INF("no stored Config: first boot");
		return 0;
	}
	if (err == -EBADMSG) {
		LOG_WRN("stored Config is corrupt or incompatible; using empty state");
		return 0;
	}
	if (err < 0) {
		return err;
	}

	err = spaghetti_config_validate(&startup_config, &validation_error);
	if (err < 0) {
		LOG_WRN("stored Config invalid: field=%u index=%u reason=%u err=%d",
			(uint32_t)validation_error.field,
			(uint32_t)validation_error.index,
			(uint32_t)validation_error.reason, err);
		return 0;
	}

	startup_config_present = true;
	LOG_INF("stored Config retained: modules=%u",
		(uint32_t)startup_config.module_count);
	return 0;
}

static int select_boot_mode(const struct spaghetti_update_status *update_status)
{
	bool maintenance_requested;
	int err = spaghetti_storage_consume_maintenance_once(
		&maintenance_requested);

	if (err < 0) {
		return err;
	}
	if (!startup_config_present) {
		core_info.mode = SPAGHETTI_CORE_MODE_UNPROVISIONED;
		maintenance_reason = SPAGHETTI_MAINTENANCE_CONFIG_ABSENT;
	} else if (maintenance_requested) {
		core_info.mode = SPAGHETTI_CORE_MODE_MAINTENANCE;
		maintenance_reason = SPAGHETTI_MAINTENANCE_REBOOT_REQUEST;
	} else {
		err = spaghetti_maintenance_link_probe(
			CONFIG_SPAGHETTI_BOOTSTRAP_PROBE_MS,
			&maintenance_requested);
		if (err < 0) {
			return err;
		}
		core_info.mode = maintenance_requested ?
			SPAGHETTI_CORE_MODE_MAINTENANCE :
			SPAGHETTI_CORE_MODE_NORMAL;
		maintenance_reason = SPAGHETTI_MAINTENANCE_BOOTSTRAP_FRAME;
	}

	core_info.image_state = update_status->image_confirmed ?
		SPAGHETTI_CORE_IMAGE_CONFIRMED : SPAGHETTI_CORE_IMAGE_TRIAL;
	core_info.active_slot = update_status->active_slot;
	core_info.image_confirmed = update_status->image_confirmed;
	memcpy(core_info.version, CONFIG_MCUBOOT_IMGTOOL_SIGN_VERSION,
	       sizeof(CONFIG_MCUBOOT_IMGTOOL_SIGN_VERSION));
	return 0;
}

static const char *core_mode_name(enum spaghetti_core_mode mode)
{
	switch (mode) {
	case SPAGHETTI_CORE_MODE_UNPROVISIONED:
		return "unprovisioned";
	case SPAGHETTI_CORE_MODE_NORMAL:
		return "normal";
	case SPAGHETTI_CORE_MODE_MAINTENANCE:
		return "maintenance";
	default:
		return "unknown";
	}
}

int spaghetti_core_init(void)
{
	const struct spaghetti_mqtt_config mqtt_disabled = {0};
	struct spaghetti_update_status update_status;
	int err = k_mutex_lock(&core_lock, K_FOREVER);

	if (err < 0) {
		return err;
	}
	if (atomic_get(&core_state) != SPAGHETTI_CORE_UNINITIALIZED) {
		k_mutex_unlock(&core_lock);
		return -EALREADY;
	}
	atomic_set(&core_state, SPAGHETTI_CORE_INITIALIZING);
	core_info_available = false;

	err = spaghetti_storage_init();
	if (err < 0) {
		goto storage_failed;
	}
	err = spaghetti_update_init();
	if (err < 0) {
		goto update_failed;
	}
	err = spaghetti_update_get_status(&update_status);
	if (err < 0) {
		goto update_status_failed;
	}
	err = spaghetti_maintenance_link_init();
	if (err < 0) {
		goto maintenance_link_failed;
	}
	err = spaghetti_port_init_all();
	if (err < 0) {
		goto port_failed;
	}
#if defined(CONFIG_SPAGHETTI_POWER)
	err = spaghetti_power_init();
	if (err < 0) {
		goto power_failed;
	}
#endif
	err = spaghetti_driver_registry_init();
	if (err < 0) {
		goto registry_failed;
	}
	err = spaghetti_module_manager_init();
	if (err < 0) {
		goto manager_failed;
	}
	err = spaghetti_data_init();
	if (err < 0) {
		goto data_failed;
	}
	err = spaghetti_config_init(&empty_config);
	if (err < 0) {
		goto config_failed;
	}
	err = retain_startup_config();
	if (err < 0) {
		goto startup_config_failed;
	}
	err = select_boot_mode(&update_status);
	if (err < 0) {
		goto boot_mode_failed;
	}

	if (core_info.mode == SPAGHETTI_CORE_MODE_NORMAL) {
		err = spaghetti_runtime_init();
		if (err < 0) {
			goto runtime_failed;
		}
		err = spaghetti_mqtt_init(&mqtt_disabled);
		if (err < 0) {
			goto mqtt_failed;
		}
		err = spaghetti_discovery_init(discovery_event_sink, NULL);
		if (err < 0) {
			goto discovery_failed;
		}
		err = spaghetti_wifi_profiles_init();
		if (err < 0) {
			goto wifi_failed;
		}
		err = spaghetti_ota_init();
		if (err < 0) {
			goto ota_failed;
		}
	} else {
		err = spaghetti_wifi_profiles_init_offline();
		if (err < 0) {
			goto wifi_failed;
		}
		err = spaghetti_maintenance_link_enter(maintenance_reason);
		if (err < 0) {
			goto maintenance_enter_failed;
		}
	}
	err = spaghetti_communication_init();
	if (err < 0) {
		goto communication_failed;
	}
	if (core_info.mode == SPAGHETTI_CORE_MODE_NORMAL) {
		err = spaghetti_remote_console_init();
		if (err < 0) {
			goto remote_console_failed;
		}
	}

	atomic_set(&core_state, SPAGHETTI_CORE_READY);
	core_info.state = SPAGHETTI_CORE_READY;
	core_info_available = true;
	k_mutex_unlock(&core_lock);
	LOG_INF("boot: mode=%s image=%s slot=%u confirmed=%u version=%s",
		core_mode_name(core_info.mode),
		(core_info.image_state == SPAGHETTI_CORE_IMAGE_TRIAL) ?
			"trial" : "confirmed",
		(uint32_t)core_info.active_slot,
		core_info.image_confirmed ? 1U : 0U, core_info.version);
	LOG_INF("Spaghetti Core ready");
	return 0;

remote_console_failed:
	(void)fail_initialization("Remote Console", err);
	goto unlock;
communication_failed:
	(void)fail_initialization("Communication", err);
	goto unlock;
ota_failed:
	(void)fail_initialization("OTA", err);
	goto unlock;
maintenance_enter_failed:
	(void)fail_initialization("Maintenance Link enter", err);
	goto unlock;
wifi_failed:
	(void)fail_initialization("Wi-Fi Profiles", err);
	goto unlock;
startup_config_failed:
	(void)fail_initialization("startup Config", err);
	goto unlock;
boot_mode_failed:
	(void)fail_initialization("boot mode", err);
	goto unlock;
config_failed:
	(void)fail_initialization("Config", err);
	goto unlock;
discovery_failed:
	(void)fail_initialization("Discovery", err);
	goto unlock;
update_failed:
	(void)fail_initialization("Update", err);
	goto unlock;
update_status_failed:
	(void)fail_initialization("Update status", err);
	goto unlock;
maintenance_link_failed:
	(void)fail_initialization("Maintenance Link", err);
	goto unlock;
storage_failed:
	(void)fail_initialization("Storage", err);
	goto unlock;
mqtt_failed:
	(void)fail_initialization("MQTT", err);
	goto unlock;
runtime_failed:
	(void)fail_initialization("Runtime", err);
	goto unlock;
data_failed:
	(void)fail_initialization("Data", err);
	goto unlock;
manager_failed:
	(void)fail_initialization("Module Manager", err);
	goto unlock;
registry_failed:
	(void)fail_initialization("Driver Registry", err);
	goto unlock;
#if defined(CONFIG_SPAGHETTI_POWER)
power_failed:
	(void)fail_initialization("Power", err);
	goto unlock;
#endif
port_failed:
	(void)fail_initialization("Port", err);

unlock:
	k_mutex_unlock(&core_lock);
	return err;
}

int spaghetti_core_start(void)
{
	bool confirm_trial;
	uint32_t generation;
	struct spaghetti_config current;
	int err = k_mutex_lock(&core_lock, K_FOREVER);

	if (err < 0) {
		return err;
	}
	if (atomic_get(&core_state) != SPAGHETTI_CORE_READY) {
		k_mutex_unlock(&core_lock);
		return -EACCES;
	}

	if ((core_info.mode == SPAGHETTI_CORE_MODE_NORMAL) &&
	    startup_config_present) {
		err = spaghetti_config_get_snapshot(&current, &generation);
		if (err == 0) {
			err = spaghetti_config_apply(&startup_config, generation);
		}
		if (err < 0) {
			LOG_WRN("stored Config not applied; empty state remains live: err=%d",
				err);
		}
	}

	atomic_set(&core_state, SPAGHETTI_CORE_RUNNING);
	core_info.state = SPAGHETTI_CORE_RUNNING;
	confirm_trial =
		core_info.image_state == SPAGHETTI_CORE_IMAGE_TRIAL;
	k_mutex_unlock(&core_lock);

	if (confirm_trial) {
		k_sleep(K_MSEC(CONFIG_SPAGHETTI_TRIAL_HEALTH_MS));
		if (atomic_get(&core_state) != SPAGHETTI_CORE_RUNNING) {
			return -EIO;
		}
		err = spaghetti_update_confirm_trial();
		if (err < 0) {
			atomic_set(&core_state, SPAGHETTI_CORE_FAILED);
			spaghetti_core_boot_reboot();
			return err;
		}

		(void)k_mutex_lock(&core_lock, K_FOREVER);
		core_info.state = SPAGHETTI_CORE_RUNNING;
		core_info.image_state = SPAGHETTI_CORE_IMAGE_CONFIRMED;
		core_info.image_confirmed = true;
		k_mutex_unlock(&core_lock);
	}

	if (core_info.mode == SPAGHETTI_CORE_MODE_NORMAL) {
		err = spaghetti_wifi_profiles_request_connect();
		if ((err < 0) && (err != -ENOENT) && (err != -ENOTSUP)) {
			LOG_WRN("Wi-Fi auto-connect was not started: err=%d", err);
		}
	}

	return 0;
}

enum spaghetti_core_state spaghetti_core_get_state(void)
{
	return (enum spaghetti_core_state)atomic_get(&core_state);
}

int spaghetti_core_get_info(struct spaghetti_core_info *out)
{
	if (out == NULL) {
		return -EINVAL;
	}

	(void)k_mutex_lock(&core_lock, K_FOREVER);
	if (!core_info_available) {
		k_mutex_unlock(&core_lock);
		return -EAGAIN;
	}
	core_info.state = (enum spaghetti_core_state)atomic_get(&core_state);
	*out = core_info;
	k_mutex_unlock(&core_lock);
	return 0;
}
