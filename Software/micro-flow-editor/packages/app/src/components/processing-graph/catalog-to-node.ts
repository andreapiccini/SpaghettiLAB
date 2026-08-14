import type { DeviceProcessingNodeData } from "@spaghettilab/device-processing-graph-model";
import { isPlaceableOnDeviceGraph, type ProcessingCatalogEntry } from "@spaghettilab/processing-block-catalog";

export const PROCESSING_BLOCK_MIME = "application/x-spaghettilab-processing-block";

export function nodeDataFromCatalogEntry(entry: ProcessingCatalogEntry, firstModuleId: string | undefined): DeviceProcessingNodeData | null {
  if (!isPlaceableOnDeviceGraph(entry) || entry.nodeKind === undefined) return null;
  switch (entry.nodeKind) {
    case "schedule":
      return { kind: "schedule", moduleNodeId: firstModuleId ?? "", periodMs: 1000, enabled: true };
    case "event-source":
      return { kind: "event-source", moduleNodeId: firstModuleId ?? "" };
    case "block":
      return { kind: "block", blockTypeId: entry.typeId ?? "", properties: {} };
    case "rule":
      return { kind: "rule", ruleTypeId: entry.typeId ?? "", properties: {} };
  }
}

export function snapToGrid(value: number, grid = 20): number {
  return Math.round(value / grid) * grid;
}
