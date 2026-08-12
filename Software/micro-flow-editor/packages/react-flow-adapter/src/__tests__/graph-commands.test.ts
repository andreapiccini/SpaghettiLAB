import { createEmptyProject, projectId, type ProjectV1, type Result, type DomainError } from "@spaghettilab/domain";
import { describe, expect, it } from "vitest";
import {
  addGraphEdgeCommand,
  addGraphNodeCommand,
  removeGraphEdgeCommand,
  removeGraphNodeCommand,
  updateAuthoringMetadataCommand,
} from "../graph-commands.js";
import { systemAutomationGraphLens } from "../graph-lens.js";

function mustOk<T, E>(result: Result<T, E>): T {
  if (!result.ok) throw new Error("expected an ok Result in test fixture setup");
  return result.value;
}

function baseProject(): ProjectV1 {
  const id = mustOk(projectId("cccccccc-0000-4000-8000-000000000001"));
  return createEmptyProject(id, "s043-fixture");
}

describe("graph-commands — S043 point 1 (React Flow events become domain commands)", () => {
  it("addGraphNodeCommand adds a node to the lensed graph, validated the same way Graph.addNode always is", () => {
    const project = baseProject();
    const cmd = addGraphNodeCommand(systemAutomationGraphLens, { layer: "system-automation", id: "n1", data: { any: "thing" } });
    const result = cmd.apply(project);
    expect(result.ok).toBe(true);
    expect(mustOk(result).systemAutomationGraph.nodes).toHaveLength(1);
  });

  it("addGraphNodeCommand rejects a duplicate id with a structured DomainError, same as Graph.addNode", () => {
    const project = baseProject();
    const cmd = addGraphNodeCommand(systemAutomationGraphLens, { layer: "system-automation", id: "n1", data: {} });
    const once = mustOk(cmd.apply(project));
    const twice = cmd.apply(once);
    expect(twice.ok).toBe(false);
  });

  it("addGraphEdgeCommand derives `layer` from the lensed graph state — callers never supply it", () => {
    const project = baseProject();
    const withNodes = mustOk(
      addGraphNodeCommand(systemAutomationGraphLens, { layer: "system-automation", id: "a", data: {} }).apply(project),
    );
    const withNodes2 = mustOk(
      addGraphNodeCommand(systemAutomationGraphLens, { layer: "system-automation", id: "b", data: {} }).apply(withNodes),
    );
    const cmd = addGraphEdgeCommand(systemAutomationGraphLens, { id: "e1", source: "a", target: "b" });
    const result = mustOk(cmd.apply(withNodes2));
    expect(result.systemAutomationGraph.edges).toEqual([{ layer: "system-automation", id: "e1", source: "a", target: "b" }]);
  });

  it("removeGraphNodeCommand cascades to remove dependent edges", () => {
    const project = baseProject();
    let p = mustOk(addGraphNodeCommand(systemAutomationGraphLens, { layer: "system-automation", id: "a", data: {} }).apply(project));
    p = mustOk(addGraphNodeCommand(systemAutomationGraphLens, { layer: "system-automation", id: "b", data: {} }).apply(p));
    p = mustOk(addGraphEdgeCommand(systemAutomationGraphLens, { id: "e1", source: "a", target: "b" }).apply(p));
    const result = mustOk(removeGraphNodeCommand(systemAutomationGraphLens, "a").apply(p));
    expect(result.systemAutomationGraph.nodes.map((n) => n.id)).toEqual(["b"]);
    expect(result.systemAutomationGraph.edges).toHaveLength(0);
  });

  it("removeGraphEdgeCommand removes only the targeted edge", () => {
    const project = baseProject();
    let p = mustOk(addGraphNodeCommand(systemAutomationGraphLens, { layer: "system-automation", id: "a", data: {} }).apply(project));
    p = mustOk(addGraphNodeCommand(systemAutomationGraphLens, { layer: "system-automation", id: "b", data: {} }).apply(p));
    p = mustOk(addGraphEdgeCommand(systemAutomationGraphLens, { id: "e1", source: "a", target: "b" }).apply(p));
    const result: Result<ProjectV1, DomainError> = removeGraphEdgeCommand(systemAutomationGraphLens, "e1").apply(p);
    expect(mustOk(result).systemAutomationGraph.edges).toHaveLength(0);
    expect(mustOk(result).systemAutomationGraph.nodes).toHaveLength(2);
  });

  describe("updateAuthoringMetadataCommand — S043 § Verifiche (position/selection never alters domain validation)", () => {
    it("never touches any graph, only authoringMetadata", () => {
      const project = baseProject();
      const before = project.systemAutomationGraph;
      const result = mustOk(updateAuthoringMetadataCommand("some-node", { position: { x: 5, y: 6 } }).apply(project));
      expect(result.systemAutomationGraph).toBe(before);
      expect(result.authoringMetadata["some-node"]).toEqual({ position: { x: 5, y: 6 } });
    });

    it("cannot fail — even for a node id that does not exist in any graph", () => {
      const project = baseProject();
      const result = updateAuthoringMetadataCommand("nonexistent-node-id", { selected: true }).apply(project);
      expect(result.ok).toBe(true);
    });

    it("merges into any existing metadata for the same id rather than overwriting it", () => {
      const project = baseProject();
      const withPosition = mustOk(updateAuthoringMetadataCommand("n1", { position: { x: 1, y: 1 } }).apply(project));
      const withSelection = mustOk(updateAuthoringMetadataCommand("n1", { selected: true }).apply(withPosition));
      expect(withSelection.authoringMetadata["n1"]).toEqual({ position: { x: 1, y: 1 }, selected: true });
    });
  });
});
