import { domainError, DomainErrorCode, type DomainError } from "./errors.js";
import type { ConnectionProfileId } from "./ids.js";
import { err, ok, type Result } from "./result.js";

/**
 * How a Core is reached — REACT_FLOW_ARCHITECTURE.md § Modello dati principale
 * lists `connectionProfileId` on `CoreBinding` but leaves the profile shape
 * to this task.
 */
export type ConnectionTransportKind = "mqtt" | "websocket" | "ble";

/**
 * A reusable, nameable way to reach a Core — referenced by `CoreBindingRecord.
 * connectionProfileId`, never embedded inline. `credentialRef` is an opaque
 * `CredentialStore` key (see `ports/credentials.ts`), not the secret itself:
 * this type has no field capable of holding a token/password/key value, so no
 * secret can enter a `Project` export, log, or error report through it — the
 * guarantee is structural, not a rule someone has to remember to follow.
 */
export type ConnectionProfile = {
  readonly connectionProfileId: ConnectionProfileId;
  readonly name: string;
  readonly transport: ConnectionTransportKind;
  readonly host: string;
  readonly port: number;
  /** Opaque `CredentialStore` reference, e.g. `"cred://mqtt-broker-01"` — never a secret value. */
  readonly credentialRef?: string;
};

export type ConnectionProfileInput = {
  readonly connectionProfileId: ConnectionProfileId;
  readonly name: string;
  readonly transport: ConnectionTransportKind;
  readonly host: string;
  readonly port: number;
  readonly credentialRef?: string;
};

const TRANSPORT_KINDS: readonly ConnectionTransportKind[] = ["mqtt", "websocket", "ble"];

function invalid(field: string, target: unknown, remediation: string): DomainError {
  return domainError({
    code: DomainErrorCode.INVALID_SCHEMA,
    path: ["connectionProfile", field],
    target: String(target),
    remediation,
  });
}

/** Validates and constructs a `ConnectionProfile`, collecting every problem found. */
export function createConnectionProfile(
  input: ConnectionProfileInput,
): Result<ConnectionProfile, DomainError[]> {
  const errors: DomainError[] = [];

  if (input.name.trim() === "") {
    errors.push(invalid("name", input.name, "Provide a non-empty name."));
  }
  if (!TRANSPORT_KINDS.includes(input.transport)) {
    errors.push(
      invalid(
        "transport",
        input.transport,
        `Use one of: ${TRANSPORT_KINDS.join(", ")}.`,
      ),
    );
  }
  if (input.host.trim() === "") {
    errors.push(invalid("host", input.host, "Provide a non-empty host."));
  }
  if (!Number.isInteger(input.port) || input.port < 1 || input.port > 65535) {
    errors.push(invalid("port", input.port, "Provide an integer port between 1 and 65535."));
  }
  if (input.credentialRef !== undefined && input.credentialRef.trim() === "") {
    errors.push(
      invalid(
        "credentialRef",
        input.credentialRef,
        "Omit credentialRef entirely, or provide a non-empty reference.",
      ),
    );
  }

  if (errors.length > 0) {
    return err(errors);
  }
  return ok({ ...input });
}
