import type { DeploymentRecordV1 } from "@spaghettilab/domain";
import type { SyncRelationship } from "./session-state.js";

export type SyncClassificationInput = {
  readonly lastDeployment: DeploymentRecordV1 | null;
  /** `canonicalProjectHash(project)` — the project's current compiled content hash. */
  readonly currentProjectHash: string;
  /** Live Config hash read from the device this sync (`GetConfigResponse.sha256`, hex), or `null` if unreadable (e.g. a blank device). */
  readonly liveConfigHash: string | null;
  /**
   * Whether the device's live catalog satisfies everything the project's
   * `requiredArtifacts` need. Resolving this for real is S042's job (the
   * compatibility engine) — not yet built — so this stays a caller-supplied
   * input rather than something this function invents an approximation for.
   */
  readonly catalogCompatible: boolean;
};

/**
 * Pure classification per `REACT_FLOW_ARCHITECTURE.md` — no I/O, so every
 * branch is exhaustively testable without a Core. `INCOMPATIBLE` and an
 * unreadable/never-deployed device both resolve conservatively to a state
 * that forces explicit reconciliation (`DIVERGED`) rather than assuming
 * compatibility from silence.
 */
export function classifySyncRelationship(input: SyncClassificationInput): SyncRelationship {
  if (!input.catalogCompatible) {
    return "INCOMPATIBLE";
  }
  if (input.liveConfigHash === null || input.lastDeployment === null) {
    return "DIVERGED";
  }
  const deployedMatchesLive = input.lastDeployment.configHash === input.liveConfigHash;
  const projectUnchangedSinceDeploy = input.lastDeployment.sourceProjectHash === input.currentProjectHash;

  if (deployedMatchesLive && projectUnchangedSinceDeploy) return "IN_SYNC";
  if (deployedMatchesLive && !projectUnchangedSinceDeploy) return "PROJECT_DIRTY";
  if (!deployedMatchesLive && projectUnchangedSinceDeploy) return "DEVICE_CHANGED";
  return "DIVERGED";
}
