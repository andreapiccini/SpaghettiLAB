import { decodeOne } from "../cbor.js";
import { boolField, decodeEmptyPayload, encodeEmptyPayload, encodeMap, optionalU32, requireBool, requireMap, requireU32, u32Field } from "../fields.js";

/** `GET_UPDATE_STATUS` (op 8) has an empty request payload. */
export const encodeGetUpdateStatusRequest = encodeEmptyPayload;
export function decodeGetUpdateStatusRequest(bytes: Uint8Array): void {
  decodeEmptyPayload(bytes, "GetUpdateStatusRequest");
}

/**
 * `OPEN_WIFI_UPDATE` (op 14)'s response is a handover acknowledgment
 * (`address`/`port`/`leaseExpiresAtMs`/`reachedStateRaw`, `reachedStateRaw`
 * being OTA state here), not a job id — this operation is
 * `SERIALIZED_MUTATION` on the firmware side, not `ASYNC_JOB`. See
 * `HandoverAckResponse` in `../fields.js` for the correction and citation
 * (`connectivity_ops.c`'s `execute_open_wifi_update` also routes through
 * `run_wifi_handover()`/`encode_handover_ack()`, despite this operation's own
 * handler living in `connectivity_ops.c`, not `update_ops.c`).
 */
export {
  encodeHandoverAckResponse as encodeOpenWifiUpdateResponse,
  decodeHandoverAckResponse as decodeOpenWifiUpdateResponse,
  type HandoverAckResponse as OpenWifiUpdateResponse,
} from "../fields.js";

/** `GET_UPDATE_STATUS` (op 8) response — `update_ops.c`. Request payload is empty. */
export type GetUpdateStatusResponse = {
  readonly state: number;
  readonly transport: number;
  readonly timeoutRemainingMs: number;
  readonly activeSlot: number;
  readonly imageConfirmed: boolean;
};

export function encodeGetUpdateStatusResponse(r: GetUpdateStatusResponse): Uint8Array {
  return encodeMap([
    u32Field(0, r.state),
    u32Field(1, r.transport),
    u32Field(2, r.timeoutRemainingMs),
    u32Field(3, r.activeSlot),
    boolField(4, r.imageConfirmed),
  ]);
}

export function decodeGetUpdateStatusResponse(bytes: Uint8Array): GetUpdateStatusResponse {
  const map = requireMap(decodeOne(bytes), "GetUpdateStatusResponse");
  return {
    state: requireU32(map, 0, "GetUpdateStatusResponse"),
    transport: requireU32(map, 1, "GetUpdateStatusResponse"),
    timeoutRemainingMs: requireU32(map, 2, "GetUpdateStatusResponse"),
    activeSlot: requireU32(map, 3, "GetUpdateStatusResponse"),
    imageConfirmed: requireBool(map, 4, "GetUpdateStatusResponse"),
  };
}

/**
 * `OPEN_WIFI_UPDATE` (op 14) request — `timeoutMs` is the only
 * client-controlled field (default 60000); the transport is always UDP
 * regardless of what the client sends (see the S021 research note's
 * incompleteness list), so no transport field exists here.
 */
export type OpenWifiUpdateRequest = { readonly timeoutMs?: number };

export function encodeOpenWifiUpdateRequest(r: OpenWifiUpdateRequest): Uint8Array {
  const pairs = [];
  if (r.timeoutMs !== undefined) pairs.push(u32Field(0, r.timeoutMs));
  return encodeMap(pairs);
}

export function decodeOpenWifiUpdateRequest(bytes: Uint8Array): OpenWifiUpdateRequest {
  const map = requireMap(decodeOne(bytes), "OpenWifiUpdateRequest");
  return { timeoutMs: optionalU32(map, 0, 60000, "OpenWifiUpdateRequest") };
}
