import type { CatalogIndex, ProfileIndex } from "@spaghettilab/catalog-model";
import type { NodeTypeDescriptor } from "./node-type.js";

export type EditorModel = {
  /** Sorted by `typeId`, deduplicated — order-independent of how the source indices were built (S042 § Verifiche: "catalog order differente produce lo stesso EditorModel"). */
  readonly nodeTypes: readonly NodeTypeDescriptor[];
};

/**
 * Derives the editor's node type catalog from S041's normalized indices —
 * never from a hardcoded device/type list (S042 point 1). Order-independence
 * is inherited directly: `CatalogIndex.moduleDrivers`/`ProfileIndex.profiles`
 * are already deduplicated and sorted by S041, and this function re-sorts
 * its own merged output on top for good measure.
 *
 * `handles`/`propertySchema` come back empty for every entry: today's
 * catalog only reports `{typeId, commandCount}` per driver and
 * `{profileId, version, hash}` per profile — no per-type handle or property
 * schema data exists on the wire (S021's research note: every operation's
 * schema descriptor is unpopulated). Populating those fields honestly
 * requires that data to exist first; this function does not invent it.
 */
export function buildEditorModel(catalog: CatalogIndex, profiles: ProfileIndex): EditorModel {
  const byTypeId = new Map<string, NodeTypeDescriptor>();

  for (const driver of catalog.moduleDrivers) {
    byTypeId.set(driver.typeId, {
      typeId: driver.typeId,
      source: "module-driver",
      handles: [],
      propertySchema: [],
      requiredCapabilities: [],
    });
  }
  for (const profile of profiles.profiles) {
    byTypeId.set(profile.profileId, {
      typeId: profile.profileId,
      source: "device-profile",
      handles: [],
      propertySchema: [],
      requiredCapabilities: [],
    });
  }

  const nodeTypes = [...byTypeId.values()].sort((a, b) => (a.typeId < b.typeId ? -1 : a.typeId > b.typeId ? 1 : 0));
  return { nodeTypes };
}
