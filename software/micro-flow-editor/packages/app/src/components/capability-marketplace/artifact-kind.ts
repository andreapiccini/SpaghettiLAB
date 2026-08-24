/**
 * `software/roadmap/react-flow-v1/tasks/S104-marketplace-artifact-kinds.md`
 * (still `⬜ TODO`) describes an extensible `ArtifactKind` registry — filter
 * chips and per-kind behavior (`requiresPreflight`, an install strategy,
 * label/icon) meant to be derived from code, not hardcoded per screen. That
 * registry does not exist anywhere in `packages/` — confirmed by an
 * exhaustive search for `ArtifactKind` across the monorepo. This file is a
 * **local, UI-only placeholder** covering exactly the two kinds this app can
 * actually source data for today (Capability Pack via
 * `@spaghettilab/capability-marketplace`, Device Profile via
 * `@spaghettilab/device-profile-install`/`listDeviceProfiles()`) — not a
 * real registry, and not something other screens should import. Replace
 * wholesale once S104 ships.
 */
export type ArtifactKindId = "capability-pack" | "device-profile";

export type ArtifactKindDescriptor = {
  readonly id: ArtifactKindId;
  readonly label: string;
  /** Whether installing this kind routes through OTA preflight (S102/S103) — a Capability Pack ships inside a firmware image; a Device Profile is data installed directly via `INSTALL_DEVICE_PROFILE`, never an OTA. */
  readonly requiresPreflight: boolean;
};

export const ARTIFACT_KINDS: readonly ArtifactKindDescriptor[] = [
  { id: "capability-pack", label: "Capability Pack", requiresPreflight: true },
  { id: "device-profile", label: "Device Profile", requiresPreflight: false },
];
