import { Operation, type AuditLogEntry, type GetAuditLogResponse } from "@spaghettilab/protocol-sdk";

const OPERATION_NAME_BY_ID: Record<number, string> = Object.fromEntries(
  Object.entries(Operation)
    .filter(([, v]) => typeof v === "number")
    .map(([name, id]) => [id as number, name]),
);

export type AuditLogEntryView = {
  readonly sequence: number;
  readonly principalId: number;
  /** `operation.js`'s `Operation` enum name, or `"UNKNOWN(<id>)"` for an operation id this SDK build doesn't know yet. */
  readonly operation: string;
  /** Raw firmware errno (`internalResult`, `int32` per `audit.ts`) — never remapped to `ProtocolStatus` here, since it is an internal syscall result, not necessarily the envelope status the caller saw. */
  readonly internalResultRaw: bigint;
  readonly uptimeMs: bigint;
};

export function describeAuditEntry(e: AuditLogEntry): AuditLogEntryView {
  return {
    sequence: e.sequence,
    principalId: e.principalId,
    operation: OPERATION_NAME_BY_ID[e.operationId] ?? `UNKNOWN(${e.operationId})`,
    internalResultRaw: e.internalResult,
    uptimeMs: e.uptimeMs,
  };
}

export type AuditLogView = {
  readonly entries: readonly AuditLogEntryView[];
  readonly nextCursor: number;
};

export function describeAuditLog(r: GetAuditLogResponse): AuditLogView {
  return { entries: r.entries.map(describeAuditEntry), nextCursor: r.nextCursor };
}
