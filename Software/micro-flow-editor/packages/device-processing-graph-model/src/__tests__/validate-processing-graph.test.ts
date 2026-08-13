import { Graph, type GraphState } from "@spaghettilab/domain";
import { describe, expect, it } from "vitest";
import type { DeviceProcessingNodeData } from "../entities.js";
import type { ProcessingNodeDescriptor, ResolveProcessingNodeDescriptor } from "../ports.js";
import { validateDeviceProcessingGraph } from "../validate-processing-graph.js";

type Node = { layer: "device-processing"; id: string; data: DeviceProcessingNodeData };
type Edge = { layer: "device-processing"; id: string; source: string; target: string; sourceHandle?: string; targetHandle?: string };

function state(nodes: Node[], edges: Edge[]): GraphState<"device-processing"> {
  return { layer: "device-processing", nodes, edges };
}

function block(id: string, blockTypeId: string): Node {
  return { layer: "device-processing", id, data: { kind: "block", blockTypeId, properties: {} } };
}

function schedule(id: string, moduleNodeId: string): Node {
  return { layer: "device-processing", id, data: { kind: "schedule", moduleNodeId, periodMs: 1000, enabled: true } };
}

function rule(id: string, commandTarget?: { moduleNodeId: string; commandId: number }): Node {
  return { layer: "device-processing", id, data: { kind: "rule", ruleTypeId: "threshold", properties: {}, commandTarget } };
}

const knownModuleNodeIds = new Set(["module-1", "module-2"]);

describe("validateDeviceProcessingGraph — S071 § Verifiche", () => {
  it("rejects a cycle with an error pointing to the closing edge and the full node path", () => {
    const s = state(
      [block("a", "scale_offset"), block("b", "clamp"), block("c", "moving_average")],
      [
        { layer: "device-processing", id: "e1", source: "a", target: "b" },
        { layer: "device-processing", id: "e2", source: "b", target: "c" },
        { layer: "device-processing", id: "e3", source: "c", target: "a" },
      ],
    );
    const result = validateDeviceProcessingGraph(s, { knownModuleNodeIds });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      const cycleError = result.error.find((e) => e.code === "device-processing-graph.cycle");
      expect(cycleError).toBeDefined();
      expect(cycleError!.path).toEqual(["device-processing-graph", "edges", "e3"]);
    }
  });

  it("accepts an acyclic graph", () => {
    const s = state(
      [block("a", "scale_offset"), block("b", "clamp")],
      [{ layer: "device-processing", id: "e1", source: "a", target: "b" }],
    );
    expect(validateDeviceProcessingGraph(s, { knownModuleNodeIds }).ok).toBe(true);
  });

  it("rejects a type/unit mismatch between two connected Blocks before compilation, via editor-model's checkHandleCompatibility", () => {
    const s = state(
      [block("a", "adc-reader"), block("b", "text-only-block")],
      [{ layer: "device-processing", id: "e1", source: "a", target: "b" }],
    );
    const resolveDescriptor: ResolveProcessingNodeDescriptor = (node): ProcessingNodeDescriptor | undefined => {
      if (node.id === "a") return { inputs: [], outputs: [{ handleId: "out", direction: "output", valueType: "uint", unit: "mV" }] };
      if (node.id === "b") return { inputs: [{ handleId: "in", direction: "input", valueType: "text" }], outputs: [] };
      return undefined;
    };
    const result = validateDeviceProcessingGraph(s, { knownModuleNodeIds, resolveDescriptor });
    expect(result.ok).toBe(false);
  });

  it("accepts a type/unit-compatible edge between two Blocks", () => {
    const s = state(
      [block("a", "adc-reader"), block("b", "clamp")],
      [{ layer: "device-processing", id: "e1", source: "a", target: "b" }],
    );
    const resolveDescriptor: ResolveProcessingNodeDescriptor = (node): ProcessingNodeDescriptor | undefined => {
      if (node.id === "a") return { inputs: [], outputs: [{ handleId: "out", direction: "output", valueType: "uint", unit: "mV" }] };
      if (node.id === "b") return { inputs: [{ handleId: "in", direction: "input", valueType: "uint", unit: "mV" }], outputs: [{ handleId: "out", direction: "output", valueType: "uint", unit: "mV" }] };
      return undefined;
    };
    expect(validateDeviceProcessingGraph(s, { knownModuleNodeIds, resolveDescriptor }).ok).toBe(true);
  });

  it("rejects a Schedule/Event-source node referencing a Module not in this Core's physical-composition graph (dangling cross-graph reference)", () => {
    const s = state([schedule("s1", "module-unknown")], []);
    const result = validateDeviceProcessingGraph(s, { knownModuleNodeIds });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error[0]!.code).toBe("device-processing-graph.dangling_module_reference");
  });

  it("rejects a Rule's dangling command target reference", () => {
    const s = state([rule("r1", { moduleNodeId: "module-unknown", commandId: 1 })], []);
    const result = validateDeviceProcessingGraph(s, { knownModuleNodeIds });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error[0]!.code).toBe("device-processing-graph.dangling_module_reference");
  });

  it("rejects two triggers bound to the same Module", () => {
    const s = state([schedule("s1", "module-1"), schedule("s2", "module-1")], []);
    const result = validateDeviceProcessingGraph(s, { knownModuleNodeIds });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.filter((e) => e.code === "device-processing-graph.duplicate_module_trigger")).toHaveLength(2);
  });

  it("rejects a Rule used as an edge source — Rules have no output ports, structurally, regardless of any descriptor", () => {
    const s = state(
      [rule("r1"), block("b", "clamp")],
      [{ layer: "device-processing", id: "e1", source: "r1", target: "b" }],
    );
    const result = validateDeviceProcessingGraph(s, { knownModuleNodeIds });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error[0]!.code).toBe("device-processing-graph.output_node_as_source");
  });

  it("rejects a Block with zero declared output ports used as an edge source (e.g. publish_field)", () => {
    const s = state(
      [block("pub", "publish_field"), block("b", "clamp")],
      [{ layer: "device-processing", id: "e1", source: "pub", target: "b" }],
    );
    const resolveDescriptor: ResolveProcessingNodeDescriptor = (node) => (node.id === "pub" ? { inputs: [{ handleId: "in", direction: "input", valueType: "uint" }], outputs: [] } : undefined);
    const result = validateDeviceProcessingGraph(s, { knownModuleNodeIds, resolveDescriptor });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.some((e) => e.code === "device-processing-graph.output_node_as_source")).toBe(true);
  });

  it("rejects a required input left unconnected", () => {
    const s = state([block("b", "clamp")], []);
    const resolveDescriptor: ResolveProcessingNodeDescriptor = (node) =>
      node.id === "b" ? { inputs: [{ handleId: "in", direction: "input", valueType: "uint", required: true }], outputs: [] } : undefined;
    const result = validateDeviceProcessingGraph(s, { knownModuleNodeIds, resolveDescriptor });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.some((e) => e.code === "device-processing-graph.missing_required_input")).toBe(true);
  });

  it("rejects fan-out beyond a caller-supplied cap", () => {
    const s = state(
      [block("a", "clamp"), block("b1", "clamp"), block("b2", "clamp"), block("b3", "clamp")],
      [
        { layer: "device-processing", id: "e1", source: "a", target: "b1" },
        { layer: "device-processing", id: "e2", source: "a", target: "b2" },
        { layer: "device-processing", id: "e3", source: "a", target: "b3" },
      ],
    );
    const result = validateDeviceProcessingGraph(s, { knownModuleNodeIds, maxFanOut: 2 });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.some((e) => e.code === "device-processing-graph.fan_out_exceeded")).toBe(true);
  });

  it("collects every problem instead of stopping at the first", () => {
    const s = state([schedule("bad", "module-unknown"), schedule("s1", "module-1"), schedule("s2", "module-1")], []);
    const result = validateDeviceProcessingGraph(s, { knownModuleNodeIds });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.length).toBeGreaterThanOrEqual(3);
  });
});

describe("cross-Core edges — structurally impossible, not a code path in this validator (S071 point 4)", () => {
  it("Graph.addEdge itself rejects an edge whose endpoint belongs to a different Core's graph", () => {
    const coreAGraph = new Graph<"device-processing", string, string, DeviceProcessingNodeData>("device-processing");
    coreAGraph.addNode({ layer: "device-processing", id: "core-a-block", data: { kind: "block", blockTypeId: "clamp", properties: {} } });
    // "core-b-block" was never added to Core A's graph — it lives in a separate Graph instance for Core B.
    const result = coreAGraph.addEdge({ layer: "device-processing", id: "cross-core-edge", source: "core-a-block", target: "core-b-block" });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("domain.graph.dangling_edge_endpoint");
  });
});
