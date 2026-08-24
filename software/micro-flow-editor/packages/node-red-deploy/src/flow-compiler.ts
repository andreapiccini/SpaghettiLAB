import { contentHash, type CoreBindingId } from "@spaghettilab/domain";
import { isCommandEndpoint, isNodeRedEndpoint, isRecordFieldEndpoint, type SystemAutomationEndpoint, type SystemAutomationLink } from "@spaghettilab/system-automation-graph";

/**
 * A Node-RED flow-JSON node — the plain object shape the Admin API's
 * `GET/POST /flows` accepts (`{id, type, z, ...type-specific fields,
 * wires}`). This package builds these directly; it never touches the
 * Node-RED runtime process itself, only the JSON documents the Admin API
 * exchanges (S113 point 2).
 */
export type NodeRedFlowNode = {
  readonly id: string;
  readonly type: string;
  readonly z?: string;
  readonly name?: string;
  readonly wires?: readonly (readonly string[])[];
  /** Ownership tag this package's own reconciler reads back (`reconcile.ts`) — never interpreted by Node-RED itself, which ignores unknown node properties. */
  readonly spaghettiOwned?: true;
  readonly spaghettiProjectId?: string;
  readonly [key: string]: unknown;
};

export type CompiledFlow = {
  readonly tabId: string;
  readonly nodes: readonly NodeRedFlowNode[];
};

/** Deterministic, stable across recompiles as long as its identity inputs don't change — S113 point 1's "stable node IDs", never a random/regenerated id per compile. */
function stableId(parts: Record<string, unknown>): string {
  return contentHash(parts);
}

function connectionNodeFor(coreBinding: CoreBindingId, projectId: string, connectionProfileId: string): NodeRedFlowNode {
  return {
    id: stableId({ role: "connection", coreBinding }),
    type: "spaghetti-connection",
    // `connectionProfileId` is a reference into @spaghettilab/domain's ConnectionProfile
    // store (S014) — never a secret value; the actual WebSocket URL/credentialRef is
    // resolved from that profile at deploy time, never inlined into the flow JSON
    // (S113 point 1: "Credenziali sono riferite, non esportate").
    connectionProfileId,
    spaghettiOwned: true,
    spaghettiProjectId: projectId,
  };
}

function coreBindingsOf(endpoint: SystemAutomationEndpoint): CoreBindingId | undefined {
  if (isNodeRedEndpoint(endpoint)) return undefined;
  return endpoint.coreBinding;
}

/**
 * Compiles the given links (a slice of `@spaghettilab/system-automation-graph`'s
 * graph, S111 — already-validated: compatibility/transformation checks happened
 * at authoring time, this function never re-judges them) into a deterministic
 * Node-RED flow — one tab, one shared `spaghetti-connection` config node per
 * distinct `CoreBinding` involved, and a `record source -> coordinator ->
 * command target` chain per link whose source is a record field and target is
 * a command. Every generated node is tagged `spaghettiOwned`/`spaghettiProjectId`
 * so `reconcile.ts` can tell it apart from a user's own, unrelated flows.
 */
export function compileSystemAutomationFlow(
  links: readonly SystemAutomationLink[],
  projectId: string,
  connectionProfileByCoreBinding: ReadonlyMap<CoreBindingId, string>,
): CompiledFlow {
  const tabId = stableId({ role: "tab", projectId });
  const connectionNodes = new Map<string, NodeRedFlowNode>();
  const linkNodes: NodeRedFlowNode[] = [];

  for (const link of links) {
    for (const endpoint of [link.source, link.target]) {
      const coreBinding = coreBindingsOf(endpoint);
      if (!coreBinding) continue;
      const connectionProfileId = connectionProfileByCoreBinding.get(coreBinding);
      if (!connectionProfileId) continue;
      const node = connectionNodeFor(coreBinding, projectId, connectionProfileId);
      connectionNodes.set(node.id, node);
    }

    if (!isRecordFieldEndpoint(link.source) || !isCommandEndpoint(link.target)) continue;

    const sourceConnectionId = stableId({ role: "connection", coreBinding: link.source.coreBinding });
    const targetConnectionId = stableId({ role: "connection", coreBinding: link.target.coreBinding });
    const recordSourceId = stableId({ role: "record-source", linkId: link.id });
    const coordinatorId = stableId({ role: "coordinator", linkId: link.id });
    const commandTargetId = stableId({ role: "command-target", linkId: link.id });

    linkNodes.push(
      {
        id: recordSourceId,
        type: "spaghetti-record-source",
        z: tabId,
        name: `record source (${link.id})`,
        connection: sourceConnectionId,
        sourceKey: link.source.sourceKey,
        schemaId: link.source.schemaId,
        wires: [[coordinatorId]],
        spaghettiOwned: true,
        spaghettiProjectId: projectId,
      },
      {
        id: coordinatorId,
        type: "spaghetti-coordinator",
        z: tabId,
        name: `coordinator (${link.id})`,
        linkJson: JSON.stringify(link),
        wires: [[commandTargetId], []],
        spaghettiOwned: true,
        spaghettiProjectId: projectId,
      },
      {
        id: commandTargetId,
        type: "spaghetti-command-target",
        z: tabId,
        name: `command target (${link.id})`,
        connection: targetConnectionId,
        moduleKey: link.target.moduleKey,
        commandId: link.target.commandId,
        spaghettiOwned: true,
        spaghettiProjectId: projectId,
      },
    );
  }

  return { tabId, nodes: [...connectionNodes.values(), ...linkNodes] };
}
