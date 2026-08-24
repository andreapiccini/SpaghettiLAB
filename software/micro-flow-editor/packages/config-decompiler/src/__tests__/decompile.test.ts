import { compileConfig, type CompileConfigInput } from "@spaghettilab/config-compiler";
import { describe, expect, it } from "vitest";
import { decompileConfig } from "../decompile.js";

const mqtt = { enabled: false, host: "", port: 0, baseTopic: "", security: 0, credentialId: 0 };
const energy = { bleAvailability: 0, advertisingWindowMs: 0, advertisingPeriodMs: 0 };

function fixture(): CompileConfigInput {
  return {
    physicalGraph: {
      layer: "physical-composition",
      nodes: [
        { layer: "physical-composition", id: "sensor", data: { kind: "module", driverTypeId: "declarative-device", portId: 1, bayId: 100, railId: 1000, electricalMode: "input-only", properties: { "1": 0x40n } } },
        { layer: "physical-composition", id: "actuator", data: { kind: "module", driverTypeId: "relay", portId: 2, bayId: 200, railId: 2000, electricalMode: "output-only", properties: {} } },
      ],
      edges: [],
    },
    processingGraph: {
      layer: "device-processing",
      nodes: [
        { layer: "device-processing", id: "sched", data: { kind: "schedule", moduleNodeId: "sensor", periodMs: 1000, enabled: true } },
        { layer: "device-processing", id: "filter", data: { kind: "block", blockTypeId: "moving_average", properties: {} } },
        { layer: "device-processing", id: "rule1", data: { kind: "rule", ruleTypeId: "threshold", properties: { "3": 5000n }, commandTarget: { moduleNodeId: "actuator", commandId: 7 } } },
      ],
      edges: [{ layer: "device-processing", id: "e1", source: "sched", target: "filter", sourceHandle: "1", targetHandle: "0" }],
    },
    mqtt,
    connectivity: 0,
    energy,
  };
}

const compileOptions = { resolveRuleActionFieldIds: () => ({ targetKeyFieldId: 10, commandIdFieldId: 11 }) };

describe("decompileConfig — S073 § Verifiche", () => {
  it("a decompile -> compile cycle on a supported Config preserves the original semantics", () => {
    const original = compileConfig(fixture(), compileOptions);
    expect(original.ok).toBe(true);
    if (!original.ok) return;

    const decompiled = decompileConfig(original.value, { resolveRuleActionFields: () => ({ targetKeyFieldId: 10, commandIdFieldId: 11 }) });
    const recompiled = compileConfig(
      { physicalGraph: decompiled.physicalGraph, processingGraph: decompiled.processingGraph, mqtt, connectivity: 0, energy },
      compileOptions,
    );
    expect(recompiled.ok).toBe(true);
    if (!recompiled.ok) return;
    expect(recompiled.value).toEqual(original.value);
  });

  it("never invents authoring metadata — position/label/grouping simply do not exist on decompiled nodes", () => {
    const original = compileConfig(fixture(), compileOptions);
    if (!original.ok) throw new Error("fixture must compile");
    const decompiled = decompileConfig(original.value);
    for (const node of decompiled.physicalGraph.nodes) {
      expect(node.data).not.toHaveProperty("position");
      expect(node.data).not.toHaveProperty("label");
    }
  });

  it("flags electricalMode as an unrecovered, defaulted field rather than silently guessing it — it never exists in Config", () => {
    const original = compileConfig(fixture(), compileOptions);
    if (!original.ok) throw new Error("fixture must compile");
    const decompiled = decompileConfig(original.value);
    const warning = decompiled.issues.find((i) => i.path.join(".").includes("electricalMode"));
    expect(warning).toBeDefined();
    expect(warning!.severity).toBe("warning");
  });

  it("infers an Event-source (not a Schedule) for a Module used as an edge source with no schedule entry", () => {
    const config = compileConfig(
      {
        physicalGraph: fixture().physicalGraph,
        processingGraph: {
          layer: "device-processing",
          nodes: [
            { layer: "device-processing", id: "evt", data: { kind: "event-source", moduleNodeId: "sensor" } },
            { layer: "device-processing", id: "filter", data: { kind: "block", blockTypeId: "moving_average", properties: {} } },
          ],
          edges: [{ layer: "device-processing", id: "e1", source: "evt", target: "filter", sourceHandle: "1", targetHandle: "0" }],
        },
        mqtt,
        connectivity: 0,
        energy,
      },
      compileOptions,
    );
    expect(config.ok).toBe(true);
    if (!config.ok) return;
    const decompiled = decompileConfig(config.value);
    const eventSourceNode = decompiled.processingGraph.nodes.find((n) => n.data.kind === "event-source");
    expect(eventSourceNode).toBeDefined();
    expect(decompiled.processingGraph.nodes.some((n) => n.data.kind === "schedule")).toBe(false);
  });

  it("reports (does not silently drop) a Module with no recoverable bay/rail", () => {
    const decompiled = decompileConfig({
      version: 4,
      modules: [{ key: 1, portId: 1, typeId: "x", properties: {} }],
      schedules: [],
      rules: [],
      mqtt,
      connectivity: 0,
      energy,
      blocks: [],
      edges: [],
    });
    expect(decompiled.physicalGraph.nodes).toHaveLength(0);
    expect(decompiled.issues.length).toBeGreaterThan(0);
  });
});
