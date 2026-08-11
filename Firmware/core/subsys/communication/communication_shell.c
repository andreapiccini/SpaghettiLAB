#include "communication_internal.h"

#include <errno.h>
#include <stdbool.h>
#include <stddef.h>
#include <stdint.h>
#include <string.h>

#include <zephyr/shell/shell.h>
#include <zephyr/sys/atomic.h>
#include <zephyr/sys/util.h>

#include <spaghetti/wifi_profiles.h>

static atomic_t next_correlation_id;

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
	shell_print(shell, "correlation=%u status=0 core=%u ports=%u modules=%u",
		    response.correlation_id, status.core_state, status.port_count,
		    status.module_count);
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
	spaghetti_subcommands,
	SHELL_CMD(status, NULL, "Show Core, Port, and Module status", cmd_status),
	SHELL_CMD(apply, NULL, "Submit a hex-encoded Config payload", cmd_apply),
	SHELL_CMD(wifi, &spaghetti_wifi_subcommands,
		  "Manage encrypted Wi-Fi profiles", NULL),
	SHELL_SUBCMD_SET_END
);

SHELL_CMD_REGISTER(spaghetti, &spaghetti_subcommands,
		   "Spaghetti LAB commands", NULL);

int spaghetti_communication_shell_init(void)
{
	atomic_set(&next_correlation_id, 1);
	return 0;
}
