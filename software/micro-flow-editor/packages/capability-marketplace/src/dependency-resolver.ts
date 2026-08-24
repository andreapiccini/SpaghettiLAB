import type { MarketplaceCatalog } from "./marketplace-catalog.js";
import type { MarketplacePackManifest } from "./manifest.js";
import { versionSatisfies } from "./manifest.js";
import type { RequiredArtifact } from "./required-artifacts.js";
import { checkPackTrust, PackTrust, type TrustVerifier } from "./trust.js";

export type CoreCompatibilityContext = {
  readonly coreVariant: string;
  readonly resourceProfile: number;
  readonly protocolVersion: number;
  readonly configWireVersion: number;
};

export type ResolvedPackSelection = {
  readonly packId: string;
  readonly version: number;
  /** Human-readable justification, always present — S101 § Implementazione point 3: "motivazione per ogni selezione". */
  readonly reason: string;
};

export const ResolutionConflictKind = {
  NO_PROVIDER: "NO_PROVIDER",
  CORE_INCOMPATIBLE: "CORE_INCOMPATIBLE",
  ABI_INCOMPATIBLE: "ABI_INCOMPATIBLE",
  UNTRUSTED: "UNTRUSTED",
  MISSING_DEPENDENCY: "MISSING_DEPENDENCY",
  MUTUAL_CONFLICT: "MUTUAL_CONFLICT",
} as const;

export type ResolutionConflictKind = (typeof ResolutionConflictKind)[keyof typeof ResolutionConflictKind];

export type ResolutionConflict = {
  readonly kind: ResolutionConflictKind;
  readonly target: string;
  /** Human-readable justification, always present — S101 § Implementazione point 3: "motivazione per ogni ... conflitto o incompatibilità". */
  readonly reason: string;
};

export type DependencyResolutionResult =
  | { readonly kind: "RESOLVED"; readonly selections: readonly ResolvedPackSelection[] }
  | { readonly kind: "FAILED"; readonly conflicts: readonly ResolutionConflict[] };

function isCoreCompatible(manifest: MarketplacePackManifest, core: CoreCompatibilityContext): boolean {
  const variantOk = manifest.coreCompat.coreVariants === undefined || manifest.coreCompat.coreVariants.includes(core.coreVariant);
  const profileOk = manifest.coreCompat.resourceProfiles === undefined || manifest.coreCompat.resourceProfiles.includes(core.resourceProfile);
  return variantOk && profileOk;
}

function isAbiCompatible(manifest: MarketplacePackManifest, core: CoreCompatibilityContext): boolean {
  return manifest.abiCompat.protocolVersion === core.protocolVersion && manifest.abiCompat.configWireVersion === core.configWireVersion;
}

/** Highest version first, then packId — deterministic candidate ordering so the same inputs always pick the same pack (S101 § Implementazione point 3: "resolver deterministico"). */
function sortCandidates(candidates: readonly MarketplacePackManifest[]): readonly MarketplacePackManifest[] {
  return [...candidates].sort((a, b) => (a.packId === b.packId ? b.version - a.version : a.packId < b.packId ? -1 : 1));
}

function candidatesProviding(typeId: string, kind: RequiredArtifact["kind"], catalog: MarketplaceCatalog): readonly MarketplacePackManifest[] {
  return sortCandidates(
    catalog.packs.filter((p) => {
      if (kind === "block") return p.providedTypes.blockTypeIds.includes(typeId);
      if (kind === "rule") return p.providedTypes.ruleTypeIds.includes(typeId);
      return p.providedTypes.moduleDriverTypeIds.includes(typeId);
    }),
  );
}

type PickResult = { readonly manifest: MarketplacePackManifest; readonly reason: string } | { readonly conflict: ResolutionConflict };

/** Walks candidates in deterministic order and returns the first one compatible+trusted, or the most informative conflict if none qualify. */
function pickFirstCompatible(candidates: readonly MarketplacePackManifest[], core: CoreCompatibilityContext, verifier: TrustVerifier | undefined, target: string, selectedReason: string): PickResult {
  if (candidates.length === 0) {
    return { conflict: { kind: ResolutionConflictKind.NO_PROVIDER, target, reason: `no marketplace pack provides "${target}"` } };
  }
  for (const candidate of candidates) {
    if (!isCoreCompatible(candidate, core)) continue;
    if (!isAbiCompatible(candidate, core)) continue;
    if (checkPackTrust(candidate, verifier) !== PackTrust.TRUSTED) continue;
    return { manifest: candidate, reason: `${selectedReason} — selected ${candidate.packId}@${candidate.version} (compatible, trusted, highest matching version)` };
  }
  const untrusted = candidates.find((c) => checkPackTrust(c, verifier) !== PackTrust.TRUSTED);
  if (untrusted) {
    return { conflict: { kind: ResolutionConflictKind.UNTRUSTED, target: `${untrusted.packId}@${untrusted.version}`, reason: `pack signature is ${checkPackTrust(untrusted, verifier)}, not trusted` } };
  }
  const incompatible = candidates.find((c) => !isCoreCompatible(c, core));
  if (incompatible) {
    return { conflict: { kind: ResolutionConflictKind.CORE_INCOMPATIBLE, target: `${incompatible.packId}@${incompatible.version}`, reason: "pack does not support this Core's variant/resource profile" } };
  }
  const abiMismatch = candidates[0]!;
  return {
    conflict: {
      kind: ResolutionConflictKind.ABI_INCOMPATIBLE,
      target: `${abiMismatch.packId}@${abiMismatch.version}`,
      reason: `pack targets protocolVersion=${abiMismatch.abiCompat.protocolVersion}/configWireVersion=${abiMismatch.abiCompat.configWireVersion}, Core runs protocolVersion=${core.protocolVersion}/configWireVersion=${core.configWireVersion}`,
    },
  };
}

/**
 * Deterministic, whole-plan-or-nothing resolution (S101 § Implementazione
 * point 3: "nessuna dipendenza implicita scaricata dopo conferma" — this
 * function computes the full transitive closure up front; there is no
 * partial result a caller could act on and then discover more downloads are
 * needed later). Checks run for every candidate in a fixed priority order
 * (compatibility, ABI, trust) so the same catalog+context always produces
 * the same selections or the same conflict, never a different outcome
 * across runs.
 */
export function resolveDependencies(
  required: readonly RequiredArtifact[],
  catalog: MarketplaceCatalog,
  core: CoreCompatibilityContext,
  options?: { readonly trustVerifier?: TrustVerifier },
): DependencyResolutionResult {
  const conflicts: ResolutionConflict[] = [];
  const selected = new Map<string, { readonly manifest: MarketplacePackManifest; readonly reason: string }>();
  const pending: MarketplacePackManifest[] = [];

  for (const r of required) {
    const candidates = candidatesProviding(r.typeId, r.kind, catalog);
    const picked = pickFirstCompatible(candidates, core, options?.trustVerifier, r.typeId, `required by ${r.requiredBy.join(", ")}`);
    if ("conflict" in picked) {
      conflicts.push(picked.conflict);
      continue;
    }
    if (!selected.has(picked.manifest.packId)) {
      selected.set(picked.manifest.packId, picked);
      pending.push(picked.manifest);
    }
  }

  while (pending.length > 0) {
    const manifest = pending.shift()!;
    for (const dep of manifest.dependencies) {
      if (selected.has(dep.packId)) continue;
      const depCandidates = sortCandidates(catalog.packs.filter((p) => p.packId === dep.packId && versionSatisfies(dep, p.version)));
      const picked = pickFirstCompatible(
        depCandidates,
        core,
        options?.trustVerifier,
        `${dep.packId}>=${dep.minVersion}${dep.maxVersion !== undefined ? `,<=${dep.maxVersion}` : ""}`,
        `dependency of ${manifest.packId}@${manifest.version}`,
      );
      if ("conflict" in picked) {
        conflicts.push({ ...picked.conflict, kind: depCandidates.length === 0 ? ResolutionConflictKind.MISSING_DEPENDENCY : picked.conflict.kind });
        continue;
      }
      selected.set(picked.manifest.packId, picked);
      pending.push(picked.manifest);
    }
  }

  for (const a of selected.values()) {
    for (const conflict of a.manifest.conflicts) {
      const conflicting = selected.get(conflict.packId);
      if (conflicting && versionSatisfies(conflict, conflicting.manifest.version)) {
        conflicts.push({
          kind: ResolutionConflictKind.MUTUAL_CONFLICT,
          target: `${a.manifest.packId}@${a.manifest.version} vs ${conflicting.manifest.packId}@${conflicting.manifest.version}`,
          reason: `${a.manifest.packId}@${a.manifest.version} declares a conflict with ${conflicting.manifest.packId} in the selected version range`,
        });
      }
    }
  }

  if (conflicts.length > 0) {
    return { kind: "FAILED", conflicts };
  }

  const selections = [...selected.values()]
    .map((s) => ({ packId: s.manifest.packId, version: s.manifest.version, reason: s.reason }))
    .sort((a, b) => (a.packId < b.packId ? -1 : a.packId > b.packId ? 1 : 0));
  return { kind: "RESOLVED", selections };
}
