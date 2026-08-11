#include <spaghetti/update.h>

#include <errno.h>
#include <stdbool.h>
#include <stdint.h>

#include <zephyr/kernel.h>
#include <zephyr/logging/log.h>
#include <zephyr/sys/util.h>

#include "update_internal.h"

LOG_MODULE_REGISTER(spaghetti_update, CONFIG_SPAGHETTI_UPDATE_LOG_LEVEL);

struct spaghetti_update_context {
	struct spaghetti_update_status status;
	struct k_work_delayable timeout_work;
	int64_t deadline_ms;
	bool initialized;
};

static struct spaghetti_update_context context;
static struct k_work_q update_work_queue;
K_THREAD_STACK_DEFINE(update_work_stack, CONFIG_SPAGHETTI_UPDATE_WORK_STACK_SIZE);
K_MUTEX_DEFINE(update_lock);

static bool transport_is_valid(enum spaghetti_update_transport transport)
{
	return (transport == SPAGHETTI_UPDATE_TRANSPORT_UART) ||
	       (transport == SPAGHETTI_UPDATE_TRANSPORT_UDP);
}

static bool session_has_expired(void)
{
	return (context.deadline_ms > 0) &&
	       (k_uptime_get() >= context.deadline_ms);
}

static int discard_candidate_locked(int reason)
{
	int err = spaghetti_update_backend_cancel();

	if (err < 0) {
		context.status.state = SPAGHETTI_UPDATE_ERROR;
		context.status.last_error = err;
		return err;
	}

	context.status.state = SPAGHETTI_UPDATE_IDLE;
	context.status.transport = SPAGHETTI_UPDATE_TRANSPORT_NONE;
	context.status.timeout_remaining_ms = 0U;
	context.status.last_error = reason;
	context.deadline_ms = 0;
	return 0;
}

static void update_timeout_handler(struct k_work *work)
{
	ARG_UNUSED(work);
	(void)k_mutex_lock(&update_lock, K_FOREVER);
	if ((context.status.state == SPAGHETTI_UPDATE_ARMED) ||
	    (context.status.state == SPAGHETTI_UPDATE_RECEIVING)) {
		const int err = discard_candidate_locked(-ETIMEDOUT);

		if (err < 0) {
			LOG_ERR("timeout cleanup failed: err=%d", err);
		} else {
			LOG_WRN("update session timed out; secondary slot discarded");
		}
	}
	k_mutex_unlock(&update_lock);
}

int spaghetti_update_init(void)
{
	bool trial;
	int err = k_mutex_lock(&update_lock, K_FOREVER);

	if (err < 0) {
		return err;
	}
	if (context.initialized) {
		err = -EALREADY;
		goto unlock;
	}

	err = spaghetti_update_backend_is_trial(&trial);
	if (err < 0) {
		goto unlock;
	}

	k_work_init_delayable(&context.timeout_work, update_timeout_handler);
	k_work_queue_start(&update_work_queue, update_work_stack,
			   K_THREAD_STACK_SIZEOF(update_work_stack),
			   CONFIG_SPAGHETTI_UPDATE_WORK_PRIORITY, NULL);
	(void)k_thread_name_set(&update_work_queue.thread, "spaghetti_update");
	context.status = (struct spaghetti_update_status) {
		.state = trial ? SPAGHETTI_UPDATE_TRIAL_BOOT :
				 SPAGHETTI_UPDATE_IDLE,
		.transport = SPAGHETTI_UPDATE_TRANSPORT_NONE,
	};
	context.deadline_ms = 0;
	context.initialized = true;
	LOG_INF("ready: state=%s", trial ? "trial" : "idle");

unlock:
	k_mutex_unlock(&update_lock);
	return err;
}

int spaghetti_update_arm(uint32_t timeout_ms)
{
	int err;

	if (timeout_ms == 0U) {
		return -EINVAL;
	}

	err = k_mutex_lock(&update_lock, K_FOREVER);
	if (err < 0) {
		return err;
	}
	if (!context.initialized) {
		err = -EACCES;
		goto unlock;
	}

	switch (context.status.state) {
	case SPAGHETTI_UPDATE_IDLE:
		break;
	case SPAGHETTI_UPDATE_ARMED:
		err = -EALREADY;
		goto unlock;
	case SPAGHETTI_UPDATE_RECEIVING:
	case SPAGHETTI_UPDATE_VERIFYING:
	case SPAGHETTI_UPDATE_PENDING_REBOOT:
		err = -EBUSY;
		goto unlock;
	case SPAGHETTI_UPDATE_TRIAL_BOOT:
	case SPAGHETTI_UPDATE_ERROR:
	default:
		err = -EPERM;
		goto unlock;
	}

	context.status.state = SPAGHETTI_UPDATE_ARMED;
	context.status.transport = SPAGHETTI_UPDATE_TRANSPORT_NONE;
	context.status.timeout_remaining_ms = timeout_ms;
	context.status.last_error = 0;
	context.deadline_ms = k_uptime_get() + (int64_t)timeout_ms;
	(void)k_work_reschedule_for_queue(&update_work_queue,
					  &context.timeout_work,
					  K_MSEC(timeout_ms));
	err = 0;
	LOG_INF("armed: timeout_ms=%u", timeout_ms);

unlock:
	k_mutex_unlock(&update_lock);
	return err;
}

int spaghetti_update_begin(enum spaghetti_update_transport transport)
{
	int err;

	if (!transport_is_valid(transport)) {
		return -EINVAL;
	}

	err = k_mutex_lock(&update_lock, K_FOREVER);
	if (err < 0) {
		return err;
	}
	if (!context.initialized) {
		err = -EACCES;
		goto unlock;
	}
	if (context.status.state != SPAGHETTI_UPDATE_ARMED) {
		err = ((context.status.state == SPAGHETTI_UPDATE_RECEIVING) ||
		       (context.status.state == SPAGHETTI_UPDATE_VERIFYING) ||
		       (context.status.state == SPAGHETTI_UPDATE_PENDING_REBOOT)) ?
			      -EBUSY : -EPERM;
		goto unlock;
	}
	if (session_has_expired()) {
		(void)k_work_cancel_delayable(&context.timeout_work);
		err = discard_candidate_locked(-ETIMEDOUT);
		if (err == 0) {
			err = -ETIMEDOUT;
		}
		goto unlock;
	}

	err = spaghetti_update_backend_prepare();
	if (err < 0) {
		context.status.state = SPAGHETTI_UPDATE_ERROR;
		context.status.last_error = err;
		goto unlock;
	}

	context.status.state = SPAGHETTI_UPDATE_RECEIVING;
	context.status.transport = transport;
	context.status.last_error = 0;
	LOG_INF("receiving: transport=%u", (uint32_t)transport);
	err = 0;

unlock:
	k_mutex_unlock(&update_lock);
	return err;
}

int spaghetti_update_finish(void)
{
	int err = k_mutex_lock(&update_lock, K_FOREVER);

	if (err < 0) {
		return err;
	}
	if (!context.initialized) {
		err = -EACCES;
		goto unlock;
	}
	if (context.status.state != SPAGHETTI_UPDATE_RECEIVING) {
		err = -EPERM;
		goto unlock;
	}
	if (session_has_expired()) {
		(void)k_work_cancel_delayable(&context.timeout_work);
		err = discard_candidate_locked(-ETIMEDOUT);
		if (err == 0) {
			err = -ETIMEDOUT;
		}
		goto unlock;
	}

	(void)k_work_cancel_delayable(&context.timeout_work);
	context.status.state = SPAGHETTI_UPDATE_VERIFYING;
	err = spaghetti_update_backend_finalize_test();
	if (err < 0) {
		context.status.state = SPAGHETTI_UPDATE_ERROR;
		context.status.last_error = err;
		goto unlock;
	}

	context.status.state = SPAGHETTI_UPDATE_PENDING_REBOOT;
	context.status.timeout_remaining_ms = 0U;
	context.status.last_error = 0;
	context.deadline_ms = 0;
	LOG_INF("candidate ready: MCUboot test requested");
	err = 0;

unlock:
	k_mutex_unlock(&update_lock);
	return err;
}

int spaghetti_update_cancel(void)
{
	int err = k_mutex_lock(&update_lock, K_FOREVER);

	if (err < 0) {
		return err;
	}
	if (!context.initialized) {
		err = -EACCES;
		goto unlock;
	}
	if (context.status.state == SPAGHETTI_UPDATE_IDLE) {
		err = -EALREADY;
		goto unlock;
	}
	if (context.status.state == SPAGHETTI_UPDATE_TRIAL_BOOT) {
		err = -EPERM;
		goto unlock;
	}
	if (context.status.state == SPAGHETTI_UPDATE_VERIFYING) {
		err = -EBUSY;
		goto unlock;
	}

	(void)k_work_cancel_delayable(&context.timeout_work);
	err = discard_candidate_locked(0);
	if (err == 0) {
		LOG_INF("update cancelled; secondary slot discarded");
	}

unlock:
	k_mutex_unlock(&update_lock);
	return err;
}

int spaghetti_update_get_status(struct spaghetti_update_status *out)
{
	struct spaghetti_update_status snapshot;
	int64_t remaining;
	int err;

	if (out == NULL) {
		return -EINVAL;
	}

	err = k_mutex_lock(&update_lock, K_FOREVER);
	if (err < 0) {
		return err;
	}
	if (!context.initialized) {
		k_mutex_unlock(&update_lock);
		return -EACCES;
	}

	snapshot = context.status;
	if ((snapshot.state == SPAGHETTI_UPDATE_ARMED) ||
	    (snapshot.state == SPAGHETTI_UPDATE_RECEIVING)) {
		remaining = context.deadline_ms - k_uptime_get();
		snapshot.timeout_remaining_ms =
			(remaining > 0) ? (uint32_t)MIN(remaining, UINT32_MAX) : 0U;
	}
	*out = snapshot;
	k_mutex_unlock(&update_lock);
	return 0;
}
