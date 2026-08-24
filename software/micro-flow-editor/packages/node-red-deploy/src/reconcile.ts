import type { NodeRedFlowNode } from "./flow-compiler.js";

/**
 * "Riconcilia soltanto tab/subflow/nodi posseduti dal progetto e conserva
 * flow utente estranei" (S113 point 2) — replaces every node this project
 * previously owned (`spaghettiOwned && spaghettiProjectId === projectId`)
 * with the freshly compiled set, leaving every other node in `liveNodes`
 * (a user's own flows, another project's nodes, tabs, subflows, ...)
 * untouched, in its original position. Never a full-flows overwrite.
 */
export function reconcileFlows(liveNodes: readonly NodeRedFlowNode[], compiledNodes: readonly NodeRedFlowNode[], projectId: string): readonly NodeRedFlowNode[] {
  const foreign = liveNodes.filter((n) => !(n.spaghettiOwned && n.spaghettiProjectId === projectId));
  return [...foreign, ...compiledNodes];
}

/** Node ids this project owns in `liveNodes` — useful for a caller wanting to show "what will be replaced" before deploying. */
export function ownedNodeIds(liveNodes: readonly NodeRedFlowNode[], projectId: string): readonly string[] {
  return liveNodes.filter((n) => n.spaghettiOwned && n.spaghettiProjectId === projectId).map((n) => n.id);
}
