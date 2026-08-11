#include <errno.h>
#include <stdbool.h>
#include <stddef.h>
#include <stdint.h>
#include <string.h>

#include <zephyr/kernel.h>
#include <zephyr/mgmt/mcumgr/mgmt/handlers.h>
#include <zephyr/mgmt/mcumgr/mgmt/mgmt.h>
#include <zephyr/mgmt/mcumgr/smp/smp.h>
#include <zephyr/sys/reboot.h>
#include <zephyr/sys/util.h>

#include <mgmt/mcumgr/util/zcbor_bulk.h>
#include <zcbor_decode.h>
#include <zcbor_encode.h>

#include <spaghetti/config_codec.h>
#include <spaghetti/core.h>
#include <spaghetti/maintenance_link.h>
#include <spaghetti/storage.h>
#include <spaghetti/update.h>
#include <spaghetti/wifi_profiles.h>

#define SPAGHETTI_MGMT_GROUP_ID MGMT_GROUP_ID_PERUSER
#define SPAGHETTI_MGMT_IMAGE_CHUNK_MAX 192U

enum spaghetti_mgmt_command_id {
	SPAGHETTI_MGMT_ID_STATUS,
	SPAGHETTI_MGMT_ID_CONFIG,
	SPAGHETTI_MGMT_ID_WIFI_SET,
	SPAGHETTI_MGMT_ID_WIFI_REMOVE,
	SPAGHETTI_MGMT_ID_BOOTSTRAP_KEY,
	SPAGHETTI_MGMT_ID_IMAGE,
	SPAGHETTI_MGMT_ID_IMAGE_CANCEL,
	SPAGHETTI_MGMT_ID_COUNT,
};

static uint32_t expected_image_size;
static bool image_transfer_active;
static struct k_work_delayable reboot_work;
K_MUTEX_DEFINE(mgmt_lock);

static void wipe_sensitive(void *data, size_t data_size)
{
	volatile uint8_t *bytes = data;

	for (size_t byte_idx = 0U; byte_idx < data_size; ++byte_idx) {
		bytes[byte_idx] = 0U;
	}
}

static bool maintenance_is_active(void)
{
	return spaghetti_maintenance_link_get_state() ==
	       SPAGHETTI_MAINTENANCE_LINK_ACTIVE;
}

static int encode_result(zcbor_state_t *zse, int result)
{
	const bool ok = zcbor_tstr_put_lit(zse, "rc") &&
			zcbor_int32_put(zse, result);

	return ok ? MGMT_ERR_EOK : MGMT_ERR_EMSGSIZE;
}

static void reboot_handler(struct k_work *work)
{
	ARG_UNUSED(work);
	sys_reboot(SYS_REBOOT_WARM);
}

static void schedule_reboot(void)
{
	(void)k_work_reschedule(&reboot_work,
		K_MSEC(CONFIG_SPAGHETTI_MAINTENANCE_REBOOT_DELAY_MS));
}

static void synchronize_image_transfer(void)
{
	struct spaghetti_update_status status;

	if (!image_transfer_active) {
		return;
	}
	if ((spaghetti_update_get_status(&status) < 0) ||
	    (status.state != SPAGHETTI_UPDATE_RECEIVING) ||
	    (status.transport != SPAGHETTI_UPDATE_TRANSPORT_UART)) {
		image_transfer_active = false;
		expected_image_size = 0U;
	}
}

static int status_read(struct smp_streamer *ctxt)
{
	struct spaghetti_update_status update;
	struct spaghetti_core_info core;
	zcbor_state_t *zse = ctxt->writer->zs;
	int err;
	bool ok;

	if (!maintenance_is_active()) {
		return MGMT_ERR_EACCESSDENIED;
	}
	err = spaghetti_core_get_info(&core);
	if (err < 0) {
		return encode_result(zse, err);
	}
	err = spaghetti_update_get_status(&update);
	if (err < 0) {
		return encode_result(zse, err);
	}

	ok = zcbor_tstr_put_lit(zse, "rc") && zcbor_int32_put(zse, 0) &&
	     zcbor_tstr_put_lit(zse, "mode") &&
	     zcbor_uint32_put(zse, (uint32_t)core.mode) &&
	     zcbor_tstr_put_lit(zse, "image") &&
	     zcbor_uint32_put(zse, (uint32_t)core.image_state) &&
	     zcbor_tstr_put_lit(zse, "slot") &&
	     zcbor_uint32_put(zse, core.active_slot) &&
	     zcbor_tstr_put_lit(zse, "confirmed") &&
	     zcbor_bool_put(zse, core.image_confirmed) &&
	     zcbor_tstr_put_lit(zse, "version") &&
	     zcbor_tstr_encode_ptr(zse, core.version, strlen(core.version)) &&
	     zcbor_tstr_put_lit(zse, "update") &&
	     zcbor_uint32_put(zse, (uint32_t)update.state);
	return ok ? MGMT_ERR_EOK : MGMT_ERR_EMSGSIZE;
}

static int config_write(struct smp_streamer *ctxt)
{
	struct spaghetti_config config;
	struct zcbor_string payload = {0};
	zcbor_state_t *zsd = ctxt->reader->zs;
	zcbor_state_t *zse = ctxt->writer->zs;
	size_t decoded;
	struct zcbor_map_decode_key_val fields[] = {
		ZCBOR_MAP_DECODE_KEY_DECODER(
			"data", zcbor_bstr_decode, &payload),
	};
	bool ok;
	int err;

	if (!maintenance_is_active()) {
		return MGMT_ERR_EACCESSDENIED;
	}
	ok = zcbor_map_decode_bulk(zsd, fields, ARRAY_SIZE(fields),
				   &decoded) == 0;
	if (!ok || (payload.len == 0U) ||
	    (payload.len > SPAGHETTI_CONFIG_CBOR_MAX_SIZE)) {
		return MGMT_ERR_EINVAL;
	}

	err = spaghetti_config_decode_cbor(payload.value, payload.len, &config);
	if (err == 0) {
		err = spaghetti_storage_write_config(&config);
	}
	if (err == 0) {
		schedule_reboot();
	}
	return encode_result(zse, err);
}

static int wifi_set_write(struct smp_streamer *ctxt)
{
	struct spaghetti_wifi_profile_config profile = {0};
	struct zcbor_string ssid = {0};
	struct zcbor_string passphrase = {0};
	uint32_t security = UINT32_MAX;
	zcbor_state_t *zsd = ctxt->reader->zs;
	zcbor_state_t *zse = ctxt->writer->zs;
	size_t decoded;
	struct zcbor_map_decode_key_val fields[] = {
		ZCBOR_MAP_DECODE_KEY_DECODER("ssid", zcbor_tstr_decode, &ssid),
		ZCBOR_MAP_DECODE_KEY_DECODER(
			"security", zcbor_uint32_decode, &security),
		ZCBOR_MAP_DECODE_KEY_DECODER(
			"passphrase", zcbor_bstr_decode, &passphrase),
	};
	bool ok;
	int err;

	if (!maintenance_is_active()) {
		return MGMT_ERR_EACCESSDENIED;
	}
	ok = zcbor_map_decode_bulk(zsd, fields, ARRAY_SIZE(fields),
				   &decoded) == 0;
	if (!ok || (ssid.len == 0U) ||
	    (ssid.len >= sizeof(profile.ssid)) ||
	    (passphrase.len >= sizeof(profile.passphrase)) ||
	    (security > SPAGHETTI_WIFI_SECURITY_WPA2_PSK)) {
		return MGMT_ERR_EINVAL;
	}

	memcpy(profile.ssid, ssid.value, ssid.len);
	profile.ssid[ssid.len] = '\0';
	profile.security = (enum spaghetti_wifi_security)security;
	profile.passphrase_size = passphrase.len;
	memcpy(profile.passphrase, passphrase.value, passphrase.len);
	err = spaghetti_wifi_profiles_set(&profile);
	wipe_sensitive(&profile, sizeof(profile));
	return encode_result(zse, err);
}

static int wifi_remove_write(struct smp_streamer *ctxt)
{
	struct zcbor_string ssid = {0};
	char ssid_text[SPAGHETTI_WIFI_SSID_SIZE] = {0};
	zcbor_state_t *zsd = ctxt->reader->zs;
	zcbor_state_t *zse = ctxt->writer->zs;
	size_t decoded;
	struct zcbor_map_decode_key_val fields[] = {
		ZCBOR_MAP_DECODE_KEY_DECODER("ssid", zcbor_tstr_decode, &ssid),
	};
	bool ok;
	int err;

	if (!maintenance_is_active()) {
		return MGMT_ERR_EACCESSDENIED;
	}
	ok = zcbor_map_decode_bulk(zsd, fields, ARRAY_SIZE(fields),
				   &decoded) == 0;
	if (!ok || (ssid.len == 0U) || (ssid.len >= sizeof(ssid_text))) {
		return MGMT_ERR_EINVAL;
	}
	memcpy(ssid_text, ssid.value, ssid.len);
	ssid_text[ssid.len] = '\0';
	err = spaghetti_wifi_profiles_remove(ssid_text);
	return encode_result(zse, err);
}

static int bootstrap_key_write(struct smp_streamer *ctxt)
{
	struct zcbor_string key = {0};
	zcbor_state_t *zsd = ctxt->reader->zs;
	zcbor_state_t *zse = ctxt->writer->zs;
	size_t decoded;
	struct zcbor_map_decode_key_val fields[] = {
		ZCBOR_MAP_DECODE_KEY_DECODER("key", zcbor_bstr_decode, &key),
	};
	bool ok;
	int err;

	if (!maintenance_is_active()) {
		return MGMT_ERR_EACCESSDENIED;
	}
	ok = zcbor_map_decode_bulk(zsd, fields, ARRAY_SIZE(fields),
				   &decoded) == 0;
	if (!ok || (key.len != SPAGHETTI_MAINTENANCE_KEY_SIZE)) {
		return MGMT_ERR_EINVAL;
	}
	err = spaghetti_maintenance_link_set_key(key.value, key.len);
	return encode_result(zse, err);
}

static int image_write(struct smp_streamer *ctxt)
{
	struct zcbor_string data = {0};
	uint32_t offset = UINT32_MAX;
	uint32_t total = UINT32_MAX;
	zcbor_state_t *zsd = ctxt->reader->zs;
	zcbor_state_t *zse = ctxt->writer->zs;
	size_t decoded;
	struct zcbor_map_decode_key_val fields[] = {
		ZCBOR_MAP_DECODE_KEY_DECODER(
			"offset", zcbor_uint32_decode, &offset),
		ZCBOR_MAP_DECODE_KEY_DECODER(
			"total", zcbor_uint32_decode, &total),
		ZCBOR_MAP_DECODE_KEY_DECODER("data", zcbor_bstr_decode, &data),
	};
	bool last;
	bool ok;
	int err;

	if (!maintenance_is_active()) {
		return MGMT_ERR_EACCESSDENIED;
	}
	ok = zcbor_map_decode_bulk(zsd, fields, ARRAY_SIZE(fields),
				   &decoded) == 0;
	if (!ok || (total == 0U) || (data.len == 0U) ||
	    (data.len > SPAGHETTI_MGMT_IMAGE_CHUNK_MAX) ||
	    (offset > total) || (data.len > (total - offset))) {
		return MGMT_ERR_EINVAL;
	}

	(void)k_mutex_lock(&mgmt_lock, K_FOREVER);
	synchronize_image_transfer();
	if (offset == 0U) {
		if (image_transfer_active) {
			err = -EBUSY;
			goto respond;
		}
		err = spaghetti_update_arm(
			CONFIG_SPAGHETTI_MAINTENANCE_SESSION_MS);
		if (err == 0) {
			err = spaghetti_update_begin(
				SPAGHETTI_UPDATE_TRANSPORT_UART);
		}
		if (err < 0) {
			(void)spaghetti_update_cancel();
			goto respond;
		}
		expected_image_size = total;
		image_transfer_active = true;
	} else if (!image_transfer_active ||
		   (total != expected_image_size)) {
		err = -EINVAL;
		goto respond;
	}

	last = ((size_t)offset + data.len) == total;
	err = spaghetti_update_write(offset, data.value, data.len, last);
	if ((err == 0) && last) {
		err = spaghetti_update_finish();
		if (err == 0) {
			image_transfer_active = false;
			expected_image_size = 0U;
			schedule_reboot();
		}
	}
	if (err < 0) {
		(void)spaghetti_update_cancel();
		image_transfer_active = false;
		expected_image_size = 0U;
	}

respond:
	ok = zcbor_tstr_put_lit(zse, "rc") &&
	     zcbor_int32_put(zse, err) &&
	     zcbor_tstr_put_lit(zse, "offset") &&
	     zcbor_uint32_put(zse, (err == 0) ?
		(uint32_t)(offset + data.len) : offset);
	k_mutex_unlock(&mgmt_lock);
	return ok ? MGMT_ERR_EOK : MGMT_ERR_EMSGSIZE;
}

static int image_cancel_write(struct smp_streamer *ctxt)
{
	zcbor_state_t *zse = ctxt->writer->zs;
	int err;

	if (!maintenance_is_active()) {
		return MGMT_ERR_EACCESSDENIED;
	}
	(void)k_mutex_lock(&mgmt_lock, K_FOREVER);
	err = spaghetti_update_cancel();
	image_transfer_active = false;
	expected_image_size = 0U;
	k_mutex_unlock(&mgmt_lock);
	return encode_result(zse, err);
}

static const struct mgmt_handler spaghetti_mgmt_handlers[] = {
	[SPAGHETTI_MGMT_ID_STATUS] = {
		.mh_read = status_read,
	},
	[SPAGHETTI_MGMT_ID_CONFIG] = {
		.mh_write = config_write,
	},
	[SPAGHETTI_MGMT_ID_WIFI_SET] = {
		.mh_write = wifi_set_write,
	},
	[SPAGHETTI_MGMT_ID_WIFI_REMOVE] = {
		.mh_write = wifi_remove_write,
	},
	[SPAGHETTI_MGMT_ID_BOOTSTRAP_KEY] = {
		.mh_write = bootstrap_key_write,
	},
	[SPAGHETTI_MGMT_ID_IMAGE] = {
		.mh_write = image_write,
	},
	[SPAGHETTI_MGMT_ID_IMAGE_CANCEL] = {
		.mh_write = image_cancel_write,
	},
};

static struct mgmt_group spaghetti_mgmt_group = {
	.mg_handlers = spaghetti_mgmt_handlers,
	.mg_handlers_count = ARRAY_SIZE(spaghetti_mgmt_handlers),
	.mg_group_id = SPAGHETTI_MGMT_GROUP_ID,
};

static void spaghetti_mgmt_register(void)
{
	k_work_init_delayable(&reboot_work, reboot_handler);
	mgmt_register_group(&spaghetti_mgmt_group);
}

MCUMGR_HANDLER_DEFINE(spaghetti_mgmt, spaghetti_mgmt_register);
