/**
 * A Capability Pack's declared shape in a marketplace index — never
 * observed on the Protocol V1 wire (there is no marketplace operation;
 * `GET_FEATURES` only reports what's already installed, see
 * `@spaghettilab/catalog-model`'s `CapabilityPackIndex`). This is a
 * standalone, versioned document format S101 point 1 defines: pack
 * id/version, dependencies/conflicts, artifact, hash, signature/trust,
 * Core/profile/layout compatibility, ABI/Protocol/Config compatibility,
 * provided types and a resource manifest.
 */

export type PackVersionRange = {
  readonly packId: string;
  /** Inclusive. */
  readonly minVersion: number;
  /** Inclusive; omitted means "no upper bound". */
  readonly maxVersion?: number;
};

export function versionSatisfies(range: PackVersionRange, version: number): boolean {
  if (version < range.minVersion) return false;
  if (range.maxVersion !== undefined && version > range.maxVersion) return false;
  return true;
}

export type PackArtifact = {
  readonly url: string;
  readonly sizeBytes: number;
};

/**
 * No real signing/PKI infrastructure exists for this yet — `algorithm`/
 * `signature`/`keyId` are carried through verbatim from the index exactly as
 * declared, never verified by this package itself. See `trust.ts` for the
 * caller-supplied verifier this data feeds into.
 */
export type PackSignature = {
  readonly algorithm: string;
  readonly signature: string;
  readonly keyId: string;
};

export type CoreCompat = {
  /** `GetCapabilitiesResponse.coreVariant` values this pack supports — omitted means "any variant". */
  readonly coreVariants?: readonly string[];
  /** `GetCapabilitiesResponse.resourceProfile` values this pack supports — omitted means "any profile". */
  readonly resourceProfiles?: readonly number[];
};

export type AbiCompat = {
  /** Must equal `GetCatalogResponse.protocolVersion` exactly — this SDK never speaks more than one Protocol V1 wire version at a time. */
  readonly protocolVersion: number;
  /** Must equal `GetCatalogResponse.configVersion` (the Config CBOR wire version, `CONFIG_WIRE_VERSION` in `@spaghettilab/config-compiler`) exactly. */
  readonly configWireVersion: number;
};

/** Mirrors `GET_RESOURCES`'s pool shape so a pack's cost can be checked against real Core headroom the same way `@spaghettilab/device-profile-authoring-model`'s budget check does — never a single summed number. */
export type PackResourceManifest = {
  readonly flashBytes: number;
  readonly staticRamBytes: number;
  readonly rulesUsed: number;
  readonly blocksUsed: number;
};

export type ProvidedTypes = {
  /** `device-processing-graph-model`'s `BlockNodeData.blockTypeId` values this pack provides. */
  readonly blockTypeIds: readonly string[];
  /** `device-processing-graph-model`'s `RuleNodeData.ruleTypeId` values this pack provides. */
  readonly ruleTypeIds: readonly string[];
  /** `GET_CATALOG`'s `CatalogDriverEntry.typeId` values this pack provides — the one provided-type kind this package can actually verify against real wire data (`@spaghettilab/catalog-model`'s `CatalogIndex`). */
  readonly moduleDriverTypeIds: readonly string[];
};

export type MarketplacePackManifest = {
  readonly packId: string;
  readonly version: number;
  readonly displayName: string;
  readonly artifact: PackArtifact;
  /** Declared SHA-256 hex of the artifact bytes — verified only after a real download, out of this package's scope (no I/O here). */
  readonly hash: string;
  readonly signature: PackSignature;
  readonly dependencies: readonly PackVersionRange[];
  readonly conflicts: readonly PackVersionRange[];
  readonly coreCompat: CoreCompat;
  readonly abiCompat: AbiCompat;
  readonly providedTypes: ProvidedTypes;
  readonly resourceManifest: PackResourceManifest;
};
