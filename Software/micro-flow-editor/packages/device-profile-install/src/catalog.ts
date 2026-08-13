import type { DeviceProfilePackage } from "@spaghettilab/device-profile-package";

/**
 * Pre-install provenance only — a purely authoring-side tag with no wire
 * counterpart. `LIST_DEVICE_PROFILES`' `DeviceProfileSummary` is
 * `{profileId, version, hash}` alone; nothing on the wire records whether a
 * given profile came from a built-in ROM image, a locally-authored package,
 * or a marketplace index. That absence is exactly what makes "profili
 * built-in, locali e da marketplace risultano indistinguibili una volta
 * installati" (S063 § Verifiche) true — not extra code here, but the type
 * shape: `DeviceProfileSummary` (post-install) has no field to carry a
 * `ProfileSource` through even if this package wanted it to.
 */
export type ProfileSource = "built-in" | "local" | "marketplace";

export type CatalogedPackage = {
  readonly source: ProfileSource;
  readonly pkg: DeviceProfilePackage;
};

/**
 * Merges the three pre-install sources (S063 point 3) into one browsable
 * list with a single, consistent identity: `profileId@version`. Precedence
 * on a collision is built-in > local > marketplace — a built-in profile is
 * the one every Core of this firmware build already has, so it should never
 * be shadowed by a same-named local draft or a marketplace listing.
 */
export function mergeProfileCatalog(
  builtIn: readonly DeviceProfilePackage[],
  local: readonly DeviceProfilePackage[],
  marketplace: readonly DeviceProfilePackage[],
): readonly CatalogedPackage[] {
  const byIdentity = new Map<string, CatalogedPackage>();
  const sources: readonly [ProfileSource, readonly DeviceProfilePackage[]][] = [
    ["marketplace", marketplace],
    ["local", local],
    ["built-in", builtIn],
  ];
  for (const [source, packages] of sources) {
    for (const pkg of packages) {
      byIdentity.set(`${pkg.profileId}@${pkg.version}`, { source, pkg });
    }
  }
  return [...byIdentity.values()].sort((a, b) => {
    if (a.pkg.profileId !== b.pkg.profileId) return a.pkg.profileId < b.pkg.profileId ? -1 : 1;
    return a.pkg.version - b.pkg.version;
  });
}
