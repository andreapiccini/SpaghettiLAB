import { createEmptyProject, projectId, type ProjectV1, type Result } from "@spaghettilab/domain";
import type { HandleDescriptor } from "@spaghettilab/editor-model";
import type { Connection, EdgeChange, NodeChange } from "@xyflow/react";
import { describe, expect, it } from "vitest";
import { addGraphNodeCommand } from "../graph-commands.js";
import { systemAutomationGraphLens } from "../graph-lens.js";
import { connectionToCommand, edgeChangesToCommands, nodeChangesToCommands } from "../react-flow-events.js";

function mustOk<T, E>(result: Result<T, E>): T {
  if (!result.ok) throw new Error("expected an ok Result in test fixture setup");
  return result.value;
}

function baseProject(): ProjectV1 {
  const id = mustOk(projectId("dddddddd-0000-4000-8000-000000000001"));
  return createEmptyProject(id, "s043-events-fixture");
}

function outputHandle(overrides: Partial<HandleDescriptor> = {}): HandleDescriptor {
  return { handleId: "out", direction: "output", valueType: "uint", ...overrides };
}

function inputHandle(overrides: Partial<HandleDescriptor> = {}): HandleDescriptor {
  return { handleId: "in", direction: "input", valueType: "uint", ...overrides };
}

describe("nodeChangesToCommands", () => {
  it("turns a position change into updateAuthoringMetadataCommand, never a graph mutation", () => {
    const change: NodeChange = { id: "n1", type: "position", position: { x: 3, y: 4 } };
    const commands = nodeChangesToCommands([change], systemAutomationGraphLens);
    expect(commands).toHaveLength(1);
    expect(commands[0]!.kind).toBe("UpdateAuthoringMetadata");
    const result = mustOk(commands[0]!.apply(baseProject()));
    expect(result.authoringMetadata["n1"]).toEqual({ position: { x: 3, y: 4 } });
  });

  it("turns a select change into updateAuthoringMetadataCommand", () => {
    const change: NodeChange = { id: "n1", type: "select", selected: true };
    const commands = nodeChangesToCommands([change], systemAutomationGraphLens);
    expect(commands[0]!.kind).toBe("UpdateAuthoringMetadata");
  });

  it("turns a remove change into removeGraphNodeCommand", () => {
    const change: NodeChange = { id: "n1", type: "remove" };
    const commands = nodeChangesToCommands([change], systemAutomationGraphLens);
    expect(commands[0]!.kind).toBe("RemoveGraphNode");
  });

  it("ignores dimensions/add/replace changes — React Flow rendering bookkeeping only, never authoritative", () => {
    const changes: NodeChange[] = [
      { id: "n1", type: "dimensions", dimensions: { width: 10, height: 10 } },
    ];
    expect(nodeChangesToCommands(changes, systemAutomationGraphLens)).toHaveLength(0);
  });
});

describe("edgeChangesToCommands", () => {
  it("turns a select change into updateAuthoringMetadataCommand and a remove change into removeGraphEdgeCommand", () => {
    const changes: EdgeChange[] = [
      { id: "e1", type: "select", selected: true },
      { id: "e2", type: "remove" },
    ];
    const commands = edgeChangesToCommands(changes, systemAutomationGraphLens);
    expect(commands.map((c) => c.kind)).toEqual(["UpdateAuthoringMetadata", "RemoveGraphEdge"]);
  });
});

describe("connectionToCommand — S042 compatibility gate before an edge is ever added", () => {
  const connection: Connection = { source: "a", target: "b", sourceHandle: "out", targetHandle: "in" };

  it("rejects when either handle cannot be resolved — a connection is never optimistically allowed through", () => {
    const result = connectionToCommand(connection, "e1", systemAutomationGraphLens, () => undefined);
    expect(result.ok).toBe(false);
  });

  it("rejects an incompatible connection (e.g. type mismatch) without producing a command", () => {
    const result = connectionToCommand(connection, "e1", systemAutomationGraphLens, (nodeId) =>
      nodeId === "a" ? outputHandle({ valueType: "uint" }) : inputHandle({ valueType: "text" }),
    );
    expect(result.ok).toBe(false);
  });

  it("produces addGraphEdgeCommand for a compatible connection", () => {
    const result = connectionToCommand(connection, "e1", systemAutomationGraphLens, (nodeId) =>
      nodeId === "a" ? outputHandle() : inputHandle(),
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.kind).toBe("AddGraphEdge");
      const project = baseProject();
      let p = mustOk(addGraphNodeCommand(systemAutomationGraphLens, { layer: "system-automation", id: "a", data: {} }).apply(project));
      p = mustOk(addGraphNodeCommand(systemAutomationGraphLens, { layer: "system-automation", id: "b", data: {} }).apply(p));
      const applied = mustOk(result.value.apply(p));
      expect(applied.systemAutomationGraph.edges).toEqual([{ layer: "system-automation", id: "e1", source: "a", target: "b" }]);
    }
  });
});
