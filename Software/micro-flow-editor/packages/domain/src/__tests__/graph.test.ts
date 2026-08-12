import { describe, expect, it } from "vitest";
import {
  createDeviceProcessingGraph,
  createPhysicalCompositionGraph,
  createSystemAutomationGraph,
  deployableSnapshot,
  GraphErrorCode,
} from "../graph.js";
import { blockId, edgeId, moduleId } from "../ids.js";
import { GraphLayer } from "../graph-layer.js";

function must<T>(result: { ok: boolean; value?: T }): T {
  if (!result.ok) throw new Error("expected ok result");
  return result.value as T;
}

describe("Graph", () => {
  it("accepts a node and an edge that both belong to its own layer", () => {
    const graph = createDeviceProcessingGraph<string, string, { kind: string }>();
    const a = must(graph.addNode({ layer: "device-processing", id: "n1", data: { kind: "read" } }));
    const b = must(graph.addNode({ layer: "device-processing", id: "n2", data: { kind: "rule" } }));
    const edge = graph.addEdge({ layer: "device-processing", id: "e1", source: a.id, target: b.id });
    expect(edge.ok).toBe(true);
    expect(graph.getNodes()).toHaveLength(2);
    expect(graph.getEdges()).toHaveLength(1);
  });

  it("rejects a node from a different layer with a structured error", () => {
    const graph = createDeviceProcessingGraph<string, string, { kind: string }>();
    // A node built for System Automation, mistakenly added to Device Processing.
    const result = graph.addNode({
      layer: "system-automation",
      id: "n1",
      data: { kind: "field" },
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe(GraphErrorCode.CROSS_LAYER_REFERENCE);
      expect(result.error.path).toEqual(["device-processing", "nodes", "n1"]);
    }
  });

  it("rejects an edge from a different layer (Device Processing -> System Automation)", () => {
    const graph = createDeviceProcessingGraph<string, string, { kind: string }>();
    must(graph.addNode({ layer: "device-processing", id: "n1", data: { kind: "read" } }));
    must(graph.addNode({ layer: "device-processing", id: "n2", data: { kind: "publish" } }));

    const result = graph.addEdge({
      layer: "system-automation",
      id: "e1",
      source: "n1",
      target: "n2",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe(GraphErrorCode.CROSS_LAYER_REFERENCE);
    }
  });

  it("rejects an edge whose endpoint is not a registered node (dangling reference)", () => {
    const graph = createDeviceProcessingGraph<string, string, { kind: string }>();
    must(graph.addNode({ layer: "device-processing", id: "n1", data: { kind: "read" } }));

    const result = graph.addEdge({
      layer: "device-processing",
      id: "e1",
      source: "n1",
      target: "missing",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe(GraphErrorCode.DANGLING_EDGE_ENDPOINT);
      expect(result.error.target).toBe("missing");
    }
  });

  it("rejects registering the same node ID twice", () => {
    const graph = createPhysicalCompositionGraph<string, string, { kind: string }>();
    must(graph.addNode({ layer: "physical-composition", id: "core-1", data: { kind: "core" } }));
    const result = graph.addNode({
      layer: "physical-composition",
      id: "core-1",
      data: { kind: "core" },
    });
    expect(result.ok).toBe(false);
  });

  it("keeps the three graph kinds mutually independent (own ownership, own layer tag)", () => {
    const physical = createPhysicalCompositionGraph<string, string, unknown>();
    const device = createDeviceProcessingGraph<string, string, unknown>();
    const automation = createSystemAutomationGraph<string, string, unknown>();
    expect(physical.layer).toBe(GraphLayer.PHYSICAL_COMPOSITION);
    expect(device.layer).toBe(GraphLayer.DEVICE_PROCESSING);
    expect(automation.layer).toBe(GraphLayer.SYSTEM_AUTOMATION);
  });

  it("getNode looks up a registered node and returns undefined otherwise", () => {
    const graph = createDeviceProcessingGraph<string, string, { kind: string }>();
    must(graph.addNode({ layer: "device-processing", id: "n1", data: { kind: "read" } }));
    expect(graph.getNode("n1")).toEqual({
      layer: "device-processing",
      id: "n1",
      data: { kind: "read" },
    });
    expect(graph.getNode("missing")).toBeUndefined();
  });

  it("works with the branded IDs from S012, not just plain strings", () => {
    const graph = createDeviceProcessingGraph<string, string, { kind: string }>();
    const rawModule = moduleId("11111111-1111-1111-1111-111111111111");
    const rawBlock = blockId("22222222-2222-2222-2222-222222222222");
    const rawEdge = edgeId("33333333-3333-3333-3333-333333333333");
    if (!rawModule.ok || !rawBlock.ok || !rawEdge.ok) throw new Error("bad fixture ID");

    must(graph.addNode({ layer: "device-processing", id: rawModule.value, data: { kind: "read" } }));
    must(graph.addNode({ layer: "device-processing", id: rawBlock.value, data: { kind: "filter" } }));
    const edge = graph.addEdge({
      layer: "device-processing",
      id: rawEdge.value,
      source: rawModule.value,
      target: rawBlock.value,
    });
    expect(edge.ok).toBe(true);
  });

  describe("deployableSnapshot", () => {
    it("is independent of node insertion order", () => {
      const a = createDeviceProcessingGraph<string, string, { v: number }>();
      must(a.addNode({ layer: "device-processing", id: "n1", data: { v: 1 } }));
      must(a.addNode({ layer: "device-processing", id: "n2", data: { v: 2 } }));

      const b = createDeviceProcessingGraph<string, string, { v: number }>();
      must(b.addNode({ layer: "device-processing", id: "n2", data: { v: 2 } }));
      must(b.addNode({ layer: "device-processing", id: "n1", data: { v: 1 } }));

      expect(deployableSnapshot(a)).toBe(deployableSnapshot(b));
    });
  });
});
