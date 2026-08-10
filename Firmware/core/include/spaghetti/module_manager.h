/**
 * @file
 * @brief Public Module Manager contract for the Spaghetti firmware.
 * @ingroup spaghetti_module_manager
 */

#ifndef SPAGHETTI_MODULE_MANAGER_H
#define SPAGHETTI_MODULE_MANAGER_H

#include <stddef.h>
#include <stdint.h>

#include <spaghetti/module.h>
#include <spaghetti/port.h>

struct spaghetti_command;

/**
 * @brief Complete borrowed request used to create one Module.
 *
 * The Manager does not retain @ref type_id or @ref driver_config. The concrete
 * driver copies any configuration it needs before configure returns.
 */
struct spaghetti_module_request {
	spaghetti_module_key_t key; /**< Nonzero stable Config identity. */
	spaghetti_port_id_t port_id; /**< Shared physical Port identifier. */
	const char *type_id; /**< Borrowed NUL-terminated driver type identifier. */
	const void *driver_config; /**< Borrowed driver-specific read-only bytes. */
	size_t driver_config_size; /**< Exact size of @ref driver_config in bytes. */
	uint32_t revision; /**< Nonzero desired-state revision for stale-operation checks. */
};

/**
 * @brief Caller-owned copy of one live Module's public state.
 */
struct spaghetti_module_snapshot {
	spaghetti_module_id_t id; /**< Ephemeral ID of the current live instance. */
	spaghetti_module_key_t key; /**< Stable Config identity. */
	spaghetti_port_id_t port_id; /**< Shared Port used by this instance. */
	char type_id[SPAGHETTI_TYPE_ID_MAX]; /**< Owned NUL-terminated driver type ID. */
	struct spaghetti_module_endpoint endpoint; /**< Normalized hardware endpoint. */
	enum spaghetti_module_state state; /**< Public lifecycle state at copy time. */
	uint32_t revision; /**< Config revision committed with this instance. */
};

/**
 * @brief Initialize an empty Module Manager.
 *
 * Clear the fixed-capacity slot pool. Core calls this once after Port and Driver
 * Registry initialization. Existing live instances must not exist.
 *
 * @retval 0 Initialization completed successfully.
 * @retval -EALREADY The Manager was already initialized.
 *
 * @note Call once from boot thread context. This function does not access a bus.
 */
int spaghetti_module_manager_init(void);

/**
 * @brief Create one Module from a complete runtime request.
 *
 * Validate the key, Port, driver config, capabilities, and normalized endpoint;
 * reserve one slot; initialize the driver; and publish the ID only after commit.
 * Sharing a Port alone is valid.
 *
 * @param[in] request Caller-owned request borrowed for this call. Its config is
 *                    copied by the driver if retained.
 * @param[out] out_id Caller-owned destination written only after successful init.
 *
 * @retval 0 The Module is READY and @p out_id contains its runtime ID.
 * @retval -EINVAL A pointer, key, revision, string, config size, or endpoint is invalid.
 * @retval -ENOENT The Port or driver type does not exist.
 * @retval -EEXIST The stable key already exists.
 * @retval -EADDRINUSE The normalized endpoint conflicts on the selected Port.
 * @retval -ENOTSUP The Port lacks a required capability or operation.
 * @retval -ENOSPC The Manager slot pool is full.
 * @retval -ENOMEM The concrete driver's bounded context pool is full.
 * @retval -ENODEV A required hardware device is unavailable.
 * @retval -EBUSY The selected key or endpoint is being configured or removed.
 * @retval -ERANGE A derived driver value cannot be represented safely.
 * @retval -EIO A bounded initialization bus transfer failed.
 * @retval -ETIMEDOUT A bounded initialization bus transfer timed out.
 *
 * @note Call from thread context. Driver initialization may perform bounded bus I/O.
 */
int spaghetti_module_manager_configure(
	const struct spaghetti_module_request *request,
	spaghetti_module_id_t *out_id);

/**
 * @brief Remove one exact live Module.
 *
 * Deinitialize the selected driver context and clear only its Manager slot.
 * Sibling Modules that share the Port remain unchanged. If hardware power-down
 * fails, the slot is still removed after the driver releases its context and the
 * original driver error is returned.
 *
 * @param[in] id Ephemeral ID of the live Module to remove.
 * @param[in] expected_revision Nonzero revision that must match the live snapshot.
 *
 * @retval 0 The Module was deinitialized and removed.
 * @retval -EINVAL @p expected_revision is zero.
 * @retval -ENOENT @p id does not identify a live Module.
 * @retval -ESTALE The revision does not match.
 * @retval -EBUSY The Module is executing another driver operation.
 * @retval -ENODEV The context was released but its hardware became unavailable.
 * @retval -EIO The context was released but hardware power-down failed.
 * @retval -ETIMEDOUT The context was released but hardware power-down timed out.
 *
 * @note Call from thread context. This function may perform bounded bus I/O.
 */
int spaghetti_module_manager_remove(spaghetti_module_id_t id,
				    uint32_t expected_revision);

/**
 * @brief Copy a Module snapshot selected by runtime ID.
 *
 * @param[in] id Ephemeral ID to find.
 * @param[out] out Caller-owned snapshot written only on success.
 *
 * @retval 0 The snapshot was copied.
 * @retval -EINVAL @p out is NULL.
 * @retval -ENOENT @p id does not identify a live Module.
 *
 * @note Thread-safe and callable from thread context. It does not access hardware.
 */
int spaghetti_module_manager_get_by_id(
	spaghetti_module_id_t id,
	struct spaghetti_module_snapshot *out);

/**
 * @brief Copy a Module snapshot selected by stable key.
 *
 * @param[in] key Nonzero Config-owned key to find.
 * @param[out] out Caller-owned snapshot written only on success.
 *
 * @retval 0 The snapshot was copied.
 * @retval -EINVAL @p key is zero or @p out is NULL.
 * @retval -ENOENT No live Module has @p key.
 *
 * @note Thread-safe and callable from thread context. It does not access hardware.
 */
int spaghetti_module_manager_get_by_key(
	spaghetti_module_key_t key,
	struct spaghetti_module_snapshot *out);

/**
 * @brief List every live Module that references one Port.
 *
 * Pass NULL/zero for @p out and @p capacity to query the required count. When
 * capacity is insufficient, no snapshot is written and @p out_count still
 * receives the required count.
 *
 * @param[in] port_id Physical Port whose references are counted.
 * @param[out] out Caller-owned array of @p capacity snapshots, or NULL for count-only.
 * @param[in] capacity Number of elements available at @p out; zero for count-only.
 * @param[out] out_count Caller-owned required/actual count destination.
 *
 * @retval 0 All matching snapshots were copied, or count-only query succeeded.
 * @retval -EINVAL Pointer and capacity arguments are inconsistent.
 * @retval -ENOENT @p port_id does not identify an available Port.
 * @retval -ENOSPC @p capacity is too small; @p out_count contains required capacity.
 *
 * @note Thread-safe and callable from thread context. It does not access hardware.
 */
int spaghetti_module_manager_list_by_port(
	spaghetti_port_id_t port_id,
	struct spaghetti_module_snapshot *out,
	size_t capacity,
	size_t *out_count);

/**
 * @brief Read one sample from a live READY Module.
 *
 * @param[in] id Ephemeral ID of the Module to read.
 * @param[out] out Caller-owned sample written only after a complete successful read.
 *
 * @retval 0 The complete sample was copied to @p out.
 * @retval -EINVAL @p out is NULL.
 * @retval -ENOENT @p id does not identify a live Module.
 * @retval -EBUSY The Module is executing another driver operation.
 * @retval -ENOTSUP The driver has no read operation.
 * @retval -EIO A driver or bus operation failed.
 * @retval -ETIMEDOUT The driver's bounded acquisition timed out.
 * @retval -ERANGE The hardware reported overflow or a result cannot be represented.
 *
 * @note Call from thread context. This function may sleep and perform bounded bus I/O.
 */
int spaghetti_module_manager_read(
	spaghetti_module_id_t id,
	struct spaghetti_sample *out);

/**
 * @brief Apply one generic command to a live READY Module.
 *
 * @param[in] id Ephemeral ID of the Module to command.
 * @param[in] command Caller-owned command borrowed only for this synchronous call.
 *
 * @retval 0 The concrete driver applied the requested state.
 * @retval -EINVAL @p command is NULL.
 * @retval -ENOENT @p id does not identify a live Module.
 * @retval -EBUSY The Module is executing another driver operation.
 * @retval -ENOTSUP The command type or driver operation is unsupported.
 * @retval -ENODEV Required output hardware is unavailable.
 * @retval -EIO The concrete output operation failed.
 *
 * @note Call from thread context. The Manager serializes this operation with
 *       read and remove on the same Module instance.
 */
int spaghetti_module_manager_command(
	spaghetti_module_id_t id,
	const struct spaghetti_command *command);

#endif /* SPAGHETTI_MODULE_MANAGER_H */
