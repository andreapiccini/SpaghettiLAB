import { describe, expect, it } from "vitest";
import { exportProfilePackage } from "@spaghettilab/device-profile-package";
import type { DeviceProfileDraft } from "@spaghettilab/device-profile-authoring-model";
import { MAX_MARKETPLACE_INDEX_BYTES, parseMarketplaceIndexJson } from "../marketplace-catalog.js";
import { manifestFixture, packIndexEntryFixture } from "./fixtures.js";

const DRAFT_FIXTURE: DeviceProfileDraft = {
  profileId: "ina219-raw",
  version: 1,
  transport: 1,
  requiredCapabilities: 0,
  maxTotalTimeMs: 100,
  maxTransactions: 4,
  maxBytes: 64,
  initOps: [],
  sampleOps: [],
  safeStopOps: [],
  sampleSchemaId: "ina219-raw",
  sampleSchemaVersion: 1,
  sampleFields: [],
};

function profileIndexEntry(overrides: Partial<DeviceProfileDraft> = {}) {
  const pkg = exportProfilePackage({ ...DRAFT_FIXTURE, ...overrides }, "test-author");
  return { kind: "device-profile", ...pkg };
}

describe("parseMarketplaceIndexJson", () => {
  it("parses a well-formed index into a sorted MarketplaceCatalog", () => {
    const index = { indexHash: "abc", packs: [packIndexEntryFixture({ packId: "b", version: 1 }), packIndexEntryFixture({ packId: "a", version: 1 })] };
    const result = parseMarketplaceIndexJson(JSON.stringify(index));
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.packs.map((p) => p.packId)).toEqual(["a", "b"]);
      expect(result.value.profiles).toEqual([]);
      expect(result.value.skipped).toEqual([]);
    }
  });

  it("rejects malformed JSON", () => {
    const result = parseMarketplaceIndexJson("{not json");
    expect(result.ok).toBe(false);
  });

  it("rejects an oversized payload before parsing", () => {
    const huge = "x".repeat(MAX_MARKETPLACE_INDEX_BYTES + 1);
    const result = parseMarketplaceIndexJson(huge);
    expect(result.ok).toBe(false);
  });

  it("collects every malformed-manifest error instead of stopping at the first", () => {
    const index = { packs: [{ kind: "firmware-capability-pack", packId: 1 }, { kind: "firmware-capability-pack", packId: 2 }] };
    const result = parseMarketplaceIndexJson(JSON.stringify(index));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.length).toBe(2);
  });

  it("rejects a duplicate packId+version pair", () => {
    const index = { packs: [packIndexEntryFixture({ packId: "a", version: 1 }), packIndexEntryFixture({ packId: "a", version: 1 })] };
    const result = parseMarketplaceIndexJson(JSON.stringify(index));
    expect(result.ok).toBe(false);
  });

  it("rejects an entry missing the mandatory kind field", () => {
    const index = { packs: [manifestFixture()] };
    const result = parseMarketplaceIndexJson(JSON.stringify(index));
    expect(result.ok).toBe(false);
  });

  describe("S104 — Device Profile artifacts and unknown kinds", () => {
    it("parses a mixed index (Capability Pack + Device Profile) into distinct lists", () => {
      const index = { packs: [packIndexEntryFixture(), profileIndexEntry()] };
      const result = parseMarketplaceIndexJson(JSON.stringify(index));
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.packs).toHaveLength(1);
        expect(result.value.profiles).toHaveLength(1);
        expect(result.value.profiles[0]!.profileId).toBe("ina219-raw");
      }
    });

    it("skips an entry with an unregistered kind, motivated with UNKNOWN_KIND, without failing the rest of the catalog", () => {
      const index = { packs: [packIndexEntryFixture(), { kind: "dashboard-widget", id: "widget-1" }] };
      const result = parseMarketplaceIndexJson(JSON.stringify(index));
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.packs).toHaveLength(1);
        expect(result.value.skipped).toHaveLength(1);
        expect(result.value.skipped[0]!.reason).toContain("UNKNOWN_KIND");
      }
    });

    it("rejects a duplicate profileId+version pair", () => {
      const index = { packs: [profileIndexEntry(), profileIndexEntry()] };
      const result = parseMarketplaceIndexJson(JSON.stringify(index));
      expect(result.ok).toBe(false);
    });

    it("rejects a malformed device-profile entry", () => {
      const index = { packs: [{ kind: "device-profile", profileId: 123 }] };
      const result = parseMarketplaceIndexJson(JSON.stringify(index));
      expect(result.ok).toBe(false);
    });
  });
});
