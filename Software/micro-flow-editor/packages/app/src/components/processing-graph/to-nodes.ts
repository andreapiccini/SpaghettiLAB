import type { AuthoringMetadata, GraphState } from "@spaghettilab/domain";
import { isBlockNodeData, isRuleNodeData, moduleReferenceOf, type DeviceProcessingNodeData } from "@spaghettilab/device-processing-graph-model";
import { findCatalogEntriesByTypeId } from "@spaghettilab/processing-block-catalog";
import type { Node } from "@xyflow/react";
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
export function toProcessingNodes(graphState: GraphState<"device-processing">, authoringMetadata: Readonly<Record<string, AuthoringMetadata>>, errorNodeIds: ReadonlySet<string>, moduleLabel: (moduleNodeId: string) => string): Node<ProcessingNodeUiData>[] {
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
  if (isBlockNodeData(data)) return configuredSubtitle(data.blockTypeId, data.properties) ?? findCatalogEntriesByTypeId(data.blockTypeId)[0]?.label ?? (data.blockTypeId || "—");
  if (isRuleNodeData(data)) return configuredSubtitle(data.ruleTypeId, data.properties) ?? findCatalogEntriesByTypeId(data.ruleTypeId)[0]?.label ?? (data.ruleTypeId || "—");
  return moduleRef ?? "—";
}

/**
 * A live preview of what a Block/Rule actually does, read straight from its
 * configured `properties` — so "IF Condition" on the canvas reads "> 30"
 * instead of the generic catalog label, without opening the Inspector.
 * GET_CATALOG has no field schema (NodeInspector.tsx's own `PropertiesEditor`
 * comment), so this can only cover typeIds whose real field_id meaning is
 * known from firmware source — currently just `threshold`
 * (`Firmware/core/spaghetti_rules/threshold/threshold.h`): field_id 3/4 are
 * the hysteresis band's LOWER/UPPER bounds. Every other typeId still falls
 * back to the plain catalog label.
 */
function configuredSubtitle(typeId: string, properties: Readonly<Record<string, unknown>>): string | undefined {
  if (typeId !== "threshold") return undefined;
  const lower = properties["3"];
  const upper = properties["4"];
  if (typeof lower !== "bigint" || typeof upper !== "bigint") return undefined;
  return lower === upper ? `soglia ${upper}` : `${lower} … ${upper}`;
}
