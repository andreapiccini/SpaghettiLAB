import { describe, expect, it } from "vitest";
import type { ModuleStatusView } from "../status-view.js";
import { describeDeployedEntityStatus, describeScheduleStatus } from "../processing-status.js";

const modules: readonly ModuleStatusView[] = [{ key: 1, id: 42, portId: 2, state: "READY", endpointKind: "I2C_ADDRESS", typeId: "sensor.temp" }];

describe("describeScheduleStatus — no direct wire status, derived from the sampled Module", () => {
  it("resolves the sampled Module's state when it is present in the status list", () => {
    const view = describeScheduleStatus({ sourceModuleKey: 1, enabled: true, periodMs: 1000 }, modules);
    expect(view.sourceModuleState).toBe("READY");
  });

  it("reports unknown when the source Module key is absent from the last GET_STATUS", () => {
    const view = describeScheduleStatus({ sourceModuleKey: 99, enabled: true, periodMs: 1000 }, modules);
    expect(view.sourceModuleState).toBe("unknown");
  });
});

describe("describeDeployedEntityStatus — Rule/Block have no runtime status on the wire", () => {
  it("only reports deployment presence, never a fabricated runtime state", () => {
    const view = describeDeployedEntityStatus({ key: 3, typeId: "rule.threshold" });
    expect(view.deployed).toBe(true);
    expect(view.note).toContain("No per-entity runtime status");
  });
});
