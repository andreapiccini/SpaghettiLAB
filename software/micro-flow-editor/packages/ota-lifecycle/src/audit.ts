import { recordSensitiveOperation, type AuditLog, type Clock } from "@spaghettilab/domain";

/**
 * `SECRET_LIKE_KEY_PATTERN` (`@spaghettilab/domain`'s `project-import-export.ts`,
 * reused by `audit-guard.ts`'s `recordSensitiveOperation`) matches
 * `/secret|password|token|api[_-]?key|private[_-]?key/i` — it does **not**
 * match a plain `url`/`artifactUrl` key. A Capability Pack artifact URL can
 * carry a signed query string (an expiring access token embedded as a query
 * parameter, not a key named "token"), so S103 § Implementazione point 4's
 * "senza... URL firmati sensibili" needs its own redaction, on top of the
 * shared scrubber, not a change to it (the shared pattern is reused broadly
 * and over-matching there would be a bigger blast radius than this one call
 * site needs).
 */
const URL_ORIGIN_AND_PATH = /^[a-z][a-z0-9+.-]*:\/\/[^/?#]+(?:\/[^?#]*)?/i;

export function redactSignedUrl(url: string): string {
  const match = URL_ORIGIN_AND_PATH.exec(url);
  return match ? match[0] : "[unparseable-url]";
}

export type OtaAuditDetail = {
  readonly packId?: string;
  readonly candidateVersion?: string;
  readonly transport?: string;
  readonly artifactUrl?: string;
  readonly outcome?: string;
};

/**
 * Records one OTA lifecycle event under the `"core.ota"` audit category
 * (already in `AUDIT_OPERATIONS` since S123). `detail.artifactUrl`, if
 * given, is redacted via `redactSignedUrl()` before it ever reaches
 * `recordSensitiveOperation()` — which itself still scrubs any
 * secret-like-named key on top, so both layers apply.
 */
export async function recordOtaAudit(auditLog: AuditLog, clock: Clock, target: string, outcome: "success" | "failure", detail?: OtaAuditDetail): Promise<void> {
  const scrubbedDetail = detail
    ? {
        ...detail,
        artifactUrl: detail.artifactUrl !== undefined ? redactSignedUrl(detail.artifactUrl) : undefined,
      }
    : undefined;
  await recordSensitiveOperation(auditLog, clock, "core.ota", target, outcome, scrubbedDetail);
}
