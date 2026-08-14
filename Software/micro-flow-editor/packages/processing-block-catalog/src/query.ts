import { PROCESSING_CATALOG_CATEGORIES } from "./categories.js";
import { PROCESSING_BLOCK_CATALOG } from "./entries.js";
import type { ProcessingCatalogEntry } from "./types.js";

const PLACEABLE_RUNTIMES = new Set(["core-block", "core-rule", "core-schedule", "core-event"]);
const PLACEABLE_AVAILABILITY = new Set(["shipped", "pack", "planned"]);

export function isPlaceableOnDeviceGraph(entry: ProcessingCatalogEntry): boolean {
  return PLACEABLE_RUNTIMES.has(entry.runtime) && PLACEABLE_AVAILABILITY.has(entry.availability);
}

export function findCatalogEntryById(id: string): ProcessingCatalogEntry | undefined {
  return PROCESSING_BLOCK_CATALOG.find((e) => e.id === id);
}

export function findCatalogEntryByAppblocksId(appblocksId: string): ProcessingCatalogEntry | undefined {
  return PROCESSING_BLOCK_CATALOG.find((e) => e.appblocksId === appblocksId);
}

export function findCatalogEntriesByTypeId(typeId: string): readonly ProcessingCatalogEntry[] {
  return PROCESSING_BLOCK_CATALOG.filter((e) => e.typeId === typeId);
}

export function searchCatalog(query: string): readonly ProcessingCatalogEntry[] {
  const q = query.trim().toLowerCase();
  if (q === "") return PROCESSING_BLOCK_CATALOG;
  return PROCESSING_BLOCK_CATALOG.filter((e) =>
    [e.label, e.subtitle, e.notes, e.typeId, e.appblocksId, e.id, e.packId]
      .filter((s): s is string => s !== undefined && s !== "")
      .some((s) => s.toLowerCase().includes(q)),
  );
}

export function groupCatalogByCategory(
  entries: readonly ProcessingCatalogEntry[] = PROCESSING_BLOCK_CATALOG,
): readonly { readonly category: (typeof PROCESSING_CATALOG_CATEGORIES)[number]; readonly entries: readonly ProcessingCatalogEntry[] }[] {
  return PROCESSING_CATALOG_CATEGORIES.map((category) => ({
    category,
    entries: entries.filter((e) => e.category === category.id),
  })).filter((group) => group.entries.length > 0);
}

/** Firmware `type_id` values that current Core images / packs actually register. */
export function shippedTypeIds(): ReadonlySet<string> {
  const ids = new Set<string>();
  for (const entry of PROCESSING_BLOCK_CATALOG) {
    if ((entry.availability === "shipped" || entry.availability === "pack") && entry.typeId) {
      ids.add(entry.typeId);
    }
  }
  return ids;
}

export function catalogEntriesForNodeKind(
  kind: "schedule" | "event-source" | "block" | "rule",
): readonly ProcessingCatalogEntry[] {
  return PROCESSING_BLOCK_CATALOG.filter((e) => e.nodeKind === kind && isPlaceableOnDeviceGraph(e));
}

export function unavailableReason(entry: ProcessingCatalogEntry): string | undefined {
  if (isPlaceableOnDeviceGraph(entry)) return undefined;
  return entry.notes;
}
