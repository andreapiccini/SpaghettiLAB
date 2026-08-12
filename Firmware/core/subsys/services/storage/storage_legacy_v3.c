#include "storage_legacy_v3.h"

#include <errno.h>
#include <string.h>

#include <zephyr/logging/log.h>

#include <spaghetti/power.h>
#include <spaghetti/topology.h>

#include "../../config/legacy_driver_config.h"

LOG_MODULE_DECLARE(spaghetti_storage, CONFIG_SPAGHETTI_STORAGE_LOG_LEVEL);

static bool type_id_is_terminated(const char *type_id)
{
	return memchr(type_id, '\0', SPAGHETTI_STORAGE_LEGACY_TYPE_ID_SIZE) !=
	       NULL;
}

int spaghetti_storage_legacy_v3_convert(
	const uint8_t *bytes,
	size_t length,
	struct spaghetti_config *out)
{
	struct spaghetti_storage_legacy_record legacy;
	struct spaghetti_config converted = {
		.version = SPAGHETTI_CONFIG_VERSION,
		.connectivity_policy = SPAGHETTI_CONNECTIVITY_ONLINE,
		.energy_policy = {
			.ble_availability = SPAGHETTI_BLE_ADVERTISING,
		},
	};
	int err;

	if ((bytes == NULL) || (out == NULL)) {
		return -EINVAL;
	}
	if (length != sizeof(legacy)) {
		return -EBADMSG;
	}

	memcpy(&legacy, bytes, sizeof(legacy));
	if ((legacy.magic != SPAGHETTI_STORAGE_RECORD_MAGIC_V3) ||
	    (legacy.version != 3U) || (legacy.config.version != 3U)) {
		return -EBADMSG;
	}
	if (legacy.config.module_count > CONFIG_SPAGHETTI_MAX_MODULES) {
		return -EPROTONOSUPPORT;
	}

	converted.module_count = legacy.config.module_count;
	for (size_t module_idx = 0U; module_idx < legacy.config.module_count;
	     ++module_idx) {
		const struct spaghetti_storage_legacy_module_config *source =
			&legacy.config.modules[module_idx];
		struct spaghetti_module_config *destination =
			&converted.modules[module_idx];

		if ((source->key == 0U) ||
		    !type_id_is_terminated(source->type_id) ||
		    (source->driver_config_size == 0U) ||
		    (source->driver_config_size >
		     SPAGHETTI_STORAGE_LEGACY_DRIVER_CONFIG_MAX)) {
			return -EPROTONOSUPPORT;
		}

		destination->key = source->key;
		destination->port_id = source->port_id;
		destination->bay_id = SPAGHETTI_BAY_ID_UNSPECIFIED;
		destination->power_rail_id = SPAGHETTI_POWER_RAIL_UNSPECIFIED;
		memcpy(destination->type_id, source->type_id,
		       strlen(source->type_id) + 1U);

		err = spaghetti_legacy_driver_config_bytes_to_properties(
			source->type_id, source->driver_config,
			source->driver_config_size, &destination->properties);
		if (err < 0) {
			return (err == -ENOTSUP) ? -EPROTONOSUPPORT : err;
		}
	}

	converted.schedules[0].enabled = legacy.config.sampling.enabled;
	converted.schedules[0].source_key = legacy.config.sampling.source_key;
	converted.schedules[0].period_ms = legacy.config.sampling.period_ms;
	converted.schedule_count = 1U;
	converted.mqtt = legacy.config.mqtt;

	if (legacy.config.threshold_rule.enabled) {
		/*
		 * Threshold execution moves to a rule driver in TASK-340-01.
		 * Keep sampling/schedules usable; drop the concrete threshold.
		 */
		LOG_WRN("legacy threshold dropped pending TASK-340-01");
	}

	err = spaghetti_config_validate(&converted, NULL);
	if (err < 0) {
		return err;
	}

	*out = converted;
	return 0;
}
