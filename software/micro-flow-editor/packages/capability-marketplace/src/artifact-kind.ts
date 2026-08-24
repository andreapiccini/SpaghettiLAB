/**
 * S104: the marketplace index is discriminated by `kind`, so a new
 * downloadable artifact type registers a descriptor here instead of adding
 * a `switch (isFirmwarePack ? ... : ...)` scattered across the resolver/
 * preflight/UI. Every entry in a parsed index (`marketplace-catalog.ts`)
 * must declare a `kind` matching one of these ids — an unrecognized one is
 * skipped with `UNKNOWN_KIND`, never a fatal parse error for the whole
 * catalog (S104 § Verifiche).
 */
export const ArtifactInstallStrategy = {
  /** A firmware image, transferred and applied via `@spaghettilab/ota-preflight`/`ota-lifecycle` (S102/S103). */
  OTA_SIGNED_IMAGE: "ota-signed-image",
  /** Data only, installed via `INSTALL_DEVICE_PROFILE` (S063) — never flashed, never triggers OTA preflight. */
  INSTALL_DEVICE_PROFILE: "install-device-profile",
  /** Not installed onto a Core at all — merged into the authoring Project (e.g. a shareable graph fragment). No real artifact of this strategy exists yet; reserved so a future kind doesn't need a new enum member. */
  PROJECT_IMPORT: "project-import",
} as const;

export type ArtifactInstallStrategy = (typeof ArtifactInstallStrategy)[keyof typeof ArtifactInstallStrategy];

export type ArtifactKindDescriptor = {
  readonly id: string;
  readonly label: string;
  readonly installStrategy: ArtifactInstallStrategy;
  /** Whether installing this kind must go through OTA preflight (S102) first — always `false` for anything that isn't `ota-signed-image`; kept as its own field (not derived from `installStrategy`) so a future strategy can opt out even while shipping firmware bytes, without this package guessing. */
  readonly requiresOtaPreflight: boolean;
};

export const FIRMWARE_CAPABILITY_PACK_KIND: ArtifactKindDescriptor = {
  id: "firmware-capability-pack",
  label: "Capability Pack",
  installStrategy: ArtifactInstallStrategy.OTA_SIGNED_IMAGE,
  requiresOtaPreflight: true,
};

export const DEVICE_PROFILE_KIND: ArtifactKindDescriptor = {
  id: "device-profile",
  label: "Device Profile",
  installStrategy: ArtifactInstallStrategy.INSTALL_DEVICE_PROFILE,
  requiresOtaPreflight: false,
};

export type ArtifactKindRegistry = ReadonlyMap<string, ArtifactKindDescriptor>;

/** The two kinds this codebase can actually source data for today. A caller wanting a third (e.g. a future `dashboard-widget`) builds its own `ArtifactKindRegistry` — `new Map([...DEFAULT_ARTIFACT_KINDS, [id, descriptor]])` — rather than this package guessing at a kind it has no real data model for. */
export const DEFAULT_ARTIFACT_KINDS: ArtifactKindRegistry = new Map([FIRMWARE_CAPABILITY_PACK_KIND, DEVICE_PROFILE_KIND].map((k) => [k.id, k] as const));
