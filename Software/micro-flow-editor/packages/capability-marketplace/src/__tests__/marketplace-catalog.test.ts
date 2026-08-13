import { describe, expect, it } from "vitest";
import { MAX_MARKETPLACE_INDEX_BYTES, parseMarketplaceIndexJson } from "../marketplace-catalog.js";
import { manifestFixture } from "./fixtures.js";

describe("parseMarketplaceIndexJson", () => {
  it("parses a well-formed index into a sorted MarketplaceCatalog", () => {
    const index = { indexHash: "abc", packs: [manifestFixture({ packId: "b", version: 1 }), manifestFixture({ packId: "a", version: 1 })] };
    const result = parseMarketplaceIndexJson(JSON.stringify(index));
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.packs.map((p) => p.packId)).toEqual(["a", "b"]);
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
    const index = { packs: [{ packId: 1 }, { packId: 2 }] };
    const result = parseMarketplaceIndexJson(JSON.stringify(index));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.length).toBe(2);
  });

  it("rejects a duplicate packId+version pair", () => {
    const index = { packs: [manifestFixture({ packId: "a", version: 1 }), manifestFixture({ packId: "a", version: 1 })] };
    const result = parseMarketplaceIndexJson(JSON.stringify(index));
    expect(result.ok).toBe(false);
  });
});
