import { describe, expect, it } from "vitest";
import { normalizeCatalogPages } from "../catalog-index.js";
import type { GetCatalogResponse } from "@spaghettilab/protocol-sdk";

function page(fingerprint: number, drivers: Array<{ typeId: string; commandCount: number }>): GetCatalogResponse {
  return {
    protocolVersion: 1,
    configVersion: 5,
    fingerprint: new Uint8Array(32).fill(fingerprint),
    drivers,
    nextCursor: 0,
    driverCount: drivers.length,
  };
}

describe("normalizeCatalogPages", () => {
  it("returns an empty, marked-complete index for zero pages when told so", () => {
    expect(normalizeCatalogPages([], true)).toEqual({
      fingerprint: new Uint8Array(0),
      moduleDrivers: [],
      complete: true,
    });
  });

  it("deduplicates and sorts module drivers by typeId regardless of page order", () => {
    const pageA = page(1, [{ typeId: "relay", commandCount: 2 }]);
    const pageB = page(1, [{ typeId: "ina219", commandCount: 3 }]);

    const forward = normalizeCatalogPages([pageA, pageB], true);
    const backward = normalizeCatalogPages([pageB, pageA], true);

    expect(forward).toEqual(backward);
    expect(forward.moduleDrivers.map((d) => d.typeId)).toEqual(["ina219", "relay"]);
  });

  it("deduplicates the same driver reported on more than one page", () => {
    const shared = { typeId: "ina219", commandCount: 3 };
    const index = normalizeCatalogPages([page(1, [shared]), page(1, [shared])], true);
    expect(index.moduleDrivers).toHaveLength(1);
  });

  it("propagates the complete flag verbatim, never inferring it", () => {
    const single = page(1, [{ typeId: "relay", commandCount: 1 }]);
    expect(normalizeCatalogPages([single], false).complete).toBe(false);
    expect(normalizeCatalogPages([single], true).complete).toBe(true);
  });

  it("uses the first page's fingerprint", () => {
    const index = normalizeCatalogPages([page(7, [])], true);
    expect(index.fingerprint).toEqual(new Uint8Array(32).fill(7));
  });
});
