import { decodeOne } from "../cbor.js";
import { decodeEmptyPayload, encodeEmptyPayload, encodeMap, int64Field, requireInt64, requireMap, requireU32, u32Field } from "../fields.js";

/** `GET_CONNECTIVITY_STATUS` (op 10) has an empty request payload. */
export const encodeGetConnectivityStatusRequest = encodeEmptyPayload;
export function decodeGetConnectivityStatusRequest(bytes: Uint8Array): void {
  decodeEmptyPayload(bytes, "GetConnectivityStatusRequest");
}

/** `OPEN_NETWORK_MAINTENANCE` (op 13) has an empty request payload; response is the shared `{0: job_id}` shape (re-exported above). */
export const encodeOpenNetworkMaintenanceRequest = encodeEmptyPayload;
export function decodeOpenNetworkMaintenanceRequest(bytes: Uint8Array): void {
  decodeEmptyPayload(bytes, "OpenNetworkMaintenanceRequest");
}

export {
  encodeJobIdResponse as encodeOpenNetworkMaintenanceResponse,
  decodeJobIdResponse as decodeOpenNetworkMaintenanceResponse,
  type JobIdResponse as OpenNetworkMaintenanceResponse,
} from "../fields.js";

/**
 * `GET_CONNECTIVITY_STATUS` (op 10) response — `connectivity_ops.c`.
 * `leaseExpiresAtMs` and `lastError` are signed (`int64`/`int32`
 * respectively, `zcbor_int64_put`/`zcbor_int32_put`) — the only two signed
 * fields in this operation, everything else is `uint32`.
 */
export type GetConnectivityStatusResponse = {
  readonly policy: number;
  readonly activeServices: number;
  readonly leasedServices: number;
  readonly leaseExpiresAtMs: bigint;
  readonly lastError: bigint;
};

export function encodeGetConnectivityStatusResponse(r: GetConnectivityStatusResponse): Uint8Array {
  return encodeMap([
    u32Field(0, r.policy),
    u32Field(1, r.activeServices),
    u32Field(2, r.leasedServices),
    int64Field(3, r.leaseExpiresAtMs),
    int64Field(4, r.lastError),
  ]);
}

export function decodeGetConnectivityStatusResponse(bytes: Uint8Array): GetConnectivityStatusResponse {
  const map = requireMap(decodeOne(bytes), "GetConnectivityStatusResponse");
  return {
    policy: requireU32(map, 0, "GetConnectivityStatusResponse"),
    activeServices: requireU32(map, 1, "GetConnectivityStatusResponse"),
    leasedServices: requireU32(map, 2, "GetConnectivityStatusResponse"),
    leaseExpiresAtMs: requireInt64(map, 3, "GetConnectivityStatusResponse"),
    lastError: requireInt64(map, 4, "GetConnectivityStatusResponse"),
  };
}

/** `ACQUIRE_CONNECTIVITY_LEASE` (op 11) request; response is an empty map. */
export type AcquireConnectivityLeaseRequest = { readonly services: number; readonly durationMs: number };

export function encodeAcquireConnectivityLeaseRequest(r: AcquireConnectivityLeaseRequest): Uint8Array {
  return encodeMap([u32Field(0, r.services), u32Field(1, r.durationMs)]);
}

export function decodeAcquireConnectivityLeaseRequest(bytes: Uint8Array): AcquireConnectivityLeaseRequest {
  const map = requireMap(decodeOne(bytes), "AcquireConnectivityLeaseRequest");
  return { services: requireU32(map, 0, "AcquireConnectivityLeaseRequest"), durationMs: requireU32(map, 1, "AcquireConnectivityLeaseRequest") };
}

/** `RELEASE_CONNECTIVITY_LEASE` (op 12) — empty request and response payloads. */
export const encodeReleaseConnectivityLeaseRequest = encodeEmptyPayload;
export function decodeReleaseConnectivityLeaseRequest(bytes: Uint8Array): void {
  decodeEmptyPayload(bytes, "ReleaseConnectivityLeaseRequest");
}

/** Empty response payloads shared by ACQUIRE_CONNECTIVITY_LEASE and RELEASE_CONNECTIVITY_LEASE. */
export const encodeConnectivityLeaseResponse = encodeEmptyPayload;
export function decodeConnectivityLeaseResponse(bytes: Uint8Array): void {
  decodeEmptyPayload(bytes, "ConnectivityLeaseResponse");
}
