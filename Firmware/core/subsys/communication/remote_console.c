#include <spaghetti/remote_console.h>

#include <errno.h>
#include <stdbool.h>
#include <stddef.h>
#include <stdint.h>

#include <zephyr/kernel.h>
#include <zephyr/logging/log.h>

#include <spaghetti/maintenance_link.h>

#include "remote_console_internal.h"

LOG_MODULE_REGISTER(spaghetti_remote_console,
		    CONFIG_SPAGHETTI_REMOTE_CONSOLE_LOG_LEVEL);

struct spaghetti_remote_console_context {
	enum spaghetti_remote_console_state state;
	bool initialized;
	int last_error;
};

static struct spaghetti_remote_console_context context;
K_MUTEX_DEFINE(remote_console_lock);

int spaghetti_remote_console_init(void)
{
	bool credentials_present;
	int err = k_mutex_lock(&remote_console_lock, K_FOREVER);

	if (err < 0) {
		return err;
	}
	if (context.initialized) {
		err = -EALREADY;
		goto unlock;
	}
	err = spaghetti_remote_console_backend_init();
	if (err < 0) {
		goto failed;
	}
	err = spaghetti_remote_console_backend_has_credentials(
		&credentials_present);
	if (err == -EBADMSG) {
		LOG_WRN("invalid remote-console credential removed");
		err = spaghetti_remote_console_backend_clear_credentials();
		if (err == -ENOENT) {
			err = 0;
		}
		credentials_present = false;
	}
	if (err < 0) {
		goto failed;
	}
	context.initialized = true;
	context.last_error = 0;
	if (!credentials_present) {
		context.state = SPAGHETTI_REMOTE_CONSOLE_DISABLED;
		LOG_INF("ready: enabled=0");
		goto unlock;
	}
	err = spaghetti_remote_console_backend_open();
	if (err < 0) {
		goto failed;
	}
	context.state = SPAGHETTI_REMOTE_CONSOLE_LISTENING;
	LOG_INF("ready: enabled=1 port=%u",
		CONFIG_SPAGHETTI_REMOTE_CONSOLE_PORT);
	goto unlock;

failed:
	context.state = SPAGHETTI_REMOTE_CONSOLE_ERROR;
	context.last_error = err;
unlock:
	k_mutex_unlock(&remote_console_lock);
	return err;
}

int spaghetti_remote_console_set_credentials(
	const uint8_t *psk, size_t psk_size,
	const uint8_t *identity, size_t identity_size)
{
	if ((psk == NULL) ||
	    (psk_size != SPAGHETTI_REMOTE_CONSOLE_PSK_SIZE) ||
	    (identity == NULL) || (identity_size == 0U) ||
	    (identity_size > SPAGHETTI_REMOTE_CONSOLE_IDENTITY_MAX_SIZE)) {
		return -EINVAL;
	}
	if (spaghetti_maintenance_link_get_state() !=
	    SPAGHETTI_MAINTENANCE_LINK_ACTIVE) {
		return -EACCES;
	}

	return spaghetti_remote_console_backend_set_credentials(
		psk, psk_size, identity, identity_size);
}

int spaghetti_remote_console_clear_credentials(void)
{
	int err;

	if (spaghetti_maintenance_link_get_state() !=
	    SPAGHETTI_MAINTENANCE_LINK_ACTIVE) {
		return -EACCES;
	}
	err = spaghetti_remote_console_backend_clear_credentials();
	return err;
}

int spaghetti_remote_console_get_status(
	struct spaghetti_remote_console_status *out)
{
	bool credentials_present;
	int err;

	if (out == NULL) {
		return -EINVAL;
	}
	err = k_mutex_lock(&remote_console_lock, K_FOREVER);
	if (err < 0) {
		return err;
	}
	err = spaghetti_remote_console_backend_has_credentials(
		&credentials_present);
	if (err == 0) {
		*out = (struct spaghetti_remote_console_status) {
			.state = context.state,
			.port = CONFIG_SPAGHETTI_REMOTE_CONSOLE_PORT,
			.credentials_present = credentials_present,
			.client_connected =
				spaghetti_remote_console_backend_client_connected(),
			.dropped_log_count =
				spaghetti_remote_console_backend_dropped_logs(),
			.last_error = context.last_error,
		};
	}
	k_mutex_unlock(&remote_console_lock);
	return err;
}
