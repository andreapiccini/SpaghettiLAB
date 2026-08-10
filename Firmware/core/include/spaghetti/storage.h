/**
 * @file
 * @brief Public persistent Config storage contract for the Spaghetti firmware.
 * @ingroup spaghetti_storage
 */

#ifndef SPAGHETTI_STORAGE_H
#define SPAGHETTI_STORAGE_H

#include <spaghetti/config.h>

/** Settings key that contains the single versioned Config record. */
#define SPAGHETTI_STORAGE_CONFIG_KEY "config"

/**
 * @brief Initialize persistent Storage and load its Config record.
 *
 * Initialize Zephyr Settings with its compiled NVS backend, then load the
 * bounded record under @ref SPAGHETTI_STORAGE_CONFIG_KEY. A missing or corrupt
 * record does not make initialization fail; read reports its exact state.
 *
 * @retval 0 Storage is ready for read and write operations.
 * @retval -EALREADY Storage was already initialized.
 * @retval -EBUSY Another thread is initializing Storage.
 * @retval -ENODEV The flash device or partition is unavailable.
 * @retval -EIO Settings or its backend could not be initialized or loaded.
 * @retval -ENOMEM The backend could not initialize its bounded metadata.
 *
 * @note Call once from the boot thread. This function performs bounded flash I/O.
 */
int spaghetti_storage_init(void);

/**
 * @brief Copy the Config record loaded from persistent Storage.
 *
 * @param[out] out Caller-owned, suitably aligned Config destination. It must
 *                 remain valid for this call and is written only on success.
 *
 * @retval 0 A complete compatible Config was copied to @p out.
 * @retval -EINVAL @p out is NULL.
 * @retval -EACCES Storage has not completed initialization.
 * @retval -ENOENT No Config record exists in persistent Storage.
 * @retval -EBADMSG The stored record has an invalid size, magic, or version.
 * @retval -EIO The backend could not read or verify the complete record.
 *
 * @note Thread-safe and callable from thread context. It does not access flash
 *       after initialization because Storage owns an in-memory copy.
 */
int spaghetti_storage_read_config(struct spaghetti_config *out);

/**
 * @brief Atomically replace the persistent Config record.
 *
 * Build a zero-initialized, versioned record and synchronously copy the used
 * fields of @p config into it before asking Settings/NVS to persist it. The
 * input pointer is never retained.
 *
 * @param[in] config Caller-owned Config borrowed only for this call. It must
 *                   be a complete snapshot already applied successfully.
 *
 * @retval 0 Settings durably accepted the complete replacement record.
 * @retval -EINVAL @p config is NULL or its bounded shape is invalid.
 * @retval -EACCES Storage has not completed initialization.
 * @retval -ENOSPC The flash backend has no space for the record.
 * @retval -ENOMEM The backend cannot allocate bounded record metadata.
 * @retval -EROFS The selected flash region is read-only.
 * @retval -EIO The backend write or verification failed.
 *
 * @note Call from thread context. This function performs synchronous flash I/O.
 */
int spaghetti_storage_write_config(const struct spaghetti_config *config);

#endif /* SPAGHETTI_STORAGE_H */
