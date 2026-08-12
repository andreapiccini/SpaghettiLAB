import type { GraphState } from "@spaghettilab/domain";
import type { EditorModel } from "@spaghettilab/editor-model";
import { describe, expect, it } from "vitest";
import { isPlaceholderDiagnostic, toReactFlowEdges, toReactFlowNodes } from "../to-react-flow.js";

function graph(): GraphState<"device-processing"> {
  return {
    layer: "device-processing",
    nodes: [
      { layer: "device-processing", id: "n1", data: { typeId: "known.driver" } },
      { layer: "device-processing", id: "n2", data: { typeId: "still.unknown" } },
    ],
    edges: [{ layer: "device-processing", id: "e1", source: "n1", target: "n2" }],
  };
}

describe("toReactFlowNodes — S043 point 2 (fake catalog introduces a type without touching adapter source)", () => {
  it("resolves a node type present in EditorModel without any switch/branching on typeId in this file", () => {
    const model: EditorModel = {
      nodeTypes: [{ typeId: "known.driver", source: "module-driver", handles: [], propertySchema: [], requiredCapabilities: [] }],
    };
    const nodes = toReactFlowNodes(graph(), {}, model, (data) => (data as { typeId: string }).typeId);
    const known = nodes.find((n) => n.id === "n1")!;
    expect(isPlaceholderDiagnostic(known.data.resolvedType)).toBe(false);
    expect(known.data.resolvedType).toEqual(model.nodeTypes[0]);
  });

  it("a brand-new type appearing only in a fake EditorModel resolves correctly with zero code changes here", () => {
    const fakeModel: EditorModel = {
      nodeTypes: [
        { typeId: "known.driver", source: "module-driver", handles: [], propertySchema: [], requiredCapabilities: [] },
        // A type that did not exist in any earlier fixture in this file/package.
        { typeId: "brand.new.module.never.seen.before", source: "device-profile", handles: [], propertySchema: [], requiredCapabilities: ["cap.x"] },
      ],
    };
    const state: GraphState<"device-processing"> = {
      layer: "device-processing",
      nodes: [{ layer: "device-processing", id: "n3", data: { typeId: "brand.new.module.never.seen.before" } }],
      edges: [],
    };
    const nodes = toReactFlowNodes(state, {}, fakeModel, (data) => (data as { typeId: string }).typeId);
    expect(isPlaceholderDiagnostic(nodes[0]!.data.resolvedType)).toBe(false);
    expect(nodes[0]!.data.resolvedType).toEqual(fakeModel.nodeTypes[1]);
  });

  it("an unresolved type becomes a PlaceholderDiagnostic, never a dropped node", () => {
    const model: EditorModel = { nodeTypes: [] };
    const nodes = toReactFlowNodes(graph(), {}, model, (data) => (data as { typeId: string }).typeId);
    expect(nodes).toHaveLength(2);
    expect(isPlaceholderDiagnostic(nodes[0]!.data.resolvedType)).toBe(true);
  });

  it("position/selected come from AuthoringMetadata only, never from the domain graph", () => {
    const model: EditorModel = { nodeTypes: [] };
    const nodes = toReactFlowNodes(graph(), { n1: { position: { x: 10, y: 20 }, selected: true } }, model, () => "x");
    const n1 = nodes.find((n) => n.id === "n1")!;
    expect(n1.position).toEqual({ x: 10, y: 20 });
    expect(n1.selected).toBe(true);
    const n2 = nodes.find((n) => n.id === "n2")!;
    expect(n2.position).toEqual({ x: 0, y: 0 });
    expect(n2.selected).toBe(false);
  });
});

describe("toReactFlowEdges", () => {
  it("maps domain edges 1:1 by id/source/target", () => {
    const edges = toReactFlowEdges(graph());
    expect(edges).toEqual([{ id: "e1", source: "n1", target: "n2" }]);
  });
});
