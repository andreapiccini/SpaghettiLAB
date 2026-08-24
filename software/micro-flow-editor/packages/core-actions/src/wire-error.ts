import { domainError, type DomainError } from "@spaghettilab/domain";
import { CoreActionsErrorCode } from "./errors.js";

/** Structural check for `@spaghettilab/protocol-sdk`'s `SpaghettiClientError` — matched by shape, not `instanceof`, the same pattern `@spaghettilab/device-profile-install`/`@spaghettilab/config-deployment` use so this package doesn't need a hard dependency on that class for a couple of field reads. */
type WireError = { readonly code?: string; readonly status?: number };

function isProtocolError(e: unknown): e is WireError & { code: "PROTOCOL_ERROR"; status: number } {
  return typeof e === "object" && e !== null && (e as WireError).code === "PROTOCOL_ERROR" && typeof (e as WireError).status === "number";
}
function isClientTimeout(e: unknown): boolean {
  return typeof e === "object" && e !== null && (e as WireError).code === "TIMEOUT";
}

/** `ProtocolStatus` values relevant here (`envelope.ts`): `UNAUTHORIZED=3`, `TIMEOUT=7`, `RESOURCE_EXHAUSTED=8`. */
const STATUS_UNAUTHORIZED = 3;
const STATUS_TIMEOUT = 7;
const STATUS_RESOURCE_EXHAUSTED = 8;

export type ClassifiedWireOutcome = "PERMISSION_DENIED" | "QUEUE_FULL" | "TIMEOUT" | "REMOTE_ERROR";

/**
 * Turns a thrown wire error into one of the distinct outcomes S092 §
 * Verifiche asks for ("permission denied, queue full e job timeout sono
 * rappresentati con esito distinto, non genericamente come errore") — never
 * a single generic bucket. `SpaghettiClient`'s own client-side `TIMEOUT`
 * (`code: "TIMEOUT"`, no `status`) and the Core's remote `ProtocolStatus.TIMEOUT`
 * both classify as `"TIMEOUT"` here — both mean the same thing to a caller
 * deciding whether to retry.
 */
export function classifyWireError(cause: unknown): ClassifiedWireOutcome {
  if (isClientTimeout(cause)) return "TIMEOUT";
  if (isProtocolError(cause)) {
    if (cause.status === STATUS_UNAUTHORIZED) return "PERMISSION_DENIED";
    if (cause.status === STATUS_RESOURCE_EXHAUSTED) return "QUEUE_FULL";
    if (cause.status === STATUS_TIMEOUT) return "TIMEOUT";
  }
  return "REMOTE_ERROR";
}

export function wireFailure(code: string, path: readonly string[], target: string, remediation: string, cause?: unknown): DomainError {
  return domainError({ code, path: [...path], target, remediation, cause });
}

export { CoreActionsErrorCode };
