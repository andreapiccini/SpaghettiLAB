import type { Clock } from "./ports/clock.js";
import type { AuditLog } from "./ports/audit.js";
import { SECRET_LIKE_KEY_PATTERN } from "./project-import-export.js";

/**
 * The fixed catalog of operations S123 requires auditing — connect,
 * validate/apply, sensitive command, profile install/remove, OTA, reset,
 * Node-RED deploy. A closed union instead of a free-form `string` (the raw
 * `AuditLog` port's `operation` field, S011) so a caller can't accidentally
 * invent an ad hoc category that then can't be filtered/reported on
 * consistently — same rationale as `PERMISSION_SCOPES` (S121).
 */
export const AUDIT_OPERATIONS = [
  "core.connect",
  "config.validate-apply",
  "core.command.sensitive",
  "profile.install",
  "profile.remove",
  "core.ota",
  "core.reset",
  "nodered.deploy",
] as const;

export type AuditOperation = (typeof AUDIT_OPERATIONS)[number];

function scrub(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(scrub);
  }
  if (typeof value !== "object" || value === null) {
    return value;
  }
  const out: Record<string, unknown> = {};
  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    out[key] = SECRET_LIKE_KEY_PATTERN.test(key) ? "[REDACTED]" : scrub(child);
  }
  return out;
}

/**
 * Records one entry in the append-only audit log (S123 punto 3), with two
 * guarantees the raw `AuditLog.record()` call does not make on its own:
 * `operation` is restricted to the fixed catalog above, and `detail` is
 * scrubbed for secret-like keys **before** it ever reaches the log —
 * including for `outcome: "failure"`, where a caller is most tempted to dump
 * raw request/response data for debugging. This is the only sanctioned way
 * to write a sensitive-operation audit entry; call sites should not call
 * `AuditLog.record()` directly for these operations.
 */
export async function recordSensitiveOperation(
  auditLog: AuditLog,
  clock: Clock,
  operation: AuditOperation,
  target: string,
  outcome: "success" | "failure",
  detail?: Record<string, unknown>,
): Promise<void> {
  await auditLog.record({
    timestamp: clock.now(),
    operation,
    target,
    outcome,
    detail: detail ? (scrub(detail) as Record<string, unknown>) : undefined,
  });
}
