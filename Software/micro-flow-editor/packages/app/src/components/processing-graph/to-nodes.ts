import type { AuthoringMetadata, GraphState } from "@spaghettilab/domain";
import { isBlockNodeData, isRuleNodeData, moduleReferenceOf, type DeviceProcessingNodeData } from "@spaghettilab/device-processing-graph-model";
import { formatFieldsSubtitle } from "@spaghettilab/processing-block-catalog";
import type { Node } from "@xyflow/react";
import { catalogEntryForNode, propertiesOf } from "./catalog-entry-for-node.js";
import { formatConfiguredSubtitle } from "./configured-subtitle.js";
import { NODE_HEIGHT, NODE_WIDTH } from "./layout-constants.js";
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
export function toProcessingNodes(
  graphState: GraphState<"device-processing">,
  authoringMetadata: Readonly<Record<string, AuthoringMetadata>>,
  errorNodeIds: ReadonlySet<string>,
  moduleLabel: (moduleNodeId: string) => string,
  fieldLabel: (moduleNodeId: string, fieldId: number) => string = (_moduleNodeId, fieldId) => String(fieldId),
): Node<ProcessingNodeUiData>[] {
  const titles = new Map<string, string>();
  for (const node of graphState.nodes) {
    titles.set(node.id, canvasTitle(node.data as DeviceProcessingNodeData, authoringMetadata[node.id]));
  }

  return graphState.nodes.map((node) => {
    const meta = authoringMetadata[node.id];
    const data = node.data as DeviceProcessingNodeData;
    return {
      id: node.id,
      type: "processing",
      position: meta?.position ?? { x: 0, y: 0 },
      selected: meta?.selected ?? false,
      // Explicit top-level dimensions (React Flow's own ResizeObserver corrects
      // these once the DOM settles) — any node that becomes a container's child
      // (parentId, see ProcessingGraphScreen) renders `visibility: hidden` until
      // React Flow considers it measured; a plain top-level node never hits that
      // gate, which is why this went unnoticed until blocks started getting
      // reparented into event containers.
      width: NODE_WIDTH,
      height: NODE_HEIGHT,
      data: {
        domainId: node.id,
        kind: data.kind,
        label: titles.get(node.id) ?? PROCESSING_NODE_KIND_CONFIG[data.kind].label,
        subtitle: subtitleFor(node.id, data, graphState, titles, moduleLabel, fieldLabel),
        hasError: errorNodeIds.has(node.id),
      },
    };
  });
}

function canvasTitle(data: DeviceProcessingNodeData, meta: AuthoringMetadata | undefined): string {
  if (meta?.comment && meta.comment.trim() !== "") return meta.comment.trim();
  const entry = catalogEntryForNode(data);
  if (entry) return entry.label;
  return PROCESSING_NODE_KIND_CONFIG[data.kind].label;
}

function subtitleFor(
  nodeId: string,
  data: DeviceProcessingNodeData,
  graphState: GraphState<"device-processing">,
  titles: ReadonlyMap<string, string>,
  moduleLabel: (moduleNodeId: string) => string,
  fieldLabel: (moduleNodeId: string, fieldId: number) => string,
): string {
  const entry = catalogEntryForNode(data);
  const placedId = data.kind === "block" || data.kind === "event-source" ? data.catalogEntryId : undefined;
  const placed = placedId ? entry : undefined;
  const fromFields = placed?.fields?.length ? formatFieldsSubtitle(placed.fields, propertiesOf(data)) : undefined;

  if (data.kind === "schedule") return `${moduleLabel(data.moduleNodeId)} · ogni ${data.periodMs}ms${data.enabled ? "" : " · disabilitato"}`;
  if (data.kind === "event-source") {
    const module = data.moduleNodeId.trim() !== "" ? moduleLabel(data.moduleNodeId) : undefined;
    return [fromFields, module].filter((part): part is string => Boolean(part)).join(" · ") || entry?.subtitle || "—";
  }
  if (isBlockNodeData(data)) {
    const input = incomingLabel(nodeId, graphState, titles);
    if (fromFields) return input ? `${input} ${fromFields}` : fromFields;
    return formatConfiguredSubtitle("block", data.blockTypeId, data.properties, input) ?? entry?.subtitle ?? entry?.label ?? (data.blockTypeId !== "" ? data.blockTypeId : "—");
  }
  if (isRuleNodeData(data)) {
    const source = data.sourceReference
      ? `${moduleLabel(data.sourceReference.moduleNodeId)}.${fieldLabel(data.sourceReference.moduleNodeId, data.sourceReference.fieldId)}`
      : undefined;
    return formatConfiguredSubtitle("rule", data.ruleTypeId, data.properties, source) ?? entry?.subtitle ?? entry?.label ?? "—";
  }
  return moduleReferenceOf(data) ?? "—";
}

function incomingLabel(nodeId: string, graphState: GraphState<"device-processing">, titles: ReadonlyMap<string, string>): string | undefined {
  const names = [
    ...new Set(
      graphState.edges
        .filter((edge) => edge.target === nodeId)
        .map((edge) => titles.get(edge.source)?.trim())
        .filter((name): name is string => Boolean(name)),
    ),
  ];
  if (names.length === 0) return undefined;
  return names.join(", ");
}
