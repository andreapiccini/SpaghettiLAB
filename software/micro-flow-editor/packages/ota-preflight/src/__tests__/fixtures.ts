import type { GetResourcesResponse } from "@spaghettilab/protocol-sdk";
import { ConfigMigrationPolicy, type OtaCandidateManifest } from "../candidate-manifest.js";
import type { CoreOtaContext } from "../preflight.js";
import { UpdateState } from "../update-coordinator-state.js";

export function resourcesFixture(overrides: Partial<GetResourcesResponse> = {}): GetResourcesResponse {
  const pool = { capacity: 10, used: 3, peak: 5 };
  return {
    featureSetHash: new Uint8Array([1]),
    modules: pool,
    rules: pool,
    blocks: pool,
    profiles: pool,
    records: pool,
    workspace: pool,
    allocationFailures: 0,
    flashSlotBytes: 1_000_000,
    flashImageBudgetBytes: 800_000,
    flashHeadroomBytes: 200_000,
    staticRamBudgetBytes: 100_000,
    ...overrides,
  };
}

export function candidateFixture(overrides: Partial<OtaCandidateManifest> = {}): OtaCandidateManifest {
  return {
    coreVariant: "core-a",
    resourceProfile: 1,
    fwVersion: "2.0.0",
    abiVersion: 1,
    minProtocolVersion: 1,
    minConfigVersion: 4,
    packs: [{ packId: "pack.kalman", version: 1 }],
    featureSetHash: "hash-abc",
    flashSlotBytes: 1_000_000,
    flashImageBudgetBytes: 700_000,
    flashHeadroomBytes: 150_000,
    staticRamBudgetBytes: 80_000,
    declaredStackBytes: 10_000,
    declaredPoolBytes: 10_000,
    declaredWorkspaceBytes: 10_000,
    bootloaderMin: "1.0.0",
    configMigrationPolicy: ConfigMigrationPolicy.REJECT_REMOVAL,
    artifact: { url: "https://example.test/candidate.bin", sizeBytes: 700_000 },
    hash: "deadbeef",
    signature: { algorithm: "ed25519", signature: "sig", keyId: "key-1" },
    isAllSupportedBuild: false,
    providedTypeIds: new Set(["block.kalman"]),
    ...overrides,
  };
}

export function coreContextFixture(overrides: Partial<CoreOtaContext> = {}): CoreOtaContext {
  return {
    coreVariant: "core-a",
    resourceProfile: 1,
    protocolVersion: 1,
    configVersion: 4,
    currentFwVersion: "1.0.0",
    updateState: UpdateState.IDLE,
    resources: resourcesFixture(),
    ...overrides,
  };
}
