import { decodeOne, encodeArray } from "../cbor.js";
import { encodeMap, int64Field, optionalU32, requireArray, requireInt64, requireMap, requireU32, u32Field } from "../fields.js";

/** `GET_AUDIT_LOG` (op 18) request — `cursor` default 1 (firmware coerces 0 to 1), `limit` default 8. */
export type GetAuditLogRequest = { readonly cursor?: number; readonly limit?: number };

export function encodeGetAuditLogRequest(r: GetAuditLogRequest): Uint8Array {
  const pairs = [];
  if (r.cursor !== undefined) pairs.push(u32Field(0, r.cursor));
  if (r.limit !== undefined) pairs.push(u32Field(1, r.limit));
  return encodeMap(pairs);
}

export function decodeGetAuditLogRequest(bytes: Uint8Array): GetAuditLogRequest {
  const map = requireMap(decodeOne(bytes), "GetAuditLogRequest");
  return { cursor: optionalU32(map, 0, 1, "GetAuditLogRequest"), limit: optionalU32(map, 1, 8, "GetAuditLogRequest") };
}

/** `internalResult` is a signed `int32` (raw firmware errno), `uptimeMs` is a signed `int64`. Never a secret payload (S123). */
export type AuditLogEntry = {
  readonly sequence: number;
  readonly principalId: number;
  readonly operationId: number;
  readonly internalResult: bigint;
  readonly uptimeMs: bigint;
};

export type GetAuditLogResponse = {
  readonly entries: readonly AuditLogEntry[];
  readonly nextCursor: number;
};

export function encodeGetAuditLogResponse(r: GetAuditLogResponse): Uint8Array {
  const entries = r.entries.map((e) =>
    encodeMap([
      u32Field(0, e.sequence),
      u32Field(1, e.principalId),
      u32Field(2, e.operationId),
      int64Field(3, e.internalResult),
      int64Field(4, e.uptimeMs),
    ]),
  );
  return encodeMap([[0, encodeArray(entries)], u32Field(1, r.nextCursor)]);
}

export function decodeGetAuditLogResponse(bytes: Uint8Array): GetAuditLogResponse {
  const map = requireMap(decodeOne(bytes), "GetAuditLogResponse");
  const entries = requireArray(map, 0, "GetAuditLogResponse").map((entry) => {
    const m = requireMap(entry, "GetAuditLogResponse.entries[]");
    return {
      sequence: requireU32(m, 0, "AuditLogEntry"),
      principalId: requireU32(m, 1, "AuditLogEntry"),
      operationId: requireU32(m, 2, "AuditLogEntry"),
      internalResult: requireInt64(m, 3, "AuditLogEntry"),
      uptimeMs: requireInt64(m, 4, "AuditLogEntry"),
    };
  });
  return { entries, nextCursor: requireU32(map, 1, "GetAuditLogResponse") };
}
