import { domainError, err, ok, type DomainError, type Result } from "@spaghettilab/domain";
import { importProfilePackageJson, type DeviceProfilePackage } from "@spaghettilab/device-profile-package";
import { DEFAULT_ARTIFACT_KINDS, DEVICE_PROFILE_KIND, FIRMWARE_CAPABILITY_PACK_KIND, type ArtifactKindRegistry } from "./artifact-kind.js";
import { CapabilityMarketplaceErrorCode } from "./errors.js";
import type { MarketplacePackManifest, PackVersionRange } from "./manifest.js";

/** Same sandboxing rule as `@spaghettilab/device-profile-package`'s `MAX_PACKAGE_IMPORT_BYTES` — checked before `JSON.parse` runs, generous enough for a real index while still rejecting a deliberately huge payload outright. */
export const MAX_MARKETPLACE_INDEX_BYTES = 8 * 1024 * 1024;

/** One index entry the parser could not place — either its `kind` isn't a registered `ArtifactKindDescriptor` (`UNKNOWN_KIND`, S104 § Verifiche: "non fa fallire l'intero catalogo"). Kept alongside the catalog, not thrown away, so a caller can still show "N artifact di tipo sconosciuto ignorati" instead of silence. */
export type SkippedIndexEntry = {
  readonly target: string;
  readonly reason: string;
};

/**
 * The marketplace **available** catalog — deliberately a distinct type from
 * `@spaghettilab/catalog-model`'s `CapabilityPackIndex` (what's installed on
 * a Core, from `GET_FEATURES`) and from this package's `RequiredArtifact`
 * (what a Project actually needs). S101 § Verifiche requires these three to
 * "restare distinguibili in ogni stato" — giving them distinct types, not
 * just distinct field names on one shared type, is how that's enforced at
 * the type level, not just by convention. S104 adds `profiles`, kept as its
 * own array rather than merged into `packs` — a `DeviceProfilePackage` has
 * no `providedTypes`/`resourceManifest`/OTA-shaped fields at all, so folding
 * it into `MarketplacePackManifest` would mean every reader re-learns which
 * fields are meaningless for which kind.
 */
export type MarketplaceCatalog = {
  readonly indexHash: string;
  /** Sorted by `packId` then `version` — order-independent of how the index listed them. Only `kind: "firmware-capability-pack"` entries. */
  readonly packs: readonly MarketplacePackManifest[];
  /** Sorted by `profileId` then `version`. Only `kind: "device-profile"` entries. */
  readonly profiles: readonly DeviceProfilePackage[];
  /** Entries whose `kind` wasn't registered — never silently dropped, never fatal to the rest of the catalog. */
  readonly skipped: readonly SkippedIndexEntry[];
};

function invalidShape(target: string, remediation: string): DomainError {
  return domainError({ code: CapabilityMarketplaceErrorCode.INVALID_SHAPE, path: ["capability-marketplace", "index"], target, remediation });
}

function isVersionRangeShaped(value: unknown): value is PackVersionRange {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return typeof v.packId === "string" && typeof v.minVersion === "number" && (v.maxVersion === undefined || typeof v.maxVersion === "number");
}

function isManifestShaped(value: unknown): value is MarketplacePackManifest {
  if (typeof value !== "object" || value === null) return false;
  const m = value as Record<string, unknown>;
  if (typeof m.packId !== "string" || typeof m.version !== "number" || typeof m.displayName !== "string" || typeof m.hash !== "string") {
    return false;
  }
  if (typeof m.artifact !== "object" || m.artifact === null) return false;
  if (typeof m.signature !== "object" || m.signature === null) return false;
  if (typeof m.coreCompat !== "object" || m.coreCompat === null) return false;
  if (typeof m.abiCompat !== "object" || m.abiCompat === null) return false;
  if (typeof m.providedTypes !== "object" || m.providedTypes === null) return false;
  if (typeof m.resourceManifest !== "object" || m.resourceManifest === null) return false;
  if (!Array.isArray(m.dependencies) || !m.dependencies.every(isVersionRangeShaped)) return false;
  if (!Array.isArray(m.conflicts) || !m.conflicts.every(isVersionRangeShaped)) return false;
  return true;
}

/**
 * Parses a marketplace index — from a local file or an HTTPS-fetched
 * document, this package does no I/O itself (S101 point 1: "indice locale o
 * HTTPS firmato" — the caller decides which, this function only handles the
 * bytes once they're in hand, same separation `@spaghettilab/device-profile-package`
 * uses for packages). Never executes any content — `JSON.parse` and shape
 * checks only. Collects every malformed-manifest error instead of stopping
 * at the first one, and rejects a duplicate id+version pair (within a kind)
 * as a structural error rather than silently keeping the last one seen.
 *
 * Every entry now requires a `kind` (S104 point 2). A missing/non-string
 * `kind` is a malformed entry (`INVALID_SHAPE`, fatal, same as before). A
 * present but unregistered `kind` is `UNKNOWN_KIND` — collected into
 * `skipped`, never fatal: the rest of the index still parses.
 */
export function parseMarketplaceIndexJson(json: string, kinds: ArtifactKindRegistry = DEFAULT_ARTIFACT_KINDS): Result<MarketplaceCatalog, readonly DomainError[]> {
  const approximateByteLength = json.length;
  if (approximateByteLength > MAX_MARKETPLACE_INDEX_BYTES) {
    return err([
      domainError({
        code: CapabilityMarketplaceErrorCode.IMPORT_TOO_LARGE,
        path: ["capability-marketplace", "index"],
        target: `${approximateByteLength} bytes`,
        remediation: `Marketplace index exceeds the ${MAX_MARKETPLACE_INDEX_BYTES}-byte limit; rejected before parsing.`,
      }),
    ]);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch (cause) {
    return err([
      domainError({
        code: CapabilityMarketplaceErrorCode.MALFORMED_JSON,
        path: ["capability-marketplace", "index"],
        target: "json",
        remediation: "the marketplace index is not valid JSON",
        cause,
      }),
    ]);
  }

  if (typeof parsed !== "object" || parsed === null || !Array.isArray((parsed as Record<string, unknown>).packs)) {
    return err([invalidShape("index", "expected a JSON object with a packs array")]);
  }

  const rawEntries = (parsed as { packs: readonly unknown[] }).packs;
  const errors: DomainError[] = [];
  const packs: MarketplacePackManifest[] = [];
  const profiles: DeviceProfilePackage[] = [];
  const skipped: SkippedIndexEntry[] = [];
  const seenPacks = new Set<string>();
  const seenProfiles = new Set<string>();

  rawEntries.forEach((raw, i) => {
    if (typeof raw !== "object" || raw === null) {
      errors.push(invalidShape(`packs[${i}]`, "expected an object"));
      return;
    }
    const kindValue = (raw as Record<string, unknown>).kind;
    if (typeof kindValue !== "string") {
      errors.push(invalidShape(`packs[${i}]`, "missing mandatory string field \"kind\""));
      return;
    }
    const descriptor = kinds.get(kindValue);
    if (!descriptor) {
      skipped.push({ target: `packs[${i}]`, reason: `UNKNOWN_KIND: "${kindValue}" is not a registered ArtifactKind — entry skipped, the rest of the catalog remains usable` });
      return;
    }

    if (descriptor.id === FIRMWARE_CAPABILITY_PACK_KIND.id) {
      if (!isManifestShaped(raw)) {
        errors.push(invalidShape(`packs[${i}]`, "malformed or missing Capability Pack manifest fields"));
        return;
      }
      const key = `${raw.packId}@${raw.version}`;
      if (seenPacks.has(key)) {
        errors.push(
          domainError({
            code: CapabilityMarketplaceErrorCode.DUPLICATE_PACK_ID,
            path: ["capability-marketplace", "index", `packs[${i}]`],
            target: key,
            remediation: `pack "${key}" appears more than once in the index — each packId+version pair must be unique`,
          }),
        );
        return;
      }
      seenPacks.add(key);
      packs.push(raw);
    } else if (descriptor.id === DEVICE_PROFILE_KIND.id) {
      const imported = importProfilePackageJson(JSON.stringify(raw));
      if (!imported.ok) {
        errors.push(invalidShape(`packs[${i}]`, `malformed device-profile entry: ${imported.error.remediation}`));
        return;
      }
      const key = `${imported.value.profileId}@${imported.value.version}`;
      if (seenProfiles.has(key)) {
        errors.push(
          domainError({
            code: CapabilityMarketplaceErrorCode.DUPLICATE_PACK_ID,
            path: ["capability-marketplace", "index", `packs[${i}]`],
            target: key,
            remediation: `device profile "${key}" appears more than once in the index — each profileId+version pair must be unique`,
          }),
        );
        return;
      }
      seenProfiles.add(key);
      profiles.push(imported.value);
    } else {
      // A registry the caller supplied declares a kind this function doesn't know how to shape-check yet — treat like UNKNOWN_KIND rather than crashing on a descriptor this file has no branch for.
      skipped.push({ target: `packs[${i}]`, reason: `UNKNOWN_KIND: "${kindValue}" has no parser in this build of capability-marketplace — entry skipped` });
    }
  });

  if (errors.length > 0) {
    return err(errors);
  }

  const sortedPacks = [...packs].sort((a, b) => (a.packId === b.packId ? a.version - b.version : a.packId < b.packId ? -1 : 1));
  const sortedProfiles = [...profiles].sort((a, b) => (a.profileId === b.profileId ? a.version - b.version : a.profileId < b.profileId ? -1 : 1));
  const indexHash = typeof (parsed as Record<string, unknown>).indexHash === "string" ? ((parsed as Record<string, unknown>).indexHash as string) : "";
  return ok({ indexHash, packs: sortedPacks, profiles: sortedProfiles, skipped });
}
