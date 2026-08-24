import { domainError, DomainErrorCode, type DomainError } from "./errors.js";
import { projectId, type ProjectId } from "./ids.js";
import { exportProjectV1, importProjectV1, type ProjectV1 } from "./project.js";
import { err, ok, type Result } from "./result.js";
import type { UuidGenerator } from "./ports/uuid.js";

/**
 * Hard ceiling on import payload size, checked **before** `JSON.parse` runs —
 * the sandboxing this task requires. `importProjectV1`'s schema validation
 * already rejects a malformed/oversized *structure* after parsing, but a
 * sufficiently large string can exhaust memory during parsing itself, before
 * any schema check gets a chance to run. 5 MiB comfortably fits any real
 * Project (graphs are bounded by firmware resource limits) while still
 * rejecting a deliberately huge payload outright.
 */
export const MAX_PROJECT_IMPORT_BYTES = 5 * 1024 * 1024;

export type ProjectImportPreview = {
  /** The project exactly as decoded/validated/migrated — not yet persisted or ID-renamed. */
  readonly project: ProjectV1;
  /** True if `project.projectId` collides with one already present in the target store. */
  readonly isDuplicateId: boolean;
};

function tooLarge(byteLength: number): DomainError {
  return domainError({
    code: DomainErrorCode.IMPORT_TOO_LARGE,
    path: ["projectImport"],
    target: `${byteLength} bytes`,
    remediation: `Import payload exceeds the ${MAX_PROJECT_IMPORT_BYTES}-byte limit; this is rejected before parsing.`,
  });
}

/**
 * Decodes and validates an import candidate **without persisting anything**
 * — the mandatory preview step (S010/S060/S120's "mai un'importazione
 * silenziosa" convention, made concrete here): the caller inspects
 * `isDuplicateId` and decides, via `resolveProjectImportId`, before any
 * store write happens. `importProjectV1` already never executes the input —
 * it only ever calls `JSON.parse` and structural validation, no
 * `eval`/`Function`/dynamic import of any kind — so "no untrusted code runs"
 * holds regardless of payload content.
 */
export function previewProjectImport(
  json: string,
  existingProjectIds: readonly ProjectId[],
): Result<ProjectImportPreview, DomainError[]> {
  // `.length` (UTF-16 code units) rather than a real UTF-8 byte count: this
  // package targets browser and Node alike without assuming either's
  // encoding globals (`TextEncoder`/`Buffer`) are available. It is always
  // within a small constant factor of the true byte size, which is all a
  // coarse "reject a grossly oversized payload before parsing" check needs.
  const approximateByteLength = json.length;
  if (approximateByteLength > MAX_PROJECT_IMPORT_BYTES) {
    return err([tooLarge(approximateByteLength)]);
  }

  const decoded = importProjectV1(json);
  if (!decoded.ok) {
    return err(decoded.error);
  }

  const isDuplicateId = existingProjectIds.includes(decoded.value.projectId);
  return ok({ project: decoded.value, isDuplicateId });
}

/**
 * Applies the caller's decision for a duplicate ID: `"rename"` assigns a
 * fresh ID via `uuid` (never silently overwrites the existing project),
 * `"keep"` returns the project unchanged (caller has already confirmed
 * overwrite is intended, e.g. re-importing your own prior export).
 * Unrecognized top-level fields in the decoded project (from a newer schema
 * writer, or an artifact type this build doesn't know) are preserved as-is:
 * `previewProjectImport` never strips them — `validateProjectV1` casts the
 * validated raw object rather than rebuilding a clean one, so anything extra
 * survives the round trip untouched.
 */
export function resolveProjectImportId(
  preview: ProjectImportPreview,
  decision: "rename" | "keep",
  uuid: UuidGenerator,
): ProjectV1 {
  if (decision === "keep" || !preview.isDuplicateId) {
    return preview.project;
  }
  const renamed = projectId(uuid.generate());
  if (!renamed.ok) {
    // UuidGenerator is a trusted port producing well-formed UUIDs by
    // contract (see ids.test.ts) — this branch documents the invariant
    // rather than silently swallowing a real possibility.
    throw new Error("UuidGenerator produced a malformed UUID");
  }
  return { ...preview.project, projectId: renamed.value };
}

/** Shared with `audit-guard.ts`'s `recordSensitiveOperation` scrubbing. */
export const SECRET_LIKE_KEY_PATTERN = /secret|password|token|api[_-]?key|private[_-]?key/i;

/**
 * Recursively scans a value for object keys that look like they hold a raw
 * secret, returning the dotted paths found. This is a defense-in-depth net,
 * not the primary guarantee — the primary guarantee is structural: `ProjectV1`
 * has no field capable of holding a secret value in the first place (S121's
 * `ConnectionProfile.credentialRef` is an opaque reference, never embedded in
 * a Project). Used by `exportProjectSelective` to assert that guarantee
 * before finalizing an export, and by `recordSensitiveOperation` (see
 * `audit-guard.ts`) on audit `detail` payloads.
 */
export function findSuspiciousSecretLikeKeys(value: unknown, path: string[] = []): string[] {
  if (Array.isArray(value)) {
    return value.flatMap((item, i) => findSuspiciousSecretLikeKeys(item, [...path, String(i)]));
  }
  if (typeof value !== "object" || value === null) {
    return [];
  }
  const found: string[] = [];
  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    const childPath = [...path, key];
    if (SECRET_LIKE_KEY_PATTERN.test(key)) {
      found.push(childPath.join("."));
    }
    found.push(...findSuspiciousSecretLikeKeys(child, childPath));
  }
  return found;
}

export type ProjectExportOptions = {
  /**
   * Opt-in, off by default. `ProjectV1` has no image field yet (Device
   * Profile Studio, S061-S063, hasn't landed) — reserved so callers already
   * default to the safe/excluded state once it does, instead of every call
   * site needing to remember to add the flag later.
   */
  readonly includeImages?: boolean;
  /**
   * Opt-in, off by default. `ProjectV1` has no live-record field yet
   * (Runtime Monitor, S091, hasn't landed) — same forward-compatible
   * reservation as `includeImages`.
   */
  readonly includeLiveRecords?: boolean;
};

export type ProjectExportResult = {
  readonly json: string;
  /** Always empty today (see `findSuspiciousSecretLikeKeys`) — surfaced, not swallowed, if that ever stops being true. */
  readonly suspiciousKeysFound: readonly string[];
};

/**
 * Canonical selective export for a Project. `options` are accepted now so
 * the call sites that will need them (once images/live records exist in the
 * domain model) don't need to change; both default to excluded.
 */
export function exportProjectSelective(
  project: ProjectV1,
  _options: ProjectExportOptions = {},
): ProjectExportResult {
  const json = exportProjectV1(project);
  const suspiciousKeysFound = findSuspiciousSecretLikeKeys(JSON.parse(json));
  return { json, suspiciousKeysFound };
}
