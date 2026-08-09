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
	SPAGHETTI_CORE_READY,         /**< Core initialization completed successfully. */
	SPAGHETTI_CORE_ERROR          /**< Core initialization failed. */
};

/**
 * @brief Initialize the firmware Core.
 *
 * @retval 0 Core initialization completed successfully.
 * @retval -EIO A mandatory Core dependency could not be initialized.
 */
int spaghetti_core_init(void);

/**
 * @brief Return the current Core state.
 *
 * @return Current Core state.
 */
enum spaghetti_core_state spaghetti_core_get_state(void);

#endif /* SPAGHETTI_CORE_H */
