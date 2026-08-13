import type { MarketplacePackManifest } from "../manifest.js";

export function manifestFixture(overrides: Partial<MarketplacePackManifest> = {}): MarketplacePackManifest {
  return {
    packId: "pack.kalman",
    version: 1,
    displayName: "Kalman filter pack",
    artifact: { url: "https://example.test/packs/kalman-1.bin", sizeBytes: 4096 },
    hash: "deadbeef",
    signature: { algorithm: "ed25519", signature: "sig", keyId: "key-1" },
    dependencies: [],
    conflicts: [],
    coreCompat: {},
    abiCompat: { protocolVersion: 1, configWireVersion: 4 },
    providedTypes: { blockTypeIds: ["block.kalman"], ruleTypeIds: [], moduleDriverTypeIds: [] },
    resourceManifest: { flashBytes: 8192, staticRamBytes: 512, rulesUsed: 0, blocksUsed: 1 },
    ...overrides,
  };
}

export const CORE_CONTEXT = { coreVariant: "core-a", resourceProfile: 1, protocolVersion: 1, configWireVersion: 4 };
