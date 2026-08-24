import type { OtaCandidateManifest } from "@spaghettilab/ota-preflight";
import { ConfigMigrationPolicy } from "@spaghettilab/ota-preflight";
import type { PostflightSnapshot } from "../postflight.js";

export function candidateFixture(overrides: Partial<OtaCandidateManifest> = {}): OtaCandidateManifest {
  return {
    coreVariant: "core-a",
    resourceProfile: 1,
    fwVersion: "2.0.0",
    abiVersion: 1,
    minProtocolVersion: 1,
    minConfigVersion: 4,
    packs: [{ packId: "pack.kalman", version: 1 }],
    featureSetHash: "aabbcc",
    flashSlotBytes: 1_000_000,
    flashImageBudgetBytes: 700_000,
    flashHeadroomBytes: 150_000,
    staticRamBudgetBytes: 80_000,
    declaredStackBytes: 10_000,
    declaredPoolBytes: 10_000,
    declaredWorkspaceBytes: 10_000,
    bootloaderMin: "1.0.0",
    configMigrationPolicy: ConfigMigrationPolicy.REJECT_REMOVAL,
    artifact: { url: "https://example.test/candidate.bin?token=SECRET123", sizeBytes: 700_000 },
    hash: "deadbeef",
    signature: { algorithm: "ed25519", signature: "sig", keyId: "key-1" },
    isAllSupportedBuild: false,
    providedTypeIds: new Set(["block.kalman"]),
    ...overrides,
  };
}

export function snapshotFixture(overrides: Partial<PostflightSnapshot> = {}): PostflightSnapshot {
  return {
    deviceId: new Uint8Array([1, 2, 3, 4]),
    fwVersion: "1.0.0",
    featureSetHash: new Uint8Array([0xaa, 0xbb, 0xcc]),
    packIds: ["pack.kalman"],
    catalogFingerprint: new Uint8Array([9, 9]),
    resourceReport: { flashImageBudgetBytes: 700_000, staticRamBudgetBytes: 80_000 },
    configPreserved: true,
    profilesPreserved: true,
    ...overrides,
  };
}
