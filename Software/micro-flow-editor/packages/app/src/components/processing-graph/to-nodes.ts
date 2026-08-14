import type { AuthoringMetadata, GraphState } from "@spaghettilab/domain";
import { isBlockNodeData, isRuleNodeData, moduleReferenceOf, type DeviceProcessingNodeData } from "@spaghettilab/device-processing-graph-model";
import { findCatalogEntriesByTypeId } from "@spaghettilab/processing-block-catalog";
import type { Node } from "@xyflow/react";
import { PROCESSING_NODE_KIND_CONFIG } from "./node-kinds.js";

export type ProcessingNodeUiData = {
  readonly domainId: string;
  readonly kind: DeviceProcessingNodeData["kind"];
  readonly label: string;
  readonly subtitle: string;
  readonly hasError: boolean;
};

/**
 * Direct conversion, not `@spaghettilab/react-flow-adapter`'s `toReactFlowNodes()` —
 * same reasoning as the Physical Composition Editor's `to-nodes.ts`: that helper
 * resolves every node against `EditorModel` (S042), which only knows Module
 * Driver/Device Profile `typeId`s, not Schedule/Event source/Block/Rule.
 */
export function toProcessingNodes(graphState: GraphState<"device-processing">, authoringMetadata: Readonly<Record<string, AuthoringMetadata>>, errorNodeIds: ReadonlySet<string>, moduleLabel: (moduleNodeId: string) => string): Node<ProcessingNodeUiData>[] {
  return graphState.nodes.map((node) => {
    const meta = authoringMetadata[node.id];
    const data = node.data as DeviceProcessingNodeData;
    return {
      id: node.id,
      type: "processing",
      position: meta?.position ?? { x: 0, y: 0 },
      selected: meta?.selected ?? false,
      data: {
        domainId: node.id,
        kind: data.kind,
        label: meta?.comment && meta.comment.trim() !== "" ? meta.comment : PROCESSING_NODE_KIND_CONFIG[data.kind].label,
        subtitle: subtitleFor(data, moduleLabel),
        hasError: errorNodeIds.has(node.id),
      },
    };
  });
}

function subtitleFor(data: DeviceProcessingNodeData, moduleLabel: (moduleNodeId: string) => string): string {
  const moduleRef = moduleReferenceOf(data);
  if (data.kind === "schedule") return `${moduleLabel(data.moduleNodeId)} · ogni ${data.periodMs}ms${data.enabled ? "" : " · disabilitato"}`;
  if (data.kind === "event-source") return moduleLabel(data.moduleNodeId);
  if (isBlockNodeData(data)) return findCatalogEntriesByTypeId(data.blockTypeId)[0]?.label ?? (data.blockTypeId || "—");
  if (isRuleNodeData(data)) return findCatalogEntriesByTypeId(data.ruleTypeId)[0]?.label ?? (data.ruleTypeId || "—");
  return moduleRef ?? "—";
}
