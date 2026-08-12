/**
 * @file
 * @brief Authenticated bounded Wi-Fi OTA window.
 * @ingroup spaghetti_ota
 */

#ifndef SPAGHETTI_OTA_H
#define SPAGHETTI_OTA_H

#include <stdbool.h>
#include <stddef.h>
#include <stdint.h>
#include <zephyr/kernel.h>

struct smp_transport;

/** Fixed per-device DTLS pre-shared key size. */
#define SPAGHETTI_OTA_PSK_SIZE 32U

/** Maximum DTLS PSK identity bytes. */
#define SPAGHETTI_OTA_IDENTITY_MAX_SIZE 32U

/** Observable Wi-Fi OTA listener state. */
enum spaghetti_ota_state {
	SPAGHETTI_OTA_UNINITIALIZED, /**< Normal-mode initialization has not run. */
	SPAGHETTI_OTA_CLOSED, /**< No UDP socket or update window is open. */
	SPAGHETTI_OTA_ARMED, /**< Authenticated DTLS listener is open. */
	SPAGHETTI_OTA_ERROR, /**< Opening or cleanup failed. */
};

/** Caller-owned coherent OTA status copy. */
struct spaghetti_ota_status {
	enum spaghetti_ota_state state; /**< Listener lifecycle state. */
	uint16_t port; /**< UDP port, in host byte order. */
	bool credentials_present; /**< A complete PSK record exists. */
	int last_error; /**< Last lifecycle errno, or zero. */
};

/**
 * @brief Initialize OTA closed without starting optional runtime resources.
 *
 * @retval 0 OTA initialized and remains closed until lifecycle start.
 * @retval -EALREADY OTA was initialized previously.
 * @retval -EIO Secure storage, DTLS, socket, or Update initialization failed.
 * @retval -errno A backend or Update operation failed.
 */
int spaghetti_ota_init(void);

/**
 * @brief Start OTA policy and consume an optional persisted one-shot window.
 *
 * @retval 0 OTA is started, with the listener open only for a pending request.
 * @retval -EACCES OTA is not initialized.
 * @retval -EALREADY OTA is already started.
 * @retval -errno Credential, Update, workspace, socket, or stack setup failed.
 */
int spaghetti_ota_start(void);

/**
 * @brief Stop OTA and release every optional runtime resource.
 *
 * @param[in] timeout Finite cleanup deadline copied by value; K_FOREVER is invalid.
 *
 * @retval 0 Work, socket, callback, listener, stack, and workspace are released.
 * @retval -EINVAL @p timeout is unbounded or exceeds the service limit.
 * @retval -EACCES OTA is not initialized.
 * @retval -EALREADY OTA is already stopped.
 * @retval -EAGAIN The listener did not exit before the deadline.
 * @retval -errno A backend cleanup operation failed.
 */
int spaghetti_ota_stop(k_timeout_t timeout);

/**
 * @brief Persist one per-device DTLS-PSK credential.
 *
 * @param[in] psk Caller-owned 32-byte secret borrowed only for this call.
 * @param[in] psk_size Must equal @ref SPAGHETTI_OTA_PSK_SIZE.
 * @param[in] identity Caller-owned public identity bytes borrowed for this call.
 * @param[in] identity_size Number of identity bytes, from one to 32.
 *
 * @retval 0 The encrypted/authenticated PSA ITS record was replaced.
 * @retval -EINVAL A pointer or size is invalid.
 * @retval -EACCES Local maintenance is not active.
 * @retval -ENOSPC Secure storage has no capacity.
 * @retval -errno Secure storage rejected the record.
 */
int spaghetti_ota_set_credentials(
	const uint8_t *psk, size_t psk_size,
	const uint8_t *identity, size_t identity_size);

/**
 * @brief Delete the persisted DTLS-PSK credential and pending request.
 *
 * @retval 0 The record was deleted.
 * @retval -EACCES Local maintenance is not active.
 * @retval -ENOENT No credential was stored.
 * @retval -errno Secure storage rejected deletion.
 */
int spaghetti_ota_clear_credentials(void);

/**
 * @brief Save one OTA request that will be consumed by the next normal boot.
 *
 * @param[in] timeout_ms Whole OTA-window duration in milliseconds.
 *
 * @retval 0 The one-shot request was stored.
 * @retval -EINVAL @p timeout_ms is zero or exceeds the configured maximum.
 * @retval -EACCES Local maintenance is not active.
 * @retval -ENOENT Credentials or a valid persisted Config are absent.
 * @retval -errno Secure storage rejected the update.
 */
int spaghetti_ota_request_once(uint32_t timeout_ms);

/**
 * @brief Open DTLS-SMP immediately for an already authenticated caller.
 *
 * @param[in] timeout_ms Whole window duration in milliseconds.
 *
 * @retval 0 Update is ARMED and the authenticated UDP listener is open.
 * @retval -EINVAL @p timeout_ms is zero or exceeds the configured maximum.
 * @retval -EACCES OTA has not been initialized.
 * @retval -ENOENT No DTLS credential is provisioned.
 * @retval -errno Update, DTLS, socket, or thread startup failed.
 */
int spaghetti_ota_arm(uint32_t timeout_ms);

/**
 * @brief Close the listener and discard an incomplete candidate.
 *
 * @retval 0 OTA is closed and Update returned to IDLE.
 * @retval -EACCES OTA has not been initialized.
 * @retval -EALREADY OTA is already closed.
 * @retval -errno Socket, credential, or Update cleanup failed.
 */
int spaghetti_ota_cancel(void);

/**
 * @brief Test whether an SMP request arrived through the OTA transport.
 *
 * @param[in] transport Borrowed mcumgr transport pointer from the request.
 *
 * @return True only for the active Spaghetti DTLS transport.
 */
bool spaghetti_ota_is_transport(const struct smp_transport *transport);

/**
 * @brief Copy current OTA state.
 *
 * @param[out] out Caller-owned destination written only on success.
 *
 * @retval 0 @p out contains a coherent snapshot.
 * @retval -EINVAL @p out is NULL.
 */
int spaghetti_ota_get_status(struct spaghetti_ota_status *out);

/** Defer cancellation so the current SMP response can be transmitted. */
void spaghetti_ota_cancel_after_response(void);

/** Close only the transport before reboot, preserving a pending candidate. */
void spaghetti_ota_prepare_reboot(void);

#endif /* SPAGHETTI_OTA_H */
