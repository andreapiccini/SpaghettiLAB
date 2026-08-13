import { describe, expect, it } from "vitest";
import { resolveDependencies, ResolutionConflictKind, type MarketplaceCatalog, type MarketplacePackManifest } from "@spaghettilab/capability-marketplace";

const CORE_CONTEXT = { coreVariant: "core-a", resourceProfile: 1, protocolVersion: 1, configVersion: 4 };

function manifest(overrides: Partial<MarketplacePackManifest> = {}): MarketplacePackManifest {
  return {
    packId: "pack.forged",
    version: 1,
    displayName: "Forged pack",
    artifact: { url: "https://attacker.test/pack.bin", sizeBytes: 4096 },
    hash: "deadbeef",
    signature: { algorithm: "ed25519", signature: "sig", keyId: "key-1" },
    dependencies: [],
    conflicts: [],
    coreCompat: {},
    abiCompat: { protocolVersion: 1, configWireVersion: 4 },
    providedTypes: { blockTypeIds: ["block.forged"], ruleTypeIds: [], moduleDriverTypeIds: [] },
    resourceManifest: { flashBytes: 8192, staticRamBytes: 512, rulesUsed: 0, blocksUsed: 1 },
    ...overrides,
  };
}

describe("forged marketplace metadata threat test — S124 § Verifiche", () => {
  it("never resolves a pack whose signature the trust verifier rejects — no default-trust fallback", () => {
    const catalog: MarketplaceCatalog = { indexHash: "h", packs: [manifest()] };
    const result = resolveDependencies([{ typeId: "block.forged", kind: "block", requiredBy: ["node-1"] }], catalog, CORE_CONTEXT, { trustVerifier: () => false });

    expect(result.kind).toBe("FAILED");
    if (result.kind === "FAILED") expect(result.conflicts[0]!.kind).toBe(ResolutionConflictKind.UNTRUSTED);
  });

  it("never resolves a pack at all when no trust verifier is supplied — unverifiable is never treated as trusted", () => {
    const catalog: MarketplaceCatalog = { indexHash: "h", packs: [manifest()] };
    const result = resolveDependencies([{ typeId: "block.forged", kind: "block", requiredBy: ["node-1"] }], catalog, CORE_CONTEXT);

    expect(result.kind).toBe("FAILED");
  });

  it("rejects a pack claiming ABI/protocol compatibility it doesn't actually declare correctly, even when trusted", () => {
    const forgedAbi = manifest({ abiCompat: { protocolVersion: 99, configWireVersion: 99 } });
    const catalog: MarketplaceCatalog = { indexHash: "h", packs: [forgedAbi] };
    const result = resolveDependencies([{ typeId: "block.forged", kind: "block", requiredBy: ["node-1"] }], catalog, CORE_CONTEXT, { trustVerifier: () => true });

    expect(result.kind).toBe("FAILED");
    if (result.kind === "FAILED") expect(result.conflicts[0]!.kind).toBe(ResolutionConflictKind.ABI_INCOMPATIBLE);
  });
});
