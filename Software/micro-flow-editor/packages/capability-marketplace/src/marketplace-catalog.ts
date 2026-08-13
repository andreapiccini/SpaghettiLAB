import { domainError, err, ok, type DomainError, type Result } from "@spaghettilab/domain";
import { CapabilityMarketplaceErrorCode } from "./errors.js";
import type { MarketplacePackManifest, PackVersionRange } from "./manifest.js";

/** Same sandboxing rule as `@spaghettilab/device-profile-package`'s `MAX_PACKAGE_IMPORT_BYTES` — checked before `JSON.parse` runs, generous enough for a real index while still rejecting a deliberately huge payload outright. */
export const MAX_MARKETPLACE_INDEX_BYTES = 8 * 1024 * 1024;

/**
 * The marketplace **available** catalog — deliberately a distinct type from
 * `@spaghettilab/catalog-model`'s `CapabilityPackIndex` (what's installed on
 * a Core, from `GET_FEATURES`) and from this package's `RequiredArtifact`
 * (what a Project actually needs). S101 § Verifiche requires these three to
 * "restare distinguibili in ogni stato" — giving them distinct types, not
 * just distinct field names on one shared type, is how that's enforced at
 * the type level, not just by convention.
 */
export type MarketplaceCatalog = {
  readonly indexHash: string;
  /** Sorted by `packId` then `version` — order-independent of how the index listed them. */
  readonly packs: readonly MarketplacePackManifest[];
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
 * at the first one, and rejects a duplicate `packId`+`version` pair as a
 * structural error rather than silently keeping the last one seen.
 */
export function parseMarketplaceIndexJson(json: string): Result<MarketplaceCatalog, readonly DomainError[]> {
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

  const rawPacks = (parsed as { packs: readonly unknown[] }).packs;
  const errors: DomainError[] = [];
  const packs: MarketplacePackManifest[] = [];
  const seen = new Set<string>();

  rawPacks.forEach((raw, i) => {
    if (!isManifestShaped(raw)) {
      errors.push(invalidShape(`packs[${i}]`, "malformed or missing manifest fields"));
      return;
    }
    const key = `${raw.packId}@${raw.version}`;
    if (seen.has(key)) {
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
    seen.add(key);
    packs.push(raw);
  });

  if (errors.length > 0) {
    return err(errors);
  }

  const sorted = [...packs].sort((a, b) => (a.packId === b.packId ? a.version - b.version : a.packId < b.packId ? -1 : 1));
  const indexHash = typeof (parsed as Record<string, unknown>).indexHash === "string" ? ((parsed as Record<string, unknown>).indexHash as string) : "";
  return ok({ indexHash, packs: sorted });
}
