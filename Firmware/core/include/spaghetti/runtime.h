/**
 * @file
 * @brief Public Runtime V0 periodic sampling contract.
 * @ingroup spaghetti_runtime
 */

#ifndef SPAGHETTI_RUNTIME_H
#define SPAGHETTI_RUNTIME_H

#include <stdbool.h>
#include <stdint.h>

#include <zephyr/kernel.h>

#include <spaghetti/module.h>

/**
 * @brief Complete active periodic sampling task copied by Runtime.
 */
struct spaghetti_runtime_sampling_task {
	spaghetti_module_id_t module_id; /**< Current live Module handle. */
	uint32_t period_ms; /**< Positive sampling period in milliseconds. */
	bool enabled; /**< True to define an active task; false clears it. */
};

/**
 * @brief Initialize the stopped Runtime worker and Timer service.
 *
 * @retval 0 Runtime is initialized, stopped, and has no loaded task.
 * @retval -EALREADY Runtime was initialized previously.
 * @retval -EINVAL The retained Timer synchronization object is invalid.
 *
 * @note Call once from the Core boot thread after Data initialization.
 */
int spaghetti_runtime_init(void);

/**
 * @brief Validate and copy a sampling task while Runtime is stopped.
 *
 * For an enabled task, resolve @ref spaghetti_runtime_sampling_task.module_id
 * through Module Manager and privately retain its stable key. A disabled task
 * clears the loaded program; its ID and period are ignored. The input pointer
 * is borrowed only for this call and never retained.
 *
 * @param[in] task Caller-owned, suitably aligned task valid for this call.
 *
 * @retval 0 The task was copied, or a disabled task cleared the program.
 * @retval -EINVAL @p task is NULL or an enabled task has a zero period.
 * @retval -EACCES Runtime has not been initialized.
 * @retval -ENOENT The enabled task's Module ID is not live and READY.
 * @retval -EBUSY Runtime is running or stopping.
 *
 * @note Call from thread context. This function performs no bus I/O.
 */
int spaghetti_runtime_load(const struct spaghetti_runtime_sampling_task *task);

/**
 * @brief Start periodic execution of the loaded task.
 *
 * @retval 0 Timer and Runtime worker are active.
 * @retval -EACCES Runtime has not been initialized.
 * @retval -ENOENT No enabled task is loaded.
 * @retval -EALREADY Runtime is already running.
 * @retval -EBUSY Runtime is still stopping.
 * @retval -EINVAL The loaded period is invalid for Timer.
 *
 * @note Call from thread context.
 */
int spaghetti_runtime_start(void);

/**
 * @brief Stop new ticks and wait for current worker activity to quiesce.
 *
 * @param[in] timeout Maximum wait for a current Manager read and Data publish.
 *                    `K_NO_WAIT`, finite timeouts, and `K_FOREVER` are accepted.
 *
 * @retval 0 Runtime reached the stopped state.
 * @retval -EACCES Runtime has not been initialized.
 * @retval -EALREADY Runtime is already stopped.
 * @retval -EBUSY Another caller is already stopping Runtime.
 * @retval -ETIMEDOUT The worker did not quiesce within @p timeout.
 *
 * @note Call from thread context, never from the Runtime worker itself.
 */
int spaghetti_runtime_stop(k_timeout_t timeout);

#endif /* SPAGHETTI_RUNTIME_H */
