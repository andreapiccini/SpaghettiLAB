import type { DeviceProfileSummary } from "@spaghettilab/protocol-sdk";
import { describe, expect, it } from "vitest";
import { DECLARATIVE_DEVICE_DRIVER_TYPE_ID, instantiateModuleFromProfile } from "../module-instantiation.js";

describe("instantiateModuleFromProfile — S063 point 2", () => {
  it("builds a ModuleNodeData under the one generic declarative-device driver, never a per-sensor driver id", () => {
    const installed: DeviceProfileSummary = { profileId: "sensor.example", version: 1, hash: new Uint8Array([1, 2, 3]) };
    const module = instantiateModuleFromProfile(installed, {
      portId: 1,
      bayId: 100,
      railId: 1000,
      electricalMode: "input-only",
      endpoint: { address: 0x40 },
      properties: { shuntMilliohm: 100 },
    });

    expect(module).toEqual({
      kind: "module",
      driverTypeId: DECLARATIVE_DEVICE_DRIVER_TYPE_ID,
      profileId: "sensor.example",
      portId: 1,
      bayId: 100,
      railId: 1000,
      endpoint: { address: 0x40 },
      electricalMode: "input-only",
      properties: { shuntMilliohm: 100 },
    });
  });

  it("defaults properties to an empty object when omitted", () => {
    const installed: DeviceProfileSummary = { profileId: "sensor.example", version: 1, hash: new Uint8Array() };
    const module = instantiateModuleFromProfile(installed, { portId: 1, bayId: 1, railId: 1, electricalMode: "output-only" });
    expect(module.properties).toEqual({});
  });
});
