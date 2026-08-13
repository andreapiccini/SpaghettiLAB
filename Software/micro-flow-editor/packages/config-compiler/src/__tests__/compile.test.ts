import { describe, expect, it } from "vitest";
import { compileConfig, type CompileConfigInput } from "../compile.js";
import { canonicalConfigJson, encodeConfigCbor } from "../config-cbor.js";
import { sha256 } from "../hash.js";

const mqtt = { enabled: false, host: "", port: 0, baseTopic: "", security: 0, credentialId: 0 };
const energy = { bleAvailability: 0, advertisingWindowMs: 0, advertisingPeriodMs: 0 };

function module(id: string, portId: number) {
  return {
    layer: "physical-composition" as const,
    id,
    data: {
      kind: "module" as const,
      driverTypeId: "declarative-device",
      portId,
      bayId: 100,
      railId: 1000,
      electricalMode: "input-only" as const,
      properties: { "1": 0x40n },
    },
  };
}

function schedule(id: string, moduleNodeId: string) {
  return { layer: "device-processing" as const, id, data: { kind: "schedule" as const, moduleNodeId, periodMs: 1000, enabled: true } };
}

function block(id: string, blockTypeId: string) {
  return { layer: "device-processing" as const, id, data: { kind: "block" as const, blockTypeId, properties: {} } };
}

function rule(id: string, commandTarget?: { moduleNodeId: string; commandId: number }) {
  return { layer: "device-processing" as const, id, data: { kind: "rule" as const, ruleTypeId: "threshold", properties: { "1": 5000n }, commandTarget } };
}

function baseInput(overrides: Partial<CompileConfigInput> = {}): CompileConfigInput {
  return {
    physicalGraph: { layer: "physical-composition", nodes: [module("m1", 1)], edges: [] },
    processingGraph: {
      layer: "device-processing",
      nodes: [schedule("s1", "m1"), block("b1", "scale_offset")],
      edges: [{ layer: "device-processing", id: "e1", source: "s1", target: "b1", sourceHandle: "1", targetHandle: "0" }],
    },
    mqtt,
    connectivity: 0,
    energy,
    ...overrides,
  } as CompileConfigInput;
}

describe("compileConfig — S072 § Verifiche", () => {
  it("the same semantics with different node array order produces the same Config and the same hash", async () => {
    const a = baseInput();
    const b = baseInput({
      physicalGraph: { layer: "physical-composition", nodes: [module("m1", 1)], edges: [] },
      processingGraph: {
        layer: "device-processing",
        // same nodes, reversed insertion order — no reordering by content, same IDs
        nodes: [block("b1", "scale_offset"), schedule("s1", "m1")],
        edges: [{ layer: "device-processing", id: "e1", source: "s1", target: "b1", sourceHandle: "1", targetHandle: "0" }],
      },
    });

    const resultA = compileConfig(a);
    const resultB = compileConfig(b);
    expect(resultA.ok).toBe(true);
    expect(resultB.ok).toBe(true);
    if (resultA.ok && resultB.ok) {
      expect(resultA.value).toEqual(resultB.value);
      const bytesA = encodeConfigCbor(resultA.value);
      const bytesB = encodeConfigCbor(resultB.value);
      expect(bytesA).toEqual(bytesB);
      const hashA = await sha256(bytesA);
      const hashB = await sha256(bytesB);
      expect(hashA).toEqual(hashB);
    }
  });

  it("compiles a multi-stage pipeline: Schedule -> fan-out to two Blocks -> Rule with a command target", () => {
    const input = baseInput({
      physicalGraph: { layer: "physical-composition", nodes: [module("m1", 1), module("m2", 2)], edges: [] },
      processingGraph: {
        layer: "device-processing",
        nodes: [schedule("s1", "m1"), block("filter", "moving_average"), block("scale", "scale_offset"), rule("r1", { moduleNodeId: "m2", commandId: 7 })],
        edges: [
          { layer: "device-processing", id: "e1", source: "s1", target: "filter", sourceHandle: "1", targetHandle: "0" },
          { layer: "device-processing", id: "e2", source: "s1", target: "scale", sourceHandle: "1", targetHandle: "0" },
          { layer: "device-processing", id: "e3", source: "filter", target: "scale", sourceHandle: "0", targetHandle: "1" },
        ],
      },
    });
    const result = compileConfig(input, { resolveRuleActionFieldIds: () => ({ targetKeyFieldId: 10, commandIdFieldId: 11 }) });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.modules).toHaveLength(2);
      expect(result.value.schedules).toHaveLength(1);
      expect(result.value.blocks).toHaveLength(2);
      expect(result.value.edges).toHaveLength(3);
      expect(result.value.rules).toHaveLength(1);
      const compiledRule = result.value.rules[0]!;
      expect(compiledRule.properties[10]).toBe(BigInt(result.value.modules.find((m) => m.portId === 2)!.key));
      expect(compiledRule.properties[11]).toBe(7n);
    }
  });

  it("fails with the owning Block indicated when a cost budget is exceeded, not a generic error", () => {
    const input = baseInput({
      processingGraph: {
        layer: "device-processing",
        nodes: [schedule("s1", "m1"), block("b1", "moving_average"), block("b2", "scale_offset")],
        edges: [],
      },
    });
    const result = compileConfig(input, { resolveBlockCost: () => 60, maxTotalCost: 100 });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      const e = result.error.find((x) => x.code === "config-compiler.cost_budget_exceeded");
      expect(e).toBeDefined();
      // b1 sorts before b2 lexicographically, so b1's key is 1 and b2's cumulative cost (120) is what tips it over — the owner reported must be b2.
      expect(e!.path).toEqual(["config-compiler", "nodes", "b2"]);
    }
  });

  it("fails with the offending node indicated when fan-out exceeds the cap", () => {
    const input = baseInput({
      processingGraph: {
        layer: "device-processing",
        nodes: [schedule("s1", "m1"), block("b1", "x"), block("b2", "x"), block("b3", "x")],
        edges: [
          { layer: "device-processing", id: "e1", source: "s1", target: "b1", sourceHandle: "1", targetHandle: "0" },
          { layer: "device-processing", id: "e2", source: "s1", target: "b2", sourceHandle: "1", targetHandle: "0" },
          { layer: "device-processing", id: "e3", source: "s1", target: "b3", sourceHandle: "1", targetHandle: "0" },
        ],
      },
    });
    const result = compileConfig(input, { maxFanOut: 2 });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      const e = result.error.find((x) => x.code === "config-compiler.fan_out_exceeded");
      expect(e).toBeDefined();
      expect(e!.target).toBe("s1");
    }
  });

  it("rejects a category count over a declared cap, indicating the overflowing node", () => {
    const input = baseInput({
      physicalGraph: { layer: "physical-composition", nodes: [module("m1", 1), module("m2", 2)], edges: [] },
    });
    const result = compileConfig(input, { maxModules: 1 });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.some((e) => e.code === "config-compiler.capacity_exceeded")).toBe(true);
  });

  it("produces canonical debug JSON that renders bigint properties without throwing", () => {
    const result = compileConfig(baseInput());
    expect(result.ok).toBe(true);
    if (result.ok) {
      const json = canonicalConfigJson(result.value);
      expect(json).toContain("64n"); // module property value 0x40n
      expect(() => JSON.parse(json.replace(/(\d+)n"/g, '$1"'))).not.toThrow();
    }
  });
});
