import type { CompileConfigInput } from "@spaghettilab/config-compiler";
import { describe, expect, it } from "vitest";
import { dryRunConfig } from "../dry-run.js";

const mqtt = { enabled: false, host: "", port: 0, baseTopic: "", security: 0, credentialId: 0 };
const energy = { bleAvailability: 0, advertisingWindowMs: 0, advertisingPeriodMs: 0 };

function fixture(): CompileConfigInput {
  return {
    physicalGraph: {
      layer: "physical-composition",
      nodes: [
        { layer: "physical-composition", id: "m1", data: { kind: "module", driverTypeId: "declarative-device", profileId: "sensor.example", portId: 1, bayId: 100, railId: 1000, electricalMode: "input-only", properties: {} } },
      ],
      edges: [],
    },
    processingGraph: {
      layer: "device-processing",
      nodes: [
        { layer: "device-processing", id: "s1", data: { kind: "schedule", moduleNodeId: "m1", periodMs: 1000, enabled: true } },
        { layer: "device-processing", id: "b1", data: { kind: "block", blockTypeId: "moving_average", properties: {} } },
      ],
      edges: [{ layer: "device-processing", id: "e1", source: "s1", target: "b1", sourceHandle: "1", targetHandle: "0" }],
    },
    mqtt,
    connectivity: 0,
    energy,
  };
}

describe("dryRunConfig — S073 point 2 / § Verifiche", () => {
  it("compiles successfully and lists no issues when everything is available", () => {
    const result = dryRunConfig(fixture(), { availableProfileIds: new Set(["sensor.example"]), availableBlockRuleTypeIds: new Set(["moving_average"]) });
    expect(result.compiled).toBeDefined();
    expect(result.issues).toHaveLength(0);
  });

  it("warns (with remediation) about a missing Device Profile without blocking compilation", () => {
    const result = dryRunConfig(fixture(), { availableProfileIds: new Set(), availableBlockRuleTypeIds: new Set(["moving_average"]) });
    expect(result.compiled).toBeDefined();
    const warning = result.issues.find((i) => i.code === "config-decompiler.missing_profile");
    expect(warning).toBeDefined();
    expect(warning!.severity).toBe("warning");
    expect(warning!.remediation).toContain("install");
  });

  it("warns about a missing Capability Pack for an unavailable Block type", () => {
    const result = dryRunConfig(fixture(), { availableBlockRuleTypeIds: new Set() });
    const warning = result.issues.find((i) => i.code === "config-decompiler.missing_capability_pack");
    expect(warning).toBeDefined();
    expect(warning!.remediation).toContain("install");
  });

  it("lists every error/warning without stopping at the first, and leaves compiled undefined when a hard error exists", () => {
    const brokenFixture: CompileConfigInput = {
      ...fixture(),
      processingGraph: {
        layer: "device-processing",
        nodes: [{ layer: "device-processing", id: "s1", data: { kind: "schedule", moduleNodeId: "does-not-exist", periodMs: 1000, enabled: true } }],
        edges: [],
      },
    };
    const result = dryRunConfig(brokenFixture, { availableProfileIds: new Set(), availableBlockRuleTypeIds: new Set() });
    expect(result.compiled).toBeUndefined();
    expect(result.issues.length).toBeGreaterThanOrEqual(2); // missing profile warning + dangling module reference error
    expect(result.issues.some((i) => i.severity === "error")).toBe(true);
    expect(result.issues.some((i) => i.severity === "warning")).toBe(true);
  });
});
