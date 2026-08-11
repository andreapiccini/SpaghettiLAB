/**
 * @file
 * @brief Optional shared power-resource ownership contract.
 * @ingroup spaghetti_power
 */

#ifndef SPAGHETTI_POWER_H
#define SPAGHETTI_POWER_H

#include <stdint.h>

/** Identifier of one board-declared shared power resource. */
typedef uint8_t spaghetti_power_resource_id_t;

/** Identifier of one live owner, normally derived from a Module runtime ID. */
typedef uint8_t spaghetti_power_owner_id_t;

/** Owner value that can never identify a configured Module. */
#define SPAGHETTI_POWER_OWNER_INVALID UINT8_MAX

/** Observable lifecycle of one shared power resource. */
enum spaghetti_power_state {
	SPAGHETTI_POWER_OFF, /**< No owners exist and the resource is disabled. */
	SPAGHETTI_POWER_STARTING, /**< The first owner is enabling the resource. */
	SPAGHETTI_POWER_ON, /**< One or more distinct owners hold the resource. */
	SPAGHETTI_POWER_STOPPING, /**< The final owner is disabling the resource. */
	SPAGHETTI_POWER_ERROR, /**< A hardware transition failed. */
};

/** Caller-owned coherent snapshot of one power resource. */
struct spaghetti_power_status {
	enum spaghetti_power_state state; /**< State observed while holding the lock. */
	uint16_t reference_count; /**< Number of distinct successful owners. */
	int last_error; /**< Last transition error, or zero after success. */
};

/**
 * @brief Initialize every compiled shared power resource in its safe OFF state.
 *
 * Boards without a verified controllable rail compile this component out. The
 * fake test backend provides one resource and validates the same lifecycle.
 *
 * @retval 0 Every resource reached its safe initial state.
 * @retval -EALREADY Power was initialized previously.
 * @retval -ENODEV A declared hardware controller is unavailable.
 * @retval -EIO A resource could not be placed in its safe state.
 * @retval -errno The selected backend rejected initialization.
 *
 * @note Call once from boot thread context. This function is not ISR-safe.
 */
int spaghetti_power_init(void);

/**
 * @brief Add one distinct owner and enable on the first acquisition.
 *
 * Ownership is recorded only after a successful 0-to-1 transition. Intermediate
 * acquisitions change only the bounded owner table and reference count.
 *
 * @param[in] id Board-defined shared resource identifier.
 * @param[in] owner Distinct live owner; @ref SPAGHETTI_POWER_OWNER_INVALID is invalid.
 *
 * @retval 0 The resource is ON and @p owner is recorded exactly once.
 * @retval -EINVAL @p owner is the invalid sentinel.
 * @retval -EACCES Power has not been initialized.
 * @retval -ENOENT No compiled resource has @p id.
 * @retval -EALREADY @p owner already holds this resource.
 * @retval -ENOSPC The bounded owner table is full.
 * @retval -EBUSY The resource is in an inconsistent transition state.
 * @retval -ENODEV The hardware control device is unavailable.
 * @retval -EIO Enabling the physical resource failed.
 * @retval -errno The selected backend rejected the transition.
 *
 * @note Call from thread context. The call may perform one bounded hardware write.
 */
int spaghetti_power_acquire(spaghetti_power_resource_id_t id,
			    spaghetti_power_owner_id_t owner);

/**
 * @brief Remove one owner and disable only after the final release.
 *
 * If the 1-to-0 transition fails, ownership and reference count remain unchanged
 * so the same owner can retry without losing accounting information.
 *
 * @param[in] id Board-defined shared resource identifier.
 * @param[in] owner Previously acquired distinct owner.
 *
 * @retval 0 The owner was removed and the resulting state is coherent.
 * @retval -EINVAL @p owner is the invalid sentinel.
 * @retval -EACCES Power has not been initialized.
 * @retval -ENOENT The resource or @p owner does not exist.
 * @retval -EALREADY The resource has no owners to release.
 * @retval -EBUSY The resource is in an inconsistent transition state.
 * @retval -ENODEV The hardware control device is unavailable.
 * @retval -EIO Disabling the physical resource failed.
 * @retval -errno The selected backend rejected the transition.
 *
 * @note Call from thread context. The final release may perform one hardware write.
 */
int spaghetti_power_release(spaghetti_power_resource_id_t id,
			    spaghetti_power_owner_id_t owner);

/**
 * @brief Copy the state of one shared resource.
 *
 * @param[in] id Board-defined shared resource identifier.
 * @param[out] out Caller-owned snapshot written only on success.
 *
 * @retval 0 A coherent status snapshot was copied to @p out.
 * @retval -EINVAL @p out is NULL.
 * @retval -EACCES Power has not been initialized.
 * @retval -ENOENT No compiled resource has @p id.
 *
 * @note Thread-safe and callable from thread context. No hardware is accessed.
 */
int spaghetti_power_get_status(spaghetti_power_resource_id_t id,
			       struct spaghetti_power_status *out);

#endif /* SPAGHETTI_POWER_H */
