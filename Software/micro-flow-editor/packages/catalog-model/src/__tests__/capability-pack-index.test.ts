import { describe, expect, it } from "vitest";
import { normalizeCapabilityPacks } from "../capability-pack-index.js";
import type { GetFeaturesResponse } from "@spaghettilab/protocol-sdk";

describe("normalizeCapabilityPacks", () => {
  it("sorts packs by id regardless of wire order", () => {
    const response: GetFeaturesResponse = {
      featureSetHash: new Uint8Array(4).fill(1),
      packs: [
        { id: "zzz-pack", version: "1.0.0", requiredHwCaps: 0, moduleTypeCount: 1 },
        { id: "aaa-pack", version: "1.0.0", requiredHwCaps: 0, moduleTypeCount: 1 },
      ],
    };
    const index = normalizeCapabilityPacks(response);
    expect(index.packs.map((p) => p.id)).toEqual(["aaa-pack", "zzz-pack"]);
  });

  it("carries the feature set hash through unchanged", () => {
    const hash = new Uint8Array(4).fill(9);
    const index = normalizeCapabilityPacks({ featureSetHash: hash, packs: [] });
    expect(index.featureSetHash).toEqual(hash);
  });
});
