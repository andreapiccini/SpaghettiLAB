import type { OtaCandidateManifest } from "./candidate-manifest.js";
import { preflightOtaCandidate, type CoreOtaContext, type PreflightOptions, type PreflightResult } from "./preflight.js";

export type BuildSelectionAttempt = { readonly candidate: OtaCandidateManifest; readonly preflight: PreflightResult };

export type BuildSelectionResult =
  | { readonly kind: "SELECTED"; readonly candidate: OtaCandidateManifest; readonly preflight: PreflightResult }
  | { readonly kind: "NO_CANDIDATE_FITS"; readonly attempts: readonly BuildSelectionAttempt[] };

function providesAll(candidate: OtaCandidateManifest, requiredPackIds: ReadonlySet<string>): boolean {
  const packIds = new Set(candidate.packs.map((p) => p.packId));
  return [...requiredPackIds].every((id) => packIds.has(id));
}

/**
 * "Permetti build all-supported quando il manifest entra; altrimenti
 * seleziona immagini composte già firmate" (S102 § Implementazione point
 * 3) — tries the `isAllSupportedBuild` candidate first (if one is offered
 * and provides every required pack), falling back to composed candidates
 * ordered smallest-declared-flash-budget-first, deterministically
 * tie-broken by `packs` id list. Every candidate this function considers is
 * already signed and pre-built — this package never compiles firmware; the
 * V1 constraint "La V1 non compila firmware nel browser" holds by
 * construction, there is no code path here that could build an image.
 */
export function selectBuildVariant(requiredPackIds: ReadonlySet<string>, candidates: readonly OtaCandidateManifest[], core: CoreOtaContext, options?: PreflightOptions): BuildSelectionResult {
  const eligible = candidates.filter((c) => providesAll(c, requiredPackIds));

  const allSupported = eligible.filter((c) => c.isAllSupportedBuild);
  const composed = eligible
    .filter((c) => !c.isAllSupportedBuild)
    .sort((a, b) => (a.flashImageBudgetBytes !== b.flashImageBudgetBytes ? a.flashImageBudgetBytes - b.flashImageBudgetBytes : a.packs.map((p) => p.packId).join(",").localeCompare(b.packs.map((p) => p.packId).join(","))));

  const ordered = [...allSupported, ...composed];
  const attempts: BuildSelectionAttempt[] = [];

  for (const candidate of ordered) {
    const preflight = preflightOtaCandidate(candidate, core, options);
    attempts.push({ candidate, preflight });
    if (preflight.kind === "READY") {
      return { kind: "SELECTED", candidate, preflight };
    }
  }

  return { kind: "NO_CANDIDATE_FITS", attempts };
}
