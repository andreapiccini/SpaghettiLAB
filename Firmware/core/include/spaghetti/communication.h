/**
 * @file
 * @brief Public Communication Protocol V1 request dispatch contract.
 * @ingroup spaghetti_communication
 */

#ifndef SPAGHETTI_COMMUNICATION_H
#define SPAGHETTI_COMMUNICATION_H

#include <stddef.h>
#include <stdint.h>

#include <spaghetti/access_control.h>
#include <spaghetti/protocol.h>

/** Maximum request or response payload bytes retained in one envelope. */
#define SPAGHETTI_COMM_PAYLOAD_MAX SPAGHETTI_PROTOCOL_PAYLOAD_MAX

/**
 * @brief Initialize Communication, adapters, replay cache, and workers once.
 *
 * @retval 0 Communication accepts requests.
 * @retval -EALREADY Communication was initialized previously.
 * @retval -EEXIST Duplicate operation handlers are registered.
 * @retval -EIO The selected adapter failed to initialize.
 *
 * @note Core calls this from boot thread context after Config restoration.
 */
int spaghetti_communication_init(void);

/**
 * @brief Validate, authorize, and dispatch one Protocol V1 request.
 *
 * The adapter supplies an already-capped @p context. Communication authorizes
 * the principal, consults the replay cache, schedules by execution class, maps
 * internal errno into public status, and writes @p response only when this
 * function returns zero. Domain failures appear in
 * @ref spaghetti_protocol_response.status.
 *
 * @param[in] context Borrowed authenticated adapter context.
 * @param[in] request Borrowed complete Protocol V1 request.
 * @param[out] response Caller-owned destination written only on dispatch success.
 *
 * @retval 0 A complete response was produced, including any public status.
 * @retval -EINVAL A pointer or envelope field is invalid.
 * @retval -EACCES Communication has not been initialized.
 * @retval -EMSGSIZE A payload exceeds the profile ceiling.
 * @retval -ENOTSUP The operation or protocol version is unknown.
 *
 * @note Call from thread context. Mutation and async jobs never run inside
 *       MQTT/BLE adapter callbacks; adapters must hand work to this API from
 *       their worker threads.
 */
int spaghetti_communication_handle_request(
	const struct spaghetti_request_context *context,
	const struct spaghetti_protocol_request *request,
	struct spaghetti_protocol_response *response);

/**
 * @brief Invalidate every active Communication session.
 *
 * Protocol V1 does not yet track durable transport sessions; adapters own
 * sockets and console clients. This entry point remains for Access Control
 * revoke hooks and is a documented no-op until adapters register sessions.
 */
void spaghetti_communication_invalidate_sessions(void);

/**
 * @brief Invalidate sessions owned by one principal.
 *
 * @param[in] principal_id Principal whose sessions must close.
 *
 * Also drops matching replay-cache entries for @p principal_id so revoked
 * peers cannot reuse cached mutation responses after reconnect.
 */
void spaghetti_communication_invalidate_principal(
	spaghetti_principal_id_t principal_id);

#endif /* SPAGHETTI_COMMUNICATION_H */
