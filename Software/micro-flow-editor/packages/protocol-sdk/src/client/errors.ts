import { Operation, ProtocolStatus } from "../envelope.js";

export type SpaghettiClientErrorCode =
  | "TIMEOUT"
  | "CANCELLED"
  | "CORRELATION_CONFLICT"
  | "REBOOT_DURING_REQUEST"
  | "PROTOCOL_ERROR";

export type SpaghettiClientErrorInit = {
  readonly code: SpaghettiClientErrorCode;
  readonly operation?: Operation;
  readonly correlationId?: number;
  /** Set only for `code: "PROTOCOL_ERROR"` — the status the Core actually returned. */
  readonly status?: ProtocolStatus;
};

/**
 * Every failure `SpaghettiClient` can produce, distinguished by `code` so a
 * caller never has to string-match a message. `PROTOCOL_ERROR` wraps a real
 * `ProtocolStatus` the Core returned (S021's `envelope.ts`); the other codes
 * are client-side conditions the Core never reports directly (a local
 * deadline, a cancelled `AbortSignal`, an exhausted correlation ID space, or
 * a detected reboot invalidating an in-flight request's replay safety — see
 * `spaghetti-client.ts`).
 */
export class SpaghettiClientError extends Error {
  readonly code: SpaghettiClientErrorCode;
  readonly operation?: Operation;
  readonly correlationId?: number;
  readonly status?: ProtocolStatus;

  constructor(init: SpaghettiClientErrorInit) {
    const statusLabel = init.status !== undefined ? ProtocolStatus[init.status] : undefined;
    super(
      `SpaghettiClient ${init.code}` +
        (init.operation !== undefined ? ` (operation ${Operation[init.operation] ?? init.operation})` : "") +
        (statusLabel ? ` (status ${statusLabel})` : ""),
    );
    this.name = "SpaghettiClientError";
    this.code = init.code;
    this.operation = init.operation;
    this.correlationId = init.correlationId;
    this.status = init.status;
  }
}
