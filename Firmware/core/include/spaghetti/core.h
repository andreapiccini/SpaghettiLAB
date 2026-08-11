/**
 * @file
 * @brief Core functionality for the Spaghetti firmware.
 * @ingroup spaghetti_core
 */

#ifndef SPAGHETTI_CORE_H
#define SPAGHETTI_CORE_H

/**
 * @brief Overall initialization state of the firmware Core.
 */
enum spaghetti_core_state {
	SPAGHETTI_CORE_UNINITIALIZED, /**< Core initialization has not started. */
	SPAGHETTI_CORE_INITIALIZING, /**< Mandatory dependencies are being initialized. */
	SPAGHETTI_CORE_READY, /**< Initialization completed; start is allowed. */
	SPAGHETTI_CORE_RUNNING, /**< Infrastructure is running and accepts requests. */
	SPAGHETTI_CORE_FAILED, /**< A mandatory dependency failed. */
};

/**
 * @brief Initialize the firmware Core.
 *
 * @retval 0 Core initialization completed successfully.
 * @retval -EINVAL A compiled dependency contract is invalid.
 * @retval -EALREADY A mandatory subsystem was initialized previously.
 * @retval -ENODEV Required flash, bus, or Module hardware is unavailable.
 * @retval -ENOTSUP A stored Module is incompatible with its selected Port.
 * @retval -ENOSPC A bounded Manager or backend pool is full.
 * @retval -ENOMEM A backend or driver context pool is full.
 * @retval -EBUSY A required Module is already executing another operation.
 * @retval -ERANGE A stored driver value cannot be represented safely.
 * @retval -EIO Persistent Storage or a Module driver failed.
 * @retval -ETIMEDOUT A bounded hardware operation timed out.
 *
 * @note Call once from the boot thread. Missing or corrupt stored Config is
 *       handled as a safe empty state; a valid record is retained for start.
 */
int spaghetti_core_init(void);

/**
 * @brief Start the initialized engine and apply a retained startup Config.
 *
 * A stored Config that cannot be applied because removable hardware is absent
 * is reported but does not make the communication infrastructure unavailable.
 *
 * @retval 0 Core reached @ref SPAGHETTI_CORE_RUNNING.
 * @retval -EACCES Core is not in @ref SPAGHETTI_CORE_READY.
 *
 * @note Call once from the boot thread after @ref spaghetti_core_init.
 */
int spaghetti_core_start(void);

/**
 * @brief Return the current Core state.
 *
 * @return Current Core state.
 */
enum spaghetti_core_state spaghetti_core_get_state(void);

#endif /* SPAGHETTI_CORE_H */
