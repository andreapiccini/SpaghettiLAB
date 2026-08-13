import type { DeviceProfileDraft } from "@spaghettilab/device-profile-authoring-model";
import { PortTransport } from "@spaghettilab/device-profile-authoring-model";
import { exportProfilePackage } from "@spaghettilab/device-profile-package";
import { describe, expect, it } from "vitest";
import { mergeProfileCatalog } from "../catalog.js";

function draft(profileId: string): DeviceProfileDraft {
  return {
    profileId,
    version: 1,
    transport: PortTransport.I2C,
    requiredCapabilities: 1,
    maxTotalTimeMs: 10,
    maxTransactions: 1,
    maxBytes: 1,
    initOps: [],
    sampleOps: [],
    safeStopOps: [],
    sampleSchemaId: "",
    sampleSchemaVersion: 1,
    sampleFields: [],
  };
}

describe("mergeProfileCatalog — S063 point 3", () => {
  it("merges built-in, local, and marketplace sources into one sorted list", () => {
    const builtIn = [exportProfilePackage(draft("sensor.builtin"), "spaghettilab")];
    const local = [exportProfilePackage(draft("sensor.local"), "andrea")];
    const marketplace = [exportProfilePackage(draft("sensor.marketplace"), "someone")];

    const merged = mergeProfileCatalog(builtIn, local, marketplace);
    expect(merged.map((c) => c.pkg.profileId)).toEqual(["sensor.builtin", "sensor.local", "sensor.marketplace"]);
    expect(merged.map((c) => c.source)).toEqual(["built-in", "local", "marketplace"]);
  });

  it("prefers built-in over local over marketplace when the same identity collides", () => {
    const same = "sensor.collide";
    const builtIn = [exportProfilePackage(draft(same), "spaghettilab")];
    const local = [exportProfilePackage(draft(same), "andrea")];
    const marketplace = [exportProfilePackage(draft(same), "someone")];

    const merged = mergeProfileCatalog(builtIn, local, marketplace);
    expect(merged).toHaveLength(1);
    expect(merged[0]!.source).toBe("built-in");
    expect(merged[0]!.pkg.author).toBe("spaghettilab");
  });
});
