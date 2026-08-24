import type { SyncRelationship } from "@spaghettilab/core-session";

export type NodeRedSyncInput = {
  /** Hash of the project's owned nodes at the last successful `deployNodeRedFlow()`, or `null` if never deployed. */
  readonly lastDeployedFlowHash: string | null;
  /** `contentHash(compiledNodes)` — the project's current compiled flow. */
  readonly currentCompiledFlowHash: string;
  /** Hash of the project-owned subset of the *live* Node-RED flow right now, or `null` if unreadable (Node-RED offline, auth failure, ...). */
  readonly liveOwnedFlowHash: string | null;
};

/**
 * Mirrors `@spaghettilab/core-session`'s `classifySyncRelationship()`
 * exactly — same five-state `SyncRelationship`, same conservative-on-silence
 * stance (S113 point 4: "classifica IN_SYNC/DIVERGED come per Config"). Pure
 * function, no I/O, so every branch is exhaustively testable. This function
 * only classifies — nothing here triggers a deploy; "niente deploy
 * automatico al reconnect" holds structurally because there is no code path
 * from a classification result back into `deployNodeRedFlow()` in this
 * package at all.
 */
export function classifyNodeRedSync(input: NodeRedSyncInput): SyncRelationship {
  if (input.liveOwnedFlowHash === null || input.lastDeployedFlowHash === null) {
    return "DIVERGED";
  }
  const deployedMatchesLive = input.lastDeployedFlowHash === input.liveOwnedFlowHash;
  const projectUnchangedSinceDeploy = input.lastDeployedFlowHash === input.currentCompiledFlowHash;

  if (deployedMatchesLive && projectUnchangedSinceDeploy) return "IN_SYNC";
  if (deployedMatchesLive && !projectUnchangedSinceDeploy) return "PROJECT_DIRTY";
  if (!deployedMatchesLive && projectUnchangedSinceDeploy) return "DEVICE_CHANGED";
  return "DIVERGED";
}
