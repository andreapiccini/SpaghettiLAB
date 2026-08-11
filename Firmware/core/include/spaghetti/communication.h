/**
 * @file
 * @brief Public bounded Communication request and response contract.
 * @ingroup spaghetti_communication
 */

#ifndef SPAGHETTI_COMMUNICATION_H
#define SPAGHETTI_COMMUNICATION_H

#include <stddef.h>
#include <stdint.h>

#include <spaghetti/config.h>
#include <spaghetti/core.h>

/** Maximum request or response payload bytes retained in one envelope. */
#define SPAGHETTI_COMM_PAYLOAD_MAX 256U

/** Maximum type ID bytes returned by the compact status representation. */
#define SPAGHETTI_COMM_STATUS_TYPE_ID_SIZE 16U

/** Transport-independent requests implemented by Communication V0. */
enum spaghetti_request_type {
	SPAGHETTI_REQUEST_GET_STATUS, /**< Return bounded Core and Module status. */
	SPAGHETTI_REQUEST_SET_CONFIG, /**< Submit encoded Config bytes to a codec. */
};

/**
 * @brief Complete caller-owned bounded request envelope.
 */
struct spaghetti_request {
	uint32_t correlation_id; /**< Caller identity copied into the response. */
	enum spaghetti_request_type type; /**< Selects the domain operation. */
	size_t payload_size; /**< Valid leading bytes in @ref payload. */
	uint8_t payload[SPAGHETTI_COMM_PAYLOAD_MAX]; /**< Owned encoded input bytes. */
};

/**
 * @brief Complete caller-owned bounded response envelope.
 */
struct spaghetti_response {
	uint32_t correlation_id; /**< Exact ID copied from the accepted request. */
	int status; /**< Domain-operation result as zero or negative errno. */
	size_t payload_size; /**< Valid leading bytes in @ref payload. */
	uint8_t payload[SPAGHETTI_COMM_PAYLOAD_MAX]; /**< Owned encoded output bytes. */
};

/**
 * @brief Compact copy of one Module snapshot returned by GET_STATUS.
 */
struct spaghetti_communication_module_status {
	uint32_t key; /**< Stable Config-owned Module key. */
	uint32_t endpoint_value; /**< Value interpreted through @ref endpoint_kind. */
	uint8_t runtime_id; /**< Ephemeral live Module ID. */
	uint8_t port_id; /**< Physical Port shared or owned by the Module. */
	uint8_t state; /**< Numeric @ref spaghetti_module_state value. */
	uint8_t endpoint_kind; /**< Numeric endpoint-kind value. */
	char type_id[SPAGHETTI_COMM_STATUS_TYPE_ID_SIZE]; /**< Complete driver type ID. */
};

/**
 * @brief Bounded GET_STATUS payload copied into response payload bytes.
 *
 * Consumers must use memcpy into an aligned instance before reading fields;
 * they must not cast the byte array in @ref spaghetti_response directly.
 */
struct spaghetti_communication_status_payload {
	uint8_t core_state; /**< Numeric @ref spaghetti_core_state value. */
	uint8_t core_mode; /**< Numeric @ref spaghetti_core_mode value. */
	uint8_t image_state; /**< Numeric @ref spaghetti_core_image_state value. */
	uint8_t active_slot; /**< MCUboot slot currently executing. */
	uint8_t image_confirmed; /**< One when the running image is permanent. */
	uint8_t port_count; /**< Number of physical Ports reported by Core. */
	uint8_t module_count; /**< Used elements in @ref modules. */
	uint8_t reserved; /**< Always zero; retained for stable field alignment. */
	char version[SPAGHETTI_CORE_VERSION_SIZE]; /**< Signed application version. */
	struct spaghetti_communication_module_status
		modules[SPAGHETTI_CONFIG_MAX_MODULES]; /**< Every live Module snapshot. */
};

/**
 * @brief Initialize Communication and its Shell adapter once.
 *
 * @retval 0 Communication accepts requests.
 * @retval -EALREADY Communication was initialized previously.
 * @retval -EIO The selected adapter failed to initialize.
 *
 * @note Core calls this from boot thread context after Config restoration.
 */
int spaghetti_communication_init(void);

/**
 * @brief Validate and synchronously dispatch one complete request.
 *
 * The input is borrowed only for this call. A complete response is copied to
 * @p response only when this function returns zero. Domain failures, such as
 * an unavailable Config codec, are reported in @ref spaghetti_response.status.
 *
 * @param[in] request Caller-owned request valid and suitably aligned for this call.
 * @param[out] response Caller-owned destination written only on dispatch success.
 *
 * @retval 0 A complete response was produced, including any domain errno.
 * @retval -EINVAL A pointer or command-specific payload shape is invalid.
 * @retval -EACCES Communication has not been initialized.
 * @retval -EMSGSIZE @ref spaghetti_request.payload_size exceeds the fixed limit.
 * @retval -ENOTSUP @ref spaghetti_request.type is unknown.
 *
 * @note Call from thread context. GET_STATUS performs bounded Manager queries.
 */
int spaghetti_communication_handle_request(
	const struct spaghetti_request *request,
	struct spaghetti_response *response);

#endif /* SPAGHETTI_COMMUNICATION_H */
