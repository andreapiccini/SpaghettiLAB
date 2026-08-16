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
    return pickCatalogEntry(findCatalogEntriesByTypeId(data.blockTypeId), "block");
  }
  if (data.kind === "rule") {
    return pickCatalogEntry(findCatalogEntriesByTypeId(data.ruleTypeId), "rule");
  }
  if (data.kind === "event-source") return findCatalogEntryById("native.event-source");
  return findCatalogEntryById("native.schedule");
}

function pickCatalogEntry(
  entries: readonly ProcessingCatalogEntry[],
  kind: "block" | "rule",
): ProcessingCatalogEntry | undefined {
  const ofKind = entries.filter((entry) => entry.nodeKind === kind);
  return (
    ofKind.find((entry) => entry.availability === "shipped" && (entry.fields?.length ?? 0) > 0) ??
    ofKind.find((entry) => entry.availability === "shipped") ??
    ofKind.find((entry) => (entry.fields?.length ?? 0) > 0) ??
    ofKind[0] ??
    entries[0]
  );
}

export function propertiesOf(data: DeviceProcessingNodeData): Readonly<Record<string, unknown>> {
  if (data.kind === "block" || data.kind === "rule") return data.properties;
  if (data.kind === "event-source") return data.properties ?? {};
  return {};
}
