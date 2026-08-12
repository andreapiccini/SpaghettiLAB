import { domainError, DomainErrorCode, type DomainError } from "./errors.js";
import { err, ok, type Result } from "./result.js";

/**
 * Every operation the app can preemptively gate — grouped by the same areas
 * UX-S090/UX-S120 document (Core connect/command/OTA, Node-RED deploy/manage,
 * project import/export, admin ops). Adding a new gated operation means
 * adding a scope here first, so the matrix stays the single source of truth
 * instead of being reimplemented ad hoc per screen.
 */
export const PERMISSION_SCOPES = [
  "core.connect",
  "core.command.execute",
  "core.ota.install",
  "core.admin.factory-reset",
  "core.admin.maintenance",
  "core.admin.connectivity-policy",
  "core.admin.lease",
  "core.admin.credential-provisioning",
  "nodered.deploy",
  "nodered.manage",
  "project.import",
  "project.export",
] as const;

export type PermissionScope = (typeof PERMISSION_SCOPES)[number];

/** The scopes granted to the current user/session, as known locally. */
export type PermissionSet = ReadonlySet<PermissionScope>;

/**
 * Checks a scope against a locally-known `PermissionSet`. This can only
 * disable an operation *preemptively*, in the UI, before anything is sent —
 * it is never the authority on whether the operation actually succeeds:
 * REACT_FLOW_ARCHITECTURE.md's Core/Node-RED remain the real enforcement
 * point, and this check can go stale (e.g. permissions revoked remotely)
 * without the local `PermissionSet` having been refreshed yet.
 */
export function checkPermission(
  granted: PermissionSet,
  scope: PermissionScope,
): Result<void, DomainError> {
  if (granted.has(scope)) {
    return ok(undefined);
  }
  return err(
    domainError({
      code: DomainErrorCode.PERMISSION_DENIED,
      path: ["permission", scope],
      target: scope,
      remediation:
        "This is a local, preemptive check, not remote enforcement: request the scope " +
        `"${scope}" before retrying, or ask an operator to grant it.`,
    }),
  );
}
