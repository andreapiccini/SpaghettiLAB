import { canonicalJson, contentHash, domainError, err, ok, type DomainError, type Result } from "@spaghettilab/domain";
import { DeviceProfileOpcode, type DeviceProfileDraft, type Instruction } from "@spaghettilab/device-profile-authoring-model";
import { DeviceProfilePackageErrorCode } from "./errors.js";

/** Same sandboxing rule as `@spaghettilab/domain`'s `previewProjectImport` — checked before `JSON.parse` runs. A Device Profile package is small (bounded op counts), so this is comfortably generous while still rejecting a deliberately huge payload outright. */
export const MAX_PACKAGE_IMPORT_BYTES = 1 * 1024 * 1024;

/**
 * A portable, canonical Device Profile package (S062 point 2) — never
 * executed on import, only structurally parsed and validated. `hash` is a
 * **local content fingerprint** of `draft` via `@spaghettilab/domain`'s
 * `contentHash` (FNV-1a over canonical JSON) — explicitly **not** the
 * firmware's own SHA-256 over installed CBOR bytes
 * (`spaghetti_device_profile.hash`, `DeviceProfileSummary.hash` on the
 * wire). Producing that byte-exact hash requires the CBOR encoder S063
 * builds; this package never claims to reproduce it (see this package's
 * README and `resolver.ts`'s `matchesInstalled` option).
 */
export type DeviceProfilePackage = {
  readonly profileId: string;
  readonly version: number;
  readonly author: string;
  readonly hash: string;
  readonly transport: number;
  readonly requiredCapabilities: number;
  /** Sorted, deduplicated opcodes actually used by `draft`'s ops — computed, never hand-declared, so it can't drift from the real content. */
  readonly opcodeDependencies: readonly number[];
  readonly draft: DeviceProfileDraft;
};

function opcodeOf(instruction: Instruction): number {
  return DeviceProfileOpcode[instruction.op];
}

function computeOpcodeDependencies(draft: DeviceProfileDraft): number[] {
  const all = [...draft.initOps, ...draft.sampleOps, ...draft.safeStopOps].map(opcodeOf);
  return [...new Set(all)].sort((a, b) => a - b);
}

/** Builds a package from a validated draft — pure construction, no I/O, no execution of `draft`'s instructions. */
export function exportProfilePackage(draft: DeviceProfileDraft, author: string): DeviceProfilePackage {
  return {
    profileId: draft.profileId,
    version: draft.version,
    author,
    hash: contentHash(draft),
    transport: draft.transport,
    requiredCapabilities: draft.requiredCapabilities,
    opcodeDependencies: computeOpcodeDependencies(draft),
    draft,
  };
}

export function exportProfilePackageJson(pkg: DeviceProfilePackage): string {
  return canonicalJson(pkg);
}

function invalidShape(target: string, remediation: string): DomainError {
  return domainError({ code: DeviceProfilePackageErrorCode.INVALID_SHAPE, path: ["device-profile-package"], target, remediation });
}

function isDraftShaped(value: unknown): value is DeviceProfileDraft {
  if (typeof value !== "object" || value === null) return false;
  const d = value as Record<string, unknown>;
  return (
    typeof d.profileId === "string" &&
    typeof d.version === "number" &&
    Array.isArray(d.initOps) &&
    Array.isArray(d.sampleOps) &&
    Array.isArray(d.safeStopOps) &&
    Array.isArray(d.sampleFields)
  );
}

/**
 * Parses and structurally validates a package **without ever executing its
 * content** — `JSON.parse` and field-shape checks only, exactly like
 * `@spaghettilab/domain`'s `previewProjectImport` (no `eval`/`Function`/
 * dynamic import of any kind, regardless of payload content). Recomputes
 * `contentHash(draft)` and rejects a mismatch against the package's declared
 * `hash` — this is what "revisione/hash del pacchetto impediscono cambiamenti
 * silenziosi" (S062 Fine task) actually checks: the package's own internal
 * consistency, not (yet) a comparison against firmware-installed bytes.
 */
export function importProfilePackageJson(json: string): Result<DeviceProfilePackage, DomainError> {
  const approximateByteLength = json.length;
  if (approximateByteLength > MAX_PACKAGE_IMPORT_BYTES) {
    return err(
      domainError({
        code: DeviceProfilePackageErrorCode.IMPORT_TOO_LARGE,
        path: ["device-profile-package"],
        target: `${approximateByteLength} bytes`,
        remediation: `Import payload exceeds the ${MAX_PACKAGE_IMPORT_BYTES}-byte limit; this is rejected before parsing.`,
      }),
    );
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch (cause) {
    return err(
      domainError({
        code: DeviceProfilePackageErrorCode.MALFORMED_JSON,
        path: ["device-profile-package"],
        target: "json",
        remediation: "the import payload is not valid JSON",
        cause,
      }),
    );
  }

  if (typeof parsed !== "object" || parsed === null) {
    return err(invalidShape("package", "expected a JSON object"));
  }
  const p = parsed as Record<string, unknown>;
  if (typeof p.profileId !== "string" || typeof p.version !== "number" || typeof p.hash !== "string" || !isDraftShaped(p.draft)) {
    return err(invalidShape("package", "missing or malformed profileId/version/hash/draft"));
  }

  const pkg = parsed as DeviceProfilePackage;
  const recomputedHash = contentHash(pkg.draft);
  if (recomputedHash !== pkg.hash) {
    return err(
      domainError({
        code: DeviceProfilePackageErrorCode.HASH_MISMATCH,
        path: ["device-profile-package", "hash"],
        target: pkg.hash,
        remediation: `declared hash "${pkg.hash}" does not match the recomputed content hash "${recomputedHash}" — the package may have been edited after export`,
      }),
    );
  }

  return ok(pkg);
}
