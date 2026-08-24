import { describe, expect, it } from "vitest";
import type { NodeRedFlowNode } from "../flow-compiler.js";
import { ownedNodeIds, reconcileFlows } from "../reconcile.js";

describe("reconcileFlows — S113 § Verifiche (a deploy preserves flows not owned by the project)", () => {
  it("preserves every node not owned by this project untouched", () => {
    const userNode: NodeRedFlowNode = { id: "user-1", type: "inject", name: "my own flow" };
    const otherProjectNode: NodeRedFlowNode = { id: "other-1", type: "spaghetti-record-source", spaghettiOwned: true, spaghettiProjectId: "project-2" };
    const compiled: NodeRedFlowNode[] = [{ id: "new-1", type: "spaghetti-record-source", spaghettiOwned: true, spaghettiProjectId: "project-1" }];

    const merged = reconcileFlows([userNode, otherProjectNode], compiled, "project-1");

    expect(merged).toContainEqual(userNode);
    expect(merged).toContainEqual(otherProjectNode);
    expect(merged).toContainEqual(compiled[0]);
  });

  it("replaces this project's previously deployed nodes with the freshly compiled ones", () => {
    const staleNode: NodeRedFlowNode = { id: "old-1", type: "spaghetti-record-source", spaghettiOwned: true, spaghettiProjectId: "project-1" };
    const compiled: NodeRedFlowNode[] = [{ id: "new-1", type: "spaghetti-record-source", spaghettiOwned: true, spaghettiProjectId: "project-1" }];

    const merged = reconcileFlows([staleNode], compiled, "project-1");

    expect(merged.some((n) => n.id === "old-1")).toBe(false);
    expect(merged.some((n) => n.id === "new-1")).toBe(true);
  });
});

describe("ownedNodeIds", () => {
  it("lists only this project's own node ids", () => {
    const nodes: NodeRedFlowNode[] = [
      { id: "a", type: "inject" },
      { id: "b", type: "spaghetti-record-source", spaghettiOwned: true, spaghettiProjectId: "project-1" },
      { id: "c", type: "spaghetti-record-source", spaghettiOwned: true, spaghettiProjectId: "project-2" },
    ];
    expect(ownedNodeIds(nodes, "project-1")).toEqual(["b"]);
  });
});
