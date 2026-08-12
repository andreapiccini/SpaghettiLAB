#include "communication_internal.h"

#include <errno.h>
#include <stdbool.h>
#include <stddef.h>
#include <stdint.h>
#include <string.h>

#include <zephyr/kernel.h>
#include <zephyr/shell/shell.h>
#include <zephyr/sys/atomic.h>
#include <zephyr/sys/reboot.h>
#include <zephyr/sys/util.h>

#include <spaghetti/core.h>
#include <spaghetti/config.h>
#include <spaghetti/access_control.h>
#include <spaghetti/maintenance_link.h>
#include <spaghetti/remote_console.h>
#include <spaghetti/storage.h>
#include <spaghetti/wifi_profiles.h>

static atomic_t next_correlation_id;
static struct k_work_delayable maintenance_reboot_work;

static void wipe_sensitive(void *data, size_t data_size)
{
	volatile uint8_t *bytes = data;

	for (size_t byte_idx = 0U; byte_idx < data_size; ++byte_idx) {
		bytes[byte_idx] = 0U;
	}
}

static const char *wifi_security_name(enum spaghetti_wifi_security security)
{
	return (security == SPAGHETTI_WIFI_SECURITY_OPEN) ? "open" : "wpa2";
}

static const char *wifi_state_name(enum spaghetti_wifi_profiles_state state)
{
	switch (state) {
	case SPAGHETTI_WIFI_PROFILES_UNINITIALIZED:
		return "uninitialized";
	case SPAGHETTI_WIFI_PROFILES_IDLE:
		return "idle";
	case SPAGHETTI_WIFI_PROFILES_SCANNING:
		return "scanning";
	case SPAGHETTI_WIFI_PROFILES_CONNECTING:
		return "connecting";
	case SPAGHETTI_WIFI_PROFILES_CONNECTED:
		return "connected";
	case SPAGHETTI_WIFI_PROFILES_ERROR:
		return "error";
	default:
		return "unknown";
	}
}

static const char *core_mode_name(uint8_t mode)
{
	switch ((enum spaghetti_core_mode)mode) {
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

static int hex_nibble(char character, uint8_t *out)
{
	if (out == NULL) {
		return -EINVAL;
	}
	if ((character >= '0') && (character <= '9')) {
		*out = (uint8_t)(character - '0');
		return 0;
	}
	if ((character >= 'a') && (character <= 'f')) {
		*out = (uint8_t)(character - 'a' + 10);
		return 0;
	}
	if ((character >= 'A') && (character <= 'F')) {
		*out = (uint8_t)(character - 'A' + 10);
		return 0;
	}

	return -EINVAL;
}

int spaghetti_communication_shell_decode_hex(
	const char *hex,
	struct spaghetti_request *request)
{
	struct spaghetti_request decoded = {0};
	size_t hex_size;

	if ((hex == NULL) || (request == NULL)) {
		return -EINVAL;
	}

	hex_size = strlen(hex);
	if ((hex_size == 0U) || ((hex_size % 2U) != 0U)) {
		return -EINVAL;
	}
	if (hex_size > (SPAGHETTI_COMM_PAYLOAD_MAX * 2U)) {
		return -EMSGSIZE;
	}

	decoded.correlation_id = request->correlation_id;
	decoded.type = SPAGHETTI_REQUEST_SET_CONFIG;
	decoded.payload_size = hex_size / 2U;
	for (size_t byte_idx = 0U; byte_idx < decoded.payload_size; ++byte_idx) {
		uint8_t high;
		uint8_t low;
		int err = hex_nibble(hex[byte_idx * 2U], &high);

		if (err < 0) {
			return err;
		}
		err = hex_nibble(hex[(byte_idx * 2U) + 1U], &low);
		if (err < 0) {
			return err;
		}
		decoded.payload[byte_idx] = (uint8_t)((high << 4U) | low);
	}

	*request = decoded;
	return 0;
}

static uint32_t allocate_correlation_id(void)
{
	return (uint32_t)atomic_inc(&next_correlation_id);
}

static void maintenance_reboot_handler(struct k_work *work)
{
	ARG_UNUSED(work);
	sys_reboot(SYS_REBOOT_WARM);
}

static const char *remote_console_state_name(
	enum spaghetti_remote_console_state state)
{
	switch (state) {
	case SPAGHETTI_REMOTE_CONSOLE_UNINITIALIZED:
		return "uninitialized";
	case SPAGHETTI_REMOTE_CONSOLE_DISABLED:
		return "disabled";
	case SPAGHETTI_REMOTE_CONSOLE_LISTENING:
		return "listening";
	case SPAGHETTI_REMOTE_CONSOLE_ERROR:
		return "error";
	default:
		return "unknown";
	}
}

static int cmd_status(const struct shell *shell, size_t argc, char **argv)
{
	const struct spaghetti_request request = {
		.correlation_id = allocate_correlation_id(),
		.type = SPAGHETTI_REQUEST_GET_STATUS,
	};
	struct spaghetti_communication_status_payload status = {0};
	struct spaghetti_response response;
	int err;

	ARG_UNUSED(argv);
	if (argc != 1U) {
		shell_error(shell, "usage: spaghetti status");
		return -EINVAL;
	}

	err = spaghetti_communication_handle_request(&request, &response);
	if (err < 0) {
		shell_error(shell, "dispatch failed: %d", err);
		return err;
	}
	if (response.status < 0) {
		shell_error(shell, "correlation=%u status=%d",
			    response.correlation_id, response.status);
		return 0;
	}
	if ((response.payload_size <
	     offsetof(struct spaghetti_communication_status_payload, modules)) ||
	    (response.payload_size > sizeof(status))) {
		shell_error(shell, "invalid status payload: %u",
			    (uint32_t)response.payload_size);
		return -EBADMSG;
	}

	memcpy(&status, response.payload, response.payload_size);
	shell_print(shell,
		    "correlation=%u status=0 core=%u mode=%s image=%s "
		    "slot=%u confirmed=%u version=%s ports=%u modules=%u",
		    response.correlation_id, status.core_state,
		    core_mode_name(status.core_mode),
		    (status.image_state == SPAGHETTI_CORE_IMAGE_TRIAL) ?
			    "trial" : "confirmed",
		    status.active_slot, status.image_confirmed, status.version,
		    status.port_count, status.module_count);
	for (size_t module_idx = 0U; module_idx < status.module_count;
	     ++module_idx) {
		const struct spaghetti_communication_module_status *module =
			&status.modules[module_idx];

		shell_print(shell,
			    "port=%u key=%u id=%u type=%s endpoint=%u:%u state=%u",
			    module->port_id, module->key, module->runtime_id,
			    module->type_id, module->endpoint_kind,
			    module->endpoint_value, module->state);
	}

	return 0;
}

static int cmd_apply(const struct shell *shell, size_t argc, char **argv)
{
	struct spaghetti_request request = {
		.correlation_id = allocate_correlation_id(),
	};
	struct spaghetti_response response;
	int err;

	if (argc != 2U) {
		shell_error(shell, "usage: spaghetti apply <hex>");
		return -EINVAL;
	}

	err = spaghetti_communication_shell_decode_hex(argv[1], &request);
	if (err < 0) {
		shell_error(shell, "invalid hex payload: %d", err);
		return err;
	}

	err = spaghetti_communication_handle_request(&request, &response);
	if (err < 0) {
		shell_error(shell, "dispatch failed: %d", err);
		return err;
	}

	shell_print(shell, "correlation=%u status=%d",
		    response.correlation_id, response.status);
	return 0;
}

static int cmd_wifi_add(const struct shell *shell, size_t argc, char **argv)
{
	struct spaghetti_wifi_profile_config profile = {0};
	size_t ssid_size;
	int err;

	if (argc != 3U) {
		shell_error(shell, "usage: spaghetti wifi add <ssid> <open|wpa2>");
		return -EINVAL;
	}

	ssid_size = strlen(argv[1]);
	if ((ssid_size == 0U) || (ssid_size >= sizeof(profile.ssid))) {
		shell_error(shell, "SSID must contain 1 to 32 bytes");
		return -EINVAL;
	}
	memcpy(profile.ssid, argv[1], ssid_size + 1U);

	if (strcmp(argv[2], "open") == 0) {
		profile.security = SPAGHETTI_WIFI_SECURITY_OPEN;
	} else if (strcmp(argv[2], "wpa2") == 0) {
		profile.security = SPAGHETTI_WIFI_SECURITY_WPA2_PSK;
		shell_print(shell, "Password (input is hidden):");
		(void)shell_obscure_set(shell, true);
		err = shell_readline(
			shell, profile.passphrase, sizeof(profile.passphrase),
			K_SECONDS(
				CONFIG_SPAGHETTI_WIFI_PASSWORD_INPUT_TIMEOUT_SECONDS));
		(void)shell_obscure_set(shell, false);
		shell_print(shell, "");
		if (err < 0) {
			wipe_sensitive(&profile, sizeof(profile));
			shell_error(shell, "password input failed: %d", err);
			return err;
		}
		profile.passphrase_size = (size_t)err;
	} else {
		shell_error(shell, "security must be open or wpa2");
		return -EINVAL;
	}

	err = spaghetti_wifi_profiles_set(&profile);
	wipe_sensitive(&profile, sizeof(profile));
	if (err < 0) {
		shell_error(shell, "profile was not saved: %d", err);
		return err;
	}

	shell_print(shell, "Wi-Fi profile saved");
	return 0;
}

static int cmd_wifi_list(const struct shell *shell, size_t argc, char **argv)
{
	struct spaghetti_wifi_profile_summary
		profiles[CONFIG_SPAGHETTI_WIFI_PROFILE_MAX_COUNT];
	struct spaghetti_wifi_profiles_status status;
	size_t profile_count = 0U;
	int err;

	ARG_UNUSED(argv);
	if (argc != 1U) {
		shell_error(shell, "usage: spaghetti wifi list");
		return -EINVAL;
	}

	err = spaghetti_wifi_profiles_list(
		profiles, ARRAY_SIZE(profiles), &profile_count);
	if (err < 0) {
		shell_error(shell, "profile list failed: %d", err);
		return err;
	}
	err = spaghetti_wifi_profiles_get_status(&status);
	if (err < 0) {
		shell_error(shell, "status failed: %d", err);
		return err;
	}

	shell_print(shell, "state=%s active=%s profiles=%u last_error=%d",
		    wifi_state_name(status.state),
		    (status.active_ssid[0] != '\0') ? status.active_ssid : "none",
		    (uint32_t)profile_count, status.last_error);
	for (size_t profile_idx = 0U; profile_idx < profile_count;
	     ++profile_idx) {
		const struct spaghetti_wifi_profile_summary *profile =
			&profiles[profile_idx];

		if (profile->visible) {
			shell_print(shell,
				    "ssid=%s security=%s preferred=%u visible=1 rssi=%d dBm",
				    profile->ssid,
				    wifi_security_name(profile->security),
				    profile->preferred ? 1U : 0U,
				    profile->rssi_dbm);
		} else {
			shell_print(shell,
				    "ssid=%s security=%s preferred=%u visible=0",
				    profile->ssid,
				    wifi_security_name(profile->security),
				    profile->preferred ? 1U : 0U);
		}
	}

	return 0;
}

static int cmd_wifi_prefer(const struct shell *shell, size_t argc, char **argv)
{
	int err;

	if (argc != 2U) {
		shell_error(shell, "usage: spaghetti wifi prefer <ssid>");
		return -EINVAL;
	}

	err = spaghetti_wifi_profiles_set_preferred(argv[1]);
	if (err < 0) {
		shell_error(shell, "preferred network was not changed: %d", err);
		return err;
	}

	shell_print(shell, "Preferred network updated");
	return 0;
}

static int cmd_wifi_unprefer(const struct shell *shell, size_t argc,
			    char **argv)
{
	int err;

	ARG_UNUSED(argv);
	if (argc != 1U) {
		shell_error(shell, "usage: spaghetti wifi unprefer");
		return -EINVAL;
	}

	err = spaghetti_wifi_profiles_clear_preferred();
	if (err < 0) {
		shell_error(shell, "preferred network was not cleared: %d", err);
		return err;
	}

	shell_print(shell, "Preferred network cleared");
	return 0;
}

static int cmd_wifi_remove(const struct shell *shell, size_t argc, char **argv)
{
	int err;

	if (argc != 2U) {
		shell_error(shell, "usage: spaghetti wifi remove <ssid>");
		return -EINVAL;
	}

	err = spaghetti_wifi_profiles_remove(argv[1]);
	if (err < 0) {
		shell_error(shell, "profile was not removed: %d", err);
		return err;
	}

	shell_print(shell, "Wi-Fi profile removed");
	return 0;
}

static int cmd_wifi_connect(const struct shell *shell, size_t argc, char **argv)
{
	int err;

	ARG_UNUSED(argv);
	if (argc != 1U) {
		shell_error(shell, "usage: spaghetti wifi connect");
		return -EINVAL;
	}

	err = spaghetti_wifi_profiles_request_connect();
	if (err < 0) {
		shell_error(shell, "connection request failed: %d", err);
		return err;
	}

	shell_print(shell, "Wi-Fi reselection requested");
	return 0;
}

static int cmd_maintenance_reboot(
	const struct shell *shell, size_t argc, char **argv)
{
	struct spaghetti_core_info info;
	int err;

	ARG_UNUSED(argv);
	if (argc != 1U) {
		shell_error(shell, "usage: spaghetti maintenance reboot");
		return -EINVAL;
	}
	err = spaghetti_core_get_info(&info);
	if (err < 0) {
		shell_error(shell, "Core status failed: %d", err);
		return err;
	}
	if (info.mode != SPAGHETTI_CORE_MODE_NORMAL) {
		shell_error(shell, "Core is already outside Normal mode");
		return -EALREADY;
	}
	err = spaghetti_storage_request_maintenance_once();
	if (err < 0) {
		shell_error(shell, "Maintenance request failed: %d", err);
		return err;
	}
	shell_print(shell, "Rebooting into Maintenance mode");
	(void)k_work_reschedule(
		&maintenance_reboot_work,
		K_MSEC(CONFIG_SPAGHETTI_MAINTENANCE_REBOOT_DELAY_MS));
	return 0;
}

static int cmd_maintenance_finish(
	const struct shell *shell, size_t argc, char **argv)
{
	const struct spaghetti_config safe_empty_config = {
		.version = SPAGHETTI_CONFIG_VERSION,
		.connectivity_policy = SPAGHETTI_CONNECTIVITY_ONLINE,
		.energy_policy = {
			.ble_availability = SPAGHETTI_BLE_ADVERTISING,
		},
	};
	struct spaghetti_config stored_config;
	bool config_replaced = false;
	int err;

	ARG_UNUSED(argv);
	if (argc != 1U) {
		shell_error(shell, "usage: spaghetti maintenance finish");
		return -EINVAL;
	}
	if (spaghetti_maintenance_link_get_state() !=
	    SPAGHETTI_MAINTENANCE_LINK_ACTIVE) {
		shell_error(shell, "Local Maintenance is not active");
		return -EACCES;
	}

	err = spaghetti_storage_read_config(&stored_config);
	if (err == 0) {
		err = spaghetti_config_validate(&stored_config, NULL);
	}
	if ((err == -ENOENT) || (err == -EBADMSG) || (err == -EINVAL) ||
	    (err == -ENOTSUP) || (err == -EEXIST) ||
	    (err == -EADDRINUSE) || (err == -ERANGE)) {
		err = spaghetti_storage_write_config(&safe_empty_config);
		config_replaced = err == 0;
	}
	if (err < 0) {
		shell_error(shell, "Normal-mode Config was not saved: %d", err);
		return err;
	}

	shell_print(shell, config_replaced ?
		"Safe empty Config saved; rebooting into Normal mode" :
		"Existing Config preserved; rebooting into Normal mode");
	(void)k_work_reschedule(
		&maintenance_reboot_work,
		K_MSEC(CONFIG_SPAGHETTI_MAINTENANCE_REBOOT_DELAY_MS));
	return 0;
}

static int cmd_remote_console_provision(
	const struct shell *shell, size_t argc, char **argv)
{
	char psk_hex[(SPAGHETTI_REMOTE_CONSOLE_PSK_SIZE * 2U) + 1U] = {0};
	uint8_t psk[SPAGHETTI_REMOTE_CONSOLE_PSK_SIZE] = {0};
	const size_t identity_size = (argc == 2U) ? strlen(argv[1]) : 0U;
	int err;

	if ((argc != 2U) || (identity_size == 0U) ||
	    (identity_size > SPAGHETTI_REMOTE_CONSOLE_IDENTITY_MAX_SIZE)) {
		shell_error(shell,
			"usage: spaghetti remote provision <identity-1-to-32-bytes>");
		return -EINVAL;
	}
	shell_print(shell, "PSK (64 hex digits; input is hidden):");
	(void)shell_obscure_set(shell, true);
	err = shell_readline(
		shell, (uint8_t *)psk_hex, sizeof(psk_hex),
		K_SECONDS(CONFIG_SPAGHETTI_REMOTE_CONSOLE_CREDENTIAL_INPUT_TIMEOUT_SECONDS));
	(void)shell_obscure_set(shell, false);
	shell_print(shell, "");
	if (err < 0) {
		wipe_sensitive(psk_hex, sizeof(psk_hex));
		shell_error(shell, "PSK input failed: %d", err);
		return err;
	}
	if (err != (int)(SPAGHETTI_REMOTE_CONSOLE_PSK_SIZE * 2U)) {
		wipe_sensitive(psk_hex, sizeof(psk_hex));
		shell_error(shell,
			"PSK must contain exactly 64 hex digits; received=%d", err);
		return -EINVAL;
	}

	for (size_t byte_idx = 0U; byte_idx < sizeof(psk); ++byte_idx) {
		uint8_t high;
		uint8_t low;

		err = hex_nibble(psk_hex[byte_idx * 2U], &high);
		if (err == 0) {
			err = hex_nibble(psk_hex[(byte_idx * 2U) + 1U], &low);
		}
		if (err < 0) {
			wipe_sensitive(psk, sizeof(psk));
			wipe_sensitive(psk_hex, sizeof(psk_hex));
			shell_error(shell, "PSK contains a non-hexadecimal character");
			return err;
		}
		psk[byte_idx] = (uint8_t)((high << 4U) | low);
	}
	err = spaghetti_remote_console_set_credentials(
		psk, sizeof(psk), (const uint8_t *)argv[1], identity_size,
		SPAGHETTI_PRINCIPAL_MAINTENANCE_ID);
	wipe_sensitive(psk, sizeof(psk));
	wipe_sensitive(psk_hex, sizeof(psk_hex));
	if (err < 0) {
		shell_error(shell, "Remote-console credential was not saved: %d", err);
		return err;
	}
	shell_print(shell, "Remote-console credential saved");
	return 0;
}

static int cmd_remote_console_clear(
	const struct shell *shell, size_t argc, char **argv)
{
	int err;

	ARG_UNUSED(argv);
	if (argc != 1U) {
		shell_error(shell, "usage: spaghetti remote clear");
		return -EINVAL;
	}
	err = spaghetti_remote_console_clear_credentials();
	if (err < 0) {
		shell_error(shell, "Remote-console credential was not cleared: %d", err);
		return err;
	}
	shell_print(shell, "Remote-console credential cleared");
	return 0;
}

static int cmd_remote_console_status(
	const struct shell *shell, size_t argc, char **argv)
{
	struct spaghetti_remote_console_status status;
	int err;

	ARG_UNUSED(argv);
	if (argc != 1U) {
		shell_error(shell, "usage: spaghetti remote status");
		return -EINVAL;
	}
	err = spaghetti_remote_console_get_status(&status);
	if (err < 0) {
		shell_error(shell, "Remote-console status failed: %d", err);
		return err;
	}
	shell_print(shell,
		"state=%s credentials=%u client=%u port=%u dropped_logs=%u last_error=%d",
		remote_console_state_name(status.state),
		status.credentials_present ? 1U : 0U,
		status.client_connected ? 1U : 0U, status.port,
		status.dropped_log_count, status.last_error);
	return 0;
}

SHELL_STATIC_SUBCMD_SET_CREATE(
	spaghetti_wifi_subcommands,
	SHELL_CMD(add, NULL, "Save a Wi-Fi profile; password is prompted", cmd_wifi_add),
	SHELL_CMD(unprefer, NULL, "Clear the preferred SSID", cmd_wifi_unprefer),
	SHELL_CMD(list, NULL, "List Wi-Fi profiles without passwords", cmd_wifi_list),
	SHELL_CMD(prefer, NULL, "Set a preferred SSID", cmd_wifi_prefer),
	SHELL_CMD(remove, NULL, "Delete one Wi-Fi profile", cmd_wifi_remove),
	SHELL_CMD(connect, NULL, "Run connection selection now", cmd_wifi_connect),
	SHELL_SUBCMD_SET_END
);

SHELL_STATIC_SUBCMD_SET_CREATE(
	spaghetti_maintenance_subcommands,
	SHELL_CMD(reboot, NULL, "Reboot once into local Maintenance mode",
		  cmd_maintenance_reboot),
	SHELL_CMD(finish, NULL, "Save safe Config and enter Normal mode",
		  cmd_maintenance_finish),
	SHELL_SUBCMD_SET_END
);

SHELL_STATIC_SUBCMD_SET_CREATE(
	spaghetti_remote_subcommands,
	SHELL_CMD(provision, NULL, "Save the hidden remote-console PSK",
		  cmd_remote_console_provision),
	SHELL_CMD(clear, NULL, "Delete the remote-console credential",
		  cmd_remote_console_clear),
	SHELL_CMD(status, NULL, "Show remote-console state without secrets",
		  cmd_remote_console_status),
	SHELL_SUBCMD_SET_END
);

SHELL_STATIC_SUBCMD_SET_CREATE(
	spaghetti_subcommands,
	SHELL_CMD(status, NULL, "Show Core, Port, and Module status", cmd_status),
	SHELL_CMD(apply, NULL, "Submit a hex-encoded Config payload", cmd_apply),
	SHELL_CMD(wifi, &spaghetti_wifi_subcommands,
		  "Manage encrypted Wi-Fi profiles", NULL),
	SHELL_CMD(maintenance, &spaghetti_maintenance_subcommands,
		  "Enter local Maintenance mode", NULL),
	SHELL_CMD(remote, &spaghetti_remote_subcommands,
		  "Manage authenticated remote-console access", NULL),
	SHELL_SUBCMD_SET_END
);

SHELL_CMD_REGISTER(spaghetti, &spaghetti_subcommands,
		   "Spaghetti LAB commands", NULL);

int spaghetti_communication_shell_init(void)
{
	atomic_set(&next_correlation_id, 1);
	k_work_init_delayable(
		&maintenance_reboot_work, maintenance_reboot_handler);
	return 0;
}
