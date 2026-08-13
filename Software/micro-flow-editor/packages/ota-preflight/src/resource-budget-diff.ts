import type { GetResourcesResponse } from "@spaghettilab/protocol-sdk";
import type { OtaCandidateManifest } from "./candidate-manifest.js";

/** One budget dimension's declared build capacity vs. the candidate's declared need. Never current usage — see the module doc comment. */
export type BudgetDelta = {
  readonly dimension: "flashImage" | "staticRam" | "stack" | "pool" | "workspace";
  readonly availableBytes: number;
  readonly requiredBytes: number;
  /** `availableBytes - requiredBytes` — negative means the candidate exceeds capacity by this many bytes. */
  readonly marginBytes: number;
};

export type ResourceBudgetComparison = {
  readonly deltas: readonly BudgetDelta[];
  readonly fits: boolean;
};

/**
 * Compares a candidate's declared budget fields against the running Core's
 * declared build capacity — both sides come from **build-time manifests**
 * (`GET_RESOURCES`'s `flashSlotBytes`/`flashImageBudgetBytes`/
 * `flashHeadroomBytes`/`staticRamBudgetBytes`, themselves sourced from
 * `struct spaghetti_resources_snapshot` <- `spaghetti_image_manifest_get()`,
 * `resources.c:172-175`), never `ResourcePool.used`/`.peak` (current
 * runtime usage). S102 § Implementazione point 2 is explicit: "senza usare
 * RAM libera corrente come prova" — this function has no code path that
 * reads `.used`/`.peak` from any pool at all, so that rule holds
 * structurally, not just by convention.
 *
 * `declaredStackBytes`/`declaredPoolBytes`/`declaredWorkspaceBytes` have no
 * equivalent "available" figure on the wire today — `GET_RESOURCES`'s
 * `rules`/`blocks`/`workspace` pools report entity-slot capacity, not raw
 * stack/pool/workspace *byte* budgets. Those three dimensions are compared
 * against `flashHeadroomBytes` as a conservative stand-in only when the
 * caller has nothing better; a caller with a real per-dimension build
 * report should pass it via `buildCapacityOverrides` instead.
 */
export function compareResourceBudget(
  candidate: OtaCandidateManifest,
  running: GetResourcesResponse,
  buildCapacityOverrides?: { readonly stackBytes?: number; readonly poolBytes?: number; readonly workspaceBytes?: number },
): ResourceBudgetComparison {
  const deltas: BudgetDelta[] = [
    delta("flashImage", running.flashImageBudgetBytes, candidate.flashImageBudgetBytes),
    delta("staticRam", running.staticRamBudgetBytes, candidate.staticRamBudgetBytes),
    delta("stack", buildCapacityOverrides?.stackBytes ?? running.flashHeadroomBytes, candidate.declaredStackBytes),
    delta("pool", buildCapacityOverrides?.poolBytes ?? running.flashHeadroomBytes, candidate.declaredPoolBytes),
    delta("workspace", buildCapacityOverrides?.workspaceBytes ?? running.flashHeadroomBytes, candidate.declaredWorkspaceBytes),
  ];
  return { deltas, fits: deltas.every((d) => d.marginBytes >= 0) };
}

function delta(dimension: BudgetDelta["dimension"], availableBytes: number, requiredBytes: number): BudgetDelta {
  return { dimension, availableBytes, requiredBytes, marginBytes: availableBytes - requiredBytes };
}
