#include <spaghetti/ota.h>

#include <errno.h>
#include <stdbool.h>
#include <stdint.h>

#include <zephyr/kernel.h>
#include <zephyr/logging/log.h>

#include <spaghetti/config.h>
#include <spaghetti/maintenance_link.h>
#include <spaghetti/storage.h>
#include <spaghetti/update.h>

#include "ota_internal.h"

LOG_MODULE_REGISTER(spaghetti_ota, CONFIG_SPAGHETTI_OTA_LOG_LEVEL);

struct spaghetti_ota_context {
	enum spaghetti_ota_state state;
	struct k_work_delayable timeout_work;
	struct k_work_delayable deferred_cancel_work;
	bool initialized;
	int last_error;
};

static struct spaghetti_ota_context context;
static struct k_work_q ota_work_queue;
K_THREAD_STACK_DEFINE(ota_work_stack, CONFIG_SPAGHETTI_OTA_WORK_STACK_SIZE);
K_MUTEX_DEFINE(ota_lock);

static int close_locked(bool discard_candidate)
{
	int first_error = spaghetti_ota_backend_close();

	if ((first_error == -EALREADY) || (first_error == -EACCES)) {
		first_error = 0;
	}
	if (discard_candidate) {
		const int update_error = spaghetti_update_cancel();

		if ((update_error < 0) && (update_error != -EALREADY) &&
		    (first_error == 0)) {
			first_error = update_error;
		}
	}

	context.state = (first_error == 0) ?
		SPAGHETTI_OTA_CLOSED : SPAGHETTI_OTA_ERROR;
	context.last_error = first_error;
	return first_error;
}

static void timeout_handler(struct k_work *work)
{
	ARG_UNUSED(work);
	(void)k_mutex_lock(&ota_lock, K_FOREVER);
	if (context.state == SPAGHETTI_OTA_ARMED) {
		const int err = close_locked(true);

		if (err < 0) {
			LOG_ERR("timeout cleanup failed: err=%d", err);
		} else {
			LOG_WRN("OTA window expired; listener closed");
		}
	}
	k_mutex_unlock(&ota_lock);
}

static void deferred_cancel_handler(struct k_work *work)
{
	ARG_UNUSED(work);
	(void)spaghetti_ota_cancel();
}

static int arm_locked(uint32_t timeout_ms)
{
	bool credentials_present;
	int err;

	if (context.state == SPAGHETTI_OTA_ARMED) {
		return -EALREADY;
	}
	err = spaghetti_ota_backend_has_credentials(&credentials_present);
	if (err < 0) {
		return err;
	}
	if (!credentials_present) {
		return -ENOENT;
	}

	err = spaghetti_update_arm(timeout_ms);
	if (err < 0) {
		return err;
	}
	err = spaghetti_ota_backend_open();
	if (err < 0) {
		(void)spaghetti_update_cancel();
		context.state = SPAGHETTI_OTA_ERROR;
		context.last_error = err;
		return err;
	}

	context.state = SPAGHETTI_OTA_ARMED;
	context.last_error = 0;
	(void)k_work_reschedule_for_queue(
		&ota_work_queue, &context.timeout_work, K_MSEC(timeout_ms));
	LOG_INF("window open: port=%u timeout_ms=%u",
		CONFIG_SPAGHETTI_OTA_PORT, timeout_ms);
	return 0;
}

int spaghetti_ota_init(void)
{
	uint32_t pending_timeout_ms;
	int err = k_mutex_lock(&ota_lock, K_FOREVER);

	if (err < 0) {
		return err;
	}
	if (context.initialized) {
		err = -EALREADY;
		goto unlock;
	}

	err = spaghetti_ota_backend_init();
	if (err < 0) {
		goto failed;
	}
	k_work_init_delayable(&context.timeout_work, timeout_handler);
	k_work_init_delayable(&context.deferred_cancel_work,
			      deferred_cancel_handler);
	k_work_queue_start(&ota_work_queue, ota_work_stack,
			   K_THREAD_STACK_SIZEOF(ota_work_stack),
			   CONFIG_SPAGHETTI_OTA_WORK_PRIORITY, NULL);
	(void)k_thread_name_set(&ota_work_queue.thread, "spaghetti_ota");
	context.state = SPAGHETTI_OTA_CLOSED;
	context.initialized = true;
	context.last_error = 0;

	err = spaghetti_ota_backend_consume_request(&pending_timeout_ms);
	if (err == -ENOENT) {
		err = 0;
	} else if (err == -EBADMSG) {
		LOG_WRN("invalid OTA credentials removed");
		err = spaghetti_ota_backend_clear_credentials();
		if (err == -ENOENT) {
			err = 0;
		}
	} else if (err == 0) {
		err = arm_locked(pending_timeout_ms);
	}
	if (err < 0) {
		goto failed;
	}
	LOG_INF("ready: listener=%s",
		(context.state == SPAGHETTI_OTA_ARMED) ? "open" : "closed");
	goto unlock;

failed:
	context.state = SPAGHETTI_OTA_ERROR;
	context.last_error = err;
unlock:
	k_mutex_unlock(&ota_lock);
	return err;
}

int spaghetti_ota_set_credentials(
	const uint8_t *psk, size_t psk_size,
	const uint8_t *identity, size_t identity_size)
{
	if ((psk == NULL) || (psk_size != SPAGHETTI_OTA_PSK_SIZE) ||
	    (identity == NULL) || (identity_size == 0U) ||
	    (identity_size > SPAGHETTI_OTA_IDENTITY_MAX_SIZE)) {
		return -EINVAL;
	}
	if (spaghetti_maintenance_link_get_state() !=
	    SPAGHETTI_MAINTENANCE_LINK_ACTIVE) {
		return -EACCES;
	}

	return spaghetti_ota_backend_set_credentials(
		psk, psk_size, identity, identity_size);
}

int spaghetti_ota_clear_credentials(void)
{
	int err;

	if (spaghetti_maintenance_link_get_state() !=
	    SPAGHETTI_MAINTENANCE_LINK_ACTIVE) {
		return -EACCES;
	}

	err = spaghetti_ota_backend_clear_credentials();
	return err;
}

int spaghetti_ota_request_once(uint32_t timeout_ms)
{
	struct spaghetti_config stored_config;
	bool credentials_present;
	int err;

	if ((timeout_ms == 0U) ||
	    (timeout_ms > CONFIG_SPAGHETTI_OTA_MAX_WINDOW_MS)) {
		return -EINVAL;
	}
	if (spaghetti_maintenance_link_get_state() !=
	    SPAGHETTI_MAINTENANCE_LINK_ACTIVE) {
		return -EACCES;
	}
	err = spaghetti_storage_read_config(&stored_config);
	if (err < 0) {
		return (err == -ENOENT) ? -ENOENT : err;
	}
	err = spaghetti_ota_backend_has_credentials(&credentials_present);
	if (err < 0) {
		return err;
	}
	if (!credentials_present) {
		return -ENOENT;
	}

	return spaghetti_ota_backend_request_once(timeout_ms);
}

int spaghetti_ota_arm(uint32_t timeout_ms)
{
	int err;

	if ((timeout_ms == 0U) ||
	    (timeout_ms > CONFIG_SPAGHETTI_OTA_MAX_WINDOW_MS)) {
		return -EINVAL;
	}
	err = k_mutex_lock(&ota_lock, K_FOREVER);
	if (err < 0) {
		return err;
	}
	if (!context.initialized) {
		err = -EACCES;
	} else {
		err = arm_locked(timeout_ms);
	}
	k_mutex_unlock(&ota_lock);
	return err;
}

int spaghetti_ota_cancel(void)
{
	int err = k_mutex_lock(&ota_lock, K_FOREVER);

	if (err < 0) {
		return err;
	}
	if (!context.initialized) {
		err = -EACCES;
	} else if (context.state == SPAGHETTI_OTA_CLOSED) {
		err = -EALREADY;
	} else {
		(void)k_work_cancel_delayable(&context.timeout_work);
		err = close_locked(true);
	}
	k_mutex_unlock(&ota_lock);
	return err;
}

bool spaghetti_ota_is_transport(const struct smp_transport *transport)
{
	return (transport != NULL) &&
	       spaghetti_ota_backend_is_transport(transport);
}

int spaghetti_ota_get_status(struct spaghetti_ota_status *out)
{
	bool credentials_present = false;
	int err;

	if (out == NULL) {
		return -EINVAL;
	}
	err = k_mutex_lock(&ota_lock, K_FOREVER);
	if (err < 0) {
		return err;
	}
	err = spaghetti_ota_backend_has_credentials(&credentials_present);
	if (err == 0) {
		*out = (struct spaghetti_ota_status) {
			.state = context.state,
			.port = CONFIG_SPAGHETTI_OTA_PORT,
			.credentials_present = credentials_present,
			.last_error = context.last_error,
		};
	}
	k_mutex_unlock(&ota_lock);
	return err;
}

void spaghetti_ota_cancel_after_response(void)
{
	if (context.initialized) {
		(void)k_work_reschedule_for_queue(
			&ota_work_queue, &context.deferred_cancel_work,
			K_MSEC(CONFIG_SPAGHETTI_MAINTENANCE_REBOOT_DELAY_MS));
	}
}

void spaghetti_ota_prepare_reboot(void)
{
	(void)k_mutex_lock(&ota_lock, K_FOREVER);
	if (context.initialized) {
		(void)k_work_cancel_delayable(&context.timeout_work);
		(void)k_work_cancel_delayable(&context.deferred_cancel_work);
		(void)close_locked(false);
	}
	k_mutex_unlock(&ota_lock);
}

void spaghetti_ota_network_lost(void)
{
	spaghetti_ota_cancel_after_response();
}
