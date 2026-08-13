import type { CatalogIndex } from "@spaghettilab/catalog-model";

export type UsedType = { readonly typeId: string; readonly kind: "block" | "rule" | "module-driver"; readonly usedBy: string };

/**
 * The **required artifacts** view — deliberately distinct from
 * `MarketplaceCatalog` (available) and `@spaghettilab/catalog-model`'s
 * `CapabilityPackIndex` (installed), per S101 § Verifiche. A type used by
 * the Project's Device Processing graph that the installed Core does not
 * already provide.
 */
export type RequiredArtifact = {
  readonly typeId: string;
  readonly kind: "block" | "rule" | "module-driver";
  /** Node ids (or another caller-chosen label) that reference this type — for showing "why is this needed" without re-deriving it later. */
  readonly requiredBy: readonly string[];
};

/**
 * `module-driver` is the only kind this function can check against real
 * wire data — `@spaghettilab/catalog-model`'s `CatalogIndex` comes from
 * `GET_CATALOG`, which genuinely enumerates installed Module Driver
 * `typeId`s. `GET_FEATURES` (the installed Capability Pack listing) only
 * reports `moduleTypeCount` — a **count**, never the actual Block/Rule
 * `typeId`s a pack provides (confirmed against `features_ops.c` while
 * building this package) — so there is no wire-backed way to know which
 * Block/Rule types are already installed. `installedBlockRuleTypeIds` is
 * therefore caller-supplied and optional: omitting it means every `block`/
 * `rule` usage is conservatively treated as "not yet confirmed installed"
 * (required), never silently assumed present.
 */
export function computeRequiredArtifacts(used: readonly UsedType[], installedModuleDrivers: CatalogIndex, installedBlockRuleTypeIds?: ReadonlySet<string>): readonly RequiredArtifact[] {
  const installedModuleDriverIds = new Set(installedModuleDrivers.moduleDrivers.map((d) => d.typeId));

  const byTypeAndKind = new Map<string, RequiredArtifact>();
  for (const u of used) {
    const isInstalled = u.kind === "module-driver" ? installedModuleDriverIds.has(u.typeId) : (installedBlockRuleTypeIds?.has(u.typeId) ?? false);
    if (isInstalled) continue;

    const key = `${u.kind}:${u.typeId}`;
    const existing = byTypeAndKind.get(key);
    if (existing) {
      byTypeAndKind.set(key, { ...existing, requiredBy: [...existing.requiredBy, u.usedBy] });
    } else {
      byTypeAndKind.set(key, { typeId: u.typeId, kind: u.kind, requiredBy: [u.usedBy] });
    }
  }

  return [...byTypeAndKind.values()].sort((a, b) => (a.typeId === b.typeId ? a.kind.localeCompare(b.kind) : a.typeId < b.typeId ? -1 : 1));
}
