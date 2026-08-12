/**
 * @file
 * @brief Authenticated bounded network-console contract.
 * @ingroup spaghetti_remote_console
 */

#ifndef SPAGHETTI_REMOTE_CONSOLE_H
#define SPAGHETTI_REMOTE_CONSOLE_H

#include <stdbool.h>
#include <stddef.h>
#include <stdint.h>

#include <zephyr/kernel.h>

/** Fixed per-device TLS pre-shared key size. */
#define SPAGHETTI_REMOTE_CONSOLE_PSK_SIZE 32U

/** Maximum TLS PSK identity bytes. */
#define SPAGHETTI_REMOTE_CONSOLE_IDENTITY_MAX_SIZE 32U

/** Observable remote-console lifecycle. */
enum spaghetti_remote_console_state {
	SPAGHETTI_REMOTE_CONSOLE_UNINITIALIZED, /**< Normal-mode initialization has not run. */
	SPAGHETTI_REMOTE_CONSOLE_DISABLED, /**< No listener, client, or worker is active. */
	SPAGHETTI_REMOTE_CONSOLE_LISTENING, /**< TLS-PSK accepts one authenticated client. */
	SPAGHETTI_REMOTE_CONSOLE_ERROR, /**< Credential, socket, or thread setup failed. */
};

/** Caller-owned coherent remote-console status copy. */
struct spaghetti_remote_console_status {
	enum spaghetti_remote_console_state state; /**< Service lifecycle state. */
	uint16_t port; /**< TCP port in host byte order. */
	bool credentials_present; /**< True when a complete credential record exists. */
	bool client_connected; /**< True while one authenticated client owns the session. */
	uint32_t dropped_log_count; /**< Log chunks discarded because their queue was full. */
	int last_error; /**< Last lifecycle errno, or zero. */
};

/**
 * @brief Initialize the normal-mode TLS-PSK remote console.
 *
 * A missing credential is a valid disabled configuration. A present credential
 * remains closed until Connectivity Manager starts the single-client service.
 *
 * @retval 0 Backend and credential policy are ready with no open listener.
 * @retval -EALREADY Initialization already completed.
 * @retval -EIO Secure storage, TLS, socket, or thread setup failed.
 * @retval -errno A selected backend rejected initialization.
 *
 * @note Core calls this only in normal mode after Communication initialization.
 */
int spaghetti_remote_console_init(void);

/**
 * @brief Start the credential-gated listener and dynamic worker.
 *
 * @retval 0 The authenticated listener is running.
 * @retval -EACCES The backend is not initialized.
 * @retval -EALREADY The listener is already running.
 * @retval -ENOENT No console credential is provisioned.
 * @retval -errno Credential, socket, TLS, or stack setup failed.
 */
int spaghetti_remote_console_start(void);

/**
 * @brief Stop the listener and release every optional runtime resource.
 *
 * @param[in] timeout Finite cleanup deadline copied by value; K_FOREVER is invalid.
 *
 * @retval 0 Listener, client, work, worker, TLS state, and stack are released.
 * @retval -EINVAL @p timeout is unbounded or exceeds the service limit.
 * @retval -EACCES The backend is not initialized.
 * @retval -EALREADY The listener is already stopped.
 * @retval -EAGAIN The worker did not exit before the deadline.
 * @retval -errno Socket, TLS, or stack cleanup failed.
 */
int spaghetti_remote_console_stop(k_timeout_t timeout);

/**
 * @brief Persist a separate per-device TLS-PSK console credential.
 *
 * @param[in] psk Caller-owned 32-byte secret borrowed only for this call.
 * @param[in] psk_size Must equal @ref SPAGHETTI_REMOTE_CONSOLE_PSK_SIZE.
 * @param[in] identity Caller-owned public identity borrowed only for this call.
 * @param[in] identity_size Number of identity bytes, from one to 32.
 *
 * @retval 0 The encrypted/authenticated PSA ITS record was replaced.
 * @retval -EINVAL A pointer or size is invalid.
 * @retval -EACCES Local maintenance UART is not active.
 * @retval -ENOSPC Secure storage has no capacity.
 * @retval -errno Secure storage rejected the record.
 *
 * @note No caller pointer is retained and no credential bytes are logged.
 */
int spaghetti_remote_console_set_credentials(
	const uint8_t *psk, size_t psk_size,
	const uint8_t *identity, size_t identity_size);

/**
 * @brief Delete the persisted remote-console credential.
 *
 * @retval 0 The credential was deleted and future normal boots are disabled.
 * @retval -EACCES Local maintenance UART is not active.
 * @retval -ENOENT No credential was stored.
 * @retval -errno Secure storage rejected deletion.
 */
int spaghetti_remote_console_clear_credentials(void);

/**
 * @brief Copy current remote-console state.
 *
 * @param[out] out Caller-owned destination written only on success. The service
 *                 retains no pointer to it.
 *
 * @retval 0 @p out contains a coherent snapshot.
 * @retval -EINVAL @p out is NULL.
 * @retval -EIO The credential record could not be inspected.
 * @retval -errno Secure storage rejected the query.
 */
int spaghetti_remote_console_get_status(
	struct spaghetti_remote_console_status *out);

#endif /* SPAGHETTI_REMOTE_CONSOLE_H */
