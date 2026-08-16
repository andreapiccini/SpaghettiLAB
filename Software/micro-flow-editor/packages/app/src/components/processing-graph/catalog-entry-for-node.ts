import type { DeviceProcessingNodeData } from "@spaghettilab/device-processing-graph-model";
import { findCatalogEntriesByTypeId, findCatalogEntryById, type ProcessingCatalogEntry } from "@spaghettilab/processing-block-catalog";

/** Catalog row this canvas node was placed from, or the firmware type_id fallback. */
export function catalogEntryForNode(data: DeviceProcessingNodeData): ProcessingCatalogEntry | undefined {
  if (data.kind === "event-source" && data.catalogEntryId) {
    const byId = findCatalogEntryById(data.catalogEntryId);
    if (byId) return byId;
  }
  if (data.kind === "block" && data.catalogEntryId) {
    const byId = findCatalogEntryById(data.catalogEntryId);
    if (byId) return byId;
  }
  if (data.kind === "block") {
    const entries = findCatalogEntriesByTypeId(data.blockTypeId);
    return entries.find((entry) => entry.nodeKind === "block") ?? entries[0];
  }
  if (data.kind === "rule") {
    const entries = findCatalogEntriesByTypeId(data.ruleTypeId);
    return entries.find((entry) => entry.nodeKind === "rule") ?? entries[0];
  }
  if (data.kind === "event-source") return findCatalogEntryById("native.event-source");
  return findCatalogEntryById("native.schedule");
}

export function propertiesOf(data: DeviceProcessingNodeData): Readonly<Record<string, unknown>> {
  if (data.kind === "block" || data.kind === "rule") return data.properties;
  if (data.kind === "event-source") return data.properties ?? {};
  return {};
}
