/**
 * @file
 * @brief Public CBOR codec contract for Spaghetti Config.
 * @ingroup spaghetti_config
 */

#ifndef SPAGHETTI_CONFIG_CODEC_H
#define SPAGHETTI_CONFIG_CODEC_H

#include <stddef.h>
#include <stdint.h>

#include <spaghetti/config.h>

/** Maximum accepted encoded Config payload size in bytes. */
#define SPAGHETTI_CONFIG_CBOR_MAX_SIZE CONFIG_SPAGHETTI_MAX_PROTOCOL_PAYLOAD

/**
 * @brief Decode and validate one complete Config V0 CBOR payload.
 *
 * Decode wire V0 version 1 or wire V1 version 2 into the current in-memory
 * Config model. V0 leaves MQTT disabled; V1 adds the bounded MQTT endpoint
 * documented in `subsys/config/spaghetti_config_v1.cddl`. The decoder validates
 * the temporary Config through @ref spaghetti_config_validate before publishing
 * it to @p out.
 *
 * @param[in] bytes Caller-owned encoded bytes borrowed only for this call.
 *                  The pointer must be non-NULL and @p length bytes must be
 *                  readable.
 * @param[in] length Exact encoded size in bytes, in the inclusive range 1 to
 *                   @ref SPAGHETTI_CONFIG_CBOR_MAX_SIZE.
 * @param[out] out Caller-owned destination written only after complete decode
 *                 and semantic validation succeed. It is never retained.
 *
 * @retval 0 A complete validated Config was copied to @p out.
 * @retval -EINVAL A pointer, length, numeric range, or decoded field is invalid.
 * @retval -EMSGSIZE The payload, Module array, or type ID exceeds a fixed bound.
 * @retval -EBADMSG The CBOR shape, key order, type, collection size, or complete
 *                  input consumption is invalid.
 * @retval -ENOTSUP The wire version or Module type is unsupported.
 * @retval -ENOENT A decoded Port does not exist.
 * @retval -EEXIST Stable Module keys are duplicated.
 * @retval -EADDRINUSE Two decoded Modules claim the same Port endpoint.
 * @retval -ERANGE A decoded concrete driver configuration is not representable.
 *
 * @note Call from thread context. The function performs no hardware I/O,
 *       allocation, wait, or state mutation.
 */
int spaghetti_config_decode_cbor(const uint8_t *bytes, size_t length,
				 struct spaghetti_config *out);

#endif /* SPAGHETTI_CONFIG_CODEC_H */
