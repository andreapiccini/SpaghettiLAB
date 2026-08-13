import { describe, expect, it } from "vitest";
import { resolveDependencies, ResolutionConflictKind } from "../dependency-resolver.js";
import type { MarketplaceCatalog } from "../marketplace-catalog.js";
import type { RequiredArtifact } from "../required-artifacts.js";
import { CORE_CONTEXT, manifestFixture } from "./fixtures.js";

const trustAll = () => true;

describe("resolveDependencies — S101 § Verifiche", () => {
  it("resolves a missing Kalman Block to the correct pack/artifact with an explicit reason", () => {
    const catalog: MarketplaceCatalog = { indexHash: "h", packs: [manifestFixture()] };
    const required: readonly RequiredArtifact[] = [{ typeId: "block.kalman", kind: "block", requiredBy: ["block-1"] }];

    const result = resolveDependencies(required, catalog, CORE_CONTEXT, { trustVerifier: trustAll });

    expect(result.kind).toBe("RESOLVED");
    if (result.kind === "RESOLVED") {
      expect(result.selections).toHaveLength(1);
      expect(result.selections[0]!.packId).toBe("pack.kalman");
      expect(result.selections[0]!.reason.length).toBeGreaterThan(0);
    }
  });

  it("fails a Modbus pack with an incompatible dependency before any transfer, with an explicit conflict reason", () => {
    const modbus = manifestFixture({
      packId: "pack.modbus",
      version: 1,
      providedTypes: { blockTypeIds: [], ruleTypeIds: ["rule.modbus-read"], moduleDriverTypeIds: [] },
      dependencies: [{ packId: "pack.transport-rtu", minVersion: 2 }],
    });
    // Only an incompatible (too-old) version of the dependency exists in the marketplace.
    const transportTooOld = manifestFixture({ packId: "pack.transport-rtu", version: 1, providedTypes: { blockTypeIds: [], ruleTypeIds: [], moduleDriverTypeIds: ["driver.rtu"] } });
    const catalog: MarketplaceCatalog = { indexHash: "h", packs: [modbus, transportTooOld] };
    const required: readonly RequiredArtifact[] = [{ typeId: "rule.modbus-read", kind: "rule", requiredBy: ["rule-1"] }];

    const result = resolveDependencies(required, catalog, CORE_CONTEXT, { trustVerifier: trustAll });

    expect(result.kind).toBe("FAILED");
    if (result.kind === "FAILED") {
      expect(result.conflicts.some((c) => c.kind === ResolutionConflictKind.MISSING_DEPENDENCY)).toBe(true);
      expect(result.conflicts[0]!.reason.length).toBeGreaterThan(0);
    }
  });

  it("fails with NO_PROVIDER, motivated, when no pack in the marketplace provides the required type", () => {
    const catalog: MarketplaceCatalog = { indexHash: "h", packs: [] };
    const required: readonly RequiredArtifact[] = [{ typeId: "block.unknown", kind: "block", requiredBy: ["block-9"] }];

    const result = resolveDependencies(required, catalog, CORE_CONTEXT, { trustVerifier: trustAll });

    expect(result.kind).toBe("FAILED");
    if (result.kind === "FAILED") {
      expect(result.conflicts[0]).toEqual({ kind: ResolutionConflictKind.NO_PROVIDER, target: "block.unknown", reason: expect.stringContaining("no marketplace pack provides") });
    }
  });

  it("fails an untrusted pack rather than silently installing it", () => {
    const catalog: MarketplaceCatalog = { indexHash: "h", packs: [manifestFixture()] };
    const required: readonly RequiredArtifact[] = [{ typeId: "block.kalman", kind: "block", requiredBy: ["block-1"] }];

    const result = resolveDependencies(required, catalog, CORE_CONTEXT, { trustVerifier: () => false });

    expect(result.kind).toBe("FAILED");
    if (result.kind === "FAILED") expect(result.conflicts[0]!.kind).toBe(ResolutionConflictKind.UNTRUSTED);
  });

  it("fails two mutually conflicting selected packs", () => {
    const a = manifestFixture({ packId: "pack.a", version: 1, providedTypes: { blockTypeIds: ["block.a"], ruleTypeIds: [], moduleDriverTypeIds: [] }, conflicts: [{ packId: "pack.b", minVersion: 1 }] });
    const b = manifestFixture({ packId: "pack.b", version: 1, providedTypes: { blockTypeIds: ["block.b"], ruleTypeIds: [], moduleDriverTypeIds: [] } });
    const catalog: MarketplaceCatalog = { indexHash: "h", packs: [a, b] };
    const required: readonly RequiredArtifact[] = [
      { typeId: "block.a", kind: "block", requiredBy: ["block-1"] },
      { typeId: "block.b", kind: "block", requiredBy: ["block-2"] },
    ];

    const result = resolveDependencies(required, catalog, CORE_CONTEXT, { trustVerifier: trustAll });

    expect(result.kind).toBe("FAILED");
    if (result.kind === "FAILED") expect(result.conflicts.some((c) => c.kind === ResolutionConflictKind.MUTUAL_CONFLICT)).toBe(true);
  });

  it("is deterministic across repeated runs with the same inputs", () => {
    const catalog: MarketplaceCatalog = { indexHash: "h", packs: [manifestFixture({ version: 1 }), manifestFixture({ version: 2 })] };
    const required: readonly RequiredArtifact[] = [{ typeId: "block.kalman", kind: "block", requiredBy: ["block-1"] }];

    const first = resolveDependencies(required, catalog, CORE_CONTEXT, { trustVerifier: trustAll });
    const second = resolveDependencies(required, catalog, CORE_CONTEXT, { trustVerifier: trustAll });

    expect(first).toEqual(second);
    if (first.kind === "RESOLVED") expect(first.selections[0]!.version).toBe(2);
  });
});
