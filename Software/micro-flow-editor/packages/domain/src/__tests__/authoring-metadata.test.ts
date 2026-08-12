import { describe, expect, it } from "vitest";
import { AuthoringMetadataStore } from "../authoring-metadata.js";
import { createDeviceProcessingGraph, deployableSnapshot } from "../graph.js";

function must<T>(result: { ok: boolean; value?: T }): T {
  if (!result.ok) throw new Error("expected ok result");
  return result.value as T;
}

describe("AuthoringMetadataStore", () => {
  it("stores and retrieves metadata independently of any graph", () => {
    const metadata = new AuthoringMetadataStore<string>();
    metadata.set("n1", { position: { x: 10, y: 20 }, selected: true });
    expect(metadata.get("n1")).toEqual({ position: { x: 10, y: 20 }, selected: true });
    expect(metadata.get("missing")).toBeUndefined();
  });

  it("remove/clear only ever touch the metadata store, never a graph", () => {
    const metadata = new AuthoringMetadataStore<string>();
    metadata.set("n1", { comment: "todo" });
    metadata.set("n2", { comment: "also todo" });
    metadata.remove("n1");
    expect(metadata.size).toBe(1);
    metadata.clear();
    expect(metadata.size).toBe(0);
  });

  it("changing or removing authoring metadata never changes a graph's deployable snapshot", () => {
    const graph = createDeviceProcessingGraph<string, string, { threshold: number }>();
    must(graph.addNode({ layer: "device-processing", id: "n1", data: { threshold: 42 } }));

    const metadata = new AuthoringMetadataStore<string>();
    metadata.set("n1", { position: { x: 0, y: 0 }, selected: false, comment: "initial" });
    const before = deployableSnapshot(graph);

    metadata.set("n1", { position: { x: 500, y: 500 }, selected: true, comment: "moved and renamed" });
    metadata.remove("n1");
    metadata.set("n1", { groupId: "group-a" });

    const after = deployableSnapshot(graph);
    expect(after).toBe(before);
  });
});
