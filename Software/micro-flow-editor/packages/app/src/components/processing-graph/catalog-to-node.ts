import type { DeviceProcessingNodeData } from "@spaghettilab/device-processing-graph-model";
import { defaultPropertiesFromFields, isPlaceableOnDeviceGraph, type ProcessingCatalogEntry } from "@spaghettilab/processing-block-catalog";

export const PROCESSING_BLOCK_MIME = "application/x-spaghettilab-processing-block";

let paletteDragNodeKind: DeviceProcessingNodeData["kind"] | undefined;

export function beginPaletteDrag(kind: DeviceProcessingNodeData["kind"] | undefined): void {
  paletteDragNodeKind = kind;
}

export function endPaletteDrag(): void {
  paletteDragNodeKind = undefined;
}

export function peekPaletteDragKind(): DeviceProcessingNodeData["kind"] | undefined {
  return paletteDragNodeKind;
}

export function nodeDataFromCatalogEntry(entry: ProcessingCatalogEntry, firstModuleId: string | undefined): DeviceProcessingNodeData | null {
  if (!isPlaceableOnDeviceGraph(entry) || entry.nodeKind === undefined) return null;
  switch (entry.nodeKind) {
    case "schedule":
      return { kind: "schedule", moduleNodeId: firstModuleId ?? "", periodMs: 1000, enabled: true };
    case "event-source":
      return {
        kind: "event-source",
        moduleNodeId: entry.needsModule === false ? "" : (firstModuleId ?? ""),
        catalogEntryId: entry.id,
        properties: defaultPropertiesFromFields(entry.fields ?? []),
      };
    case "block":
      return {
        kind: "block",
        blockTypeId: entry.typeId ?? "",
        catalogEntryId: entry.id,
        properties: defaultPropertiesFromFields(entry.fields ?? []),
      };
    case "rule":
      return { kind: "rule", ruleTypeId: entry.typeId ?? "", properties: {} };
  }
}

export function snapToGrid(value: number, grid = 20): number {
  return Math.round(value / grid) * grid;
}

/**
 * Blocks placed by clicking a palette entry (as opposed to dragging one onto
 * a chosen canvas spot) have no drop coordinate to snap to — cascading them
 * by node count keeps each new block visible instead of stacking every one
 * at the same fixed point, which reads as a single overlapping mess and
 * makes it look like earlier blocks vanished.
 */
export function nextSpawnPosition(existingNodeCount: number, perRow = 4, colStep = 260, rowStep = 80): { x: number; y: number } {
  const col = existingNodeCount % perRow;
  const row = Math.floor(existingNodeCount / perRow);
  return { x: 80 + col * colStep, y: 80 + row * rowStep };
}
