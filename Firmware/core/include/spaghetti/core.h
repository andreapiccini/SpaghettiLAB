/**
 * @file
 * @brief Core functionality for the Spaghetti firmware.
 * @ingroup spaghetti_core
 */

#ifndef SPAGHETTI_CORE_H
#define SPAGHETTI_CORE_H

enum spaghetti_core_state {
    SPAGHETTI_CORE_UNINITIALIZED,
    SPAGHETTI_CORE_READY,
    SPAGHETTI_CORE_ERROR
};

/**
 * @brief Initialize the firmware Core.
 *
 * @return 0 on success, otherwise a negative errno-compatible value.
 */
int spaghetti_core_init(void);

/**
 * @brief Return the current Core state.
 *
 * @retval enum spaghetti_core_state The current Core state.
 */
enum spaghetti_core_state spaghetti_core_get_state(void);

#endif /* SPAGHETTI_CORE_H */