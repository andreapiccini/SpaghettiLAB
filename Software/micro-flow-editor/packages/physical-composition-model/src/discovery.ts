import type { TopologyIndex } from "@spaghettilab/catalog-model";
import type { DomainError, GraphNode, Result } from "@spaghettilab/domain";
import type { DiscoveryCandidate } from "@spaghettilab/protocol-sdk";
import type { ElectricalMode, ModuleNodeData, PhysicalCompositionNodeData } from "./entities.js";
import { validateComposition, type TransportOf } from "./validate-composition.js";

/**
 * What a human still has to choose before a `DiscoveryCandidate` becomes a
 * real Module. `key` is the only field `ACCEPT_DISCOVERY`'s wire request
 * (`@spaghettilab/protocol-sdk`'s `AcceptDiscoveryRequest`) actually carries —
 * `bayId`/`railId` are authoring-only choices with no wire counterpart today
 * (S050 point 7 talks about "key/Bay/rail scelta", but only `key` travels to
 * the Core; Bay/rail placement stays a local authoring decision layered on
 * top, same honest gap already documented for Module configuration in
 * general — see this package's README).
 */
export type DiscoveryAcceptChoice = {
  readonly key: number;
  readonly bayId: number;
  readonly railId: number;
  readonly electricalMode: ElectricalMode;
  readonly properties?: Readonly<Record<string, unknown>>;
};

export type DiscoveryAcceptPreview = {
  readonly candidate: DiscoveryCandidate;
  readonly choice: DiscoveryAcceptChoice;
  /** The Module that WOULD be created. Nothing here mutates a graph or calls `ACCEPT_DISCOVERY` — a caller decides separately whether/how to apply it (S050 § Verifiche: "accettare discovery produce un diff esplicito e non applica automaticamente"). */
  readonly proposedModule: ModuleNodeData;
};

/** Pure construction — never sends `ACCEPT_DISCOVERY`, never touches a graph. `moduleKey` stays `undefined` until the real wire response comes back; see `moduleFromAcceptedDiscovery`. */
export function previewDiscoveryAccept(candidate: DiscoveryCandidate, choice: DiscoveryAcceptChoice): DiscoveryAcceptPreview {
  return {
    candidate,
    choice,
    proposedModule: {
      kind: "module",
      driverTypeId: candidate.suggestedTypeId,
      portId: candidate.portId,
      bayId: choice.bayId,
      railId: choice.railId,
      electricalMode: choice.electricalMode,
      properties: choice.properties ?? {},
    },
  };
}

/**
 * The "diff" S050 point 7 asks for: what would validating the composition
 * look like with this preview's proposed Module added, without adding it.
 * The preview node is never persisted — its id exists only for this one
 * validation pass.
 */
export function previewDiscoveryAcceptDiff(
  existingNodes: readonly GraphNode<"physical-composition", string, PhysicalCompositionNodeData>[],
  preview: DiscoveryAcceptPreview,
  topology: TopologyIndex,
  options?: {
    readonly transportOf?: TransportOf;
    readonly acknowledgedModuleNodeIds?: ReadonlySet<string>;
  },
): Result<void, readonly DomainError[]> {
  const previewNode: GraphNode<"physical-composition", string, PhysicalCompositionNodeData> = {
    layer: "physical-composition",
    id: `discovery-preview:${preview.candidate.id}`,
    data: preview.proposedModule,
  };
  return validateComposition([...existingNodes, previewNode], topology, options);
}

/**
 * Fills in the firmware-assigned key once `ACCEPT_DISCOVERY`'s response
 * (`AcceptDiscoveryResponse.moduleKey`) is actually back — never fabricated
 * ahead of the real wire round trip. The caller is expected to add the
 * result to the graph via a normal graph-editing command (e.g.
 * `@spaghettilab/react-flow-adapter`'s `addGraphNodeCommand`), which is what
 * makes this an explicit, undo-able application rather than an automatic one.
 */
export function moduleFromAcceptedDiscovery(preview: DiscoveryAcceptPreview, moduleKey: number): ModuleNodeData {
  return { ...preview.proposedModule, moduleKey };
}

/**
 * Rejecting a candidate has no side effect to model (S050 § Verifiche): it is
 * simply never accepted — no `ProjectCommand`, no `CommandStack` entry, no
 * function to call here. This comment is the documentation of that fact.
 */
