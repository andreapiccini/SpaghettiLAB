import { describe, expect, it } from "vitest";
import { normalizeProfilePages } from "../profile-index.js";
import type { ListDeviceProfilesResponse } from "@spaghettilab/protocol-sdk";

function page(profiles: Array<{ profileId: string; version: number }>): ListDeviceProfilesResponse {
  return {
    profiles: profiles.map((p) => ({ ...p, hash: new Uint8Array(4).fill(1) })),
    nextCursor: 0,
  };
}

describe("normalizeProfilePages", () => {
  it("is order-independent across pages", () => {
    const pageA = page([{ profileId: "bme280", version: 1 }]);
    const pageB = page([{ profileId: "ina219", version: 1 }]);

    expect(normalizeProfilePages([pageA, pageB], true)).toEqual(normalizeProfilePages([pageB, pageA], true));
  });

  it("keeps distinct versions of the same profileId as separate entries", () => {
    const index = normalizeProfilePages(
      [page([{ profileId: "bme280", version: 1 }, { profileId: "bme280", version: 2 }])],
      true,
    );
    expect(index.profiles).toHaveLength(2);
    expect(index.profiles.map((p) => p.version)).toEqual([1, 2]);
  });

  it("deduplicates the identical profileId+version reported twice", () => {
    const entry = { profileId: "bme280", version: 1 };
    const index = normalizeProfilePages([page([entry]), page([entry])], true);
    expect(index.profiles).toHaveLength(1);
  });

  it("propagates the complete flag verbatim", () => {
    expect(normalizeProfilePages([], false).complete).toBe(false);
  });
});
