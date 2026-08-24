import type { GraphLayer, GraphState, ProjectV1 } from "@spaghettilab/domain";

/**
 * Locates one `GraphState` inside a `ProjectV1` and knows how to write an
 * updated copy back — e.g. "the device-processing graph for Core X" (one of
 * several in `project.deviceGraphs`) or "the project's single
 * `systemAutomationGraph`". Keeps the graph-editing commands below decoupled
 * from `ProjectV1`'s exact shape: they only ever call `lens.get`/`lens.set`,
 * never index into `physicalGraphs`/`deviceGraphs`/`systemAutomationGraph`
 * themselves.
 */
export type GraphLens<Layer extends GraphLayer> = {
  readonly get: (project: ProjectV1) => GraphState<Layer>;
  readonly set: (project: ProjectV1, graph: GraphState<Layer>) => ProjectV1;
};

/** A `GraphLens` for `ProjectV1.systemAutomationGraph` — the one graph that isn't per-Core. */
export const systemAutomationGraphLens: GraphLens<"system-automation"> = {
  get: (project) => project.systemAutomationGraph,
  set: (project, graph) => ({ ...project, systemAutomationGraph: graph }),
};

/** A `GraphLens` for one entry of `ProjectV1.deviceGraphs` (one per Core), matched by array index. */
export function deviceGraphLens(index: number): GraphLens<"device-processing"> {
  return {
    get: (project) => project.deviceGraphs[index]!,
    set: (project, graph) => ({
      ...project,
      deviceGraphs: project.deviceGraphs.map((g, i) => (i === index ? graph : g)),
    }),
  };
}

/** A `GraphLens` for one entry of `ProjectV1.physicalGraphs` (one per Core), matched by array index. */
export function physicalGraphLens(index: number): GraphLens<"physical-composition"> {
  return {
    get: (project) => project.physicalGraphs[index]!,
    set: (project, graph) => ({
      ...project,
      physicalGraphs: project.physicalGraphs.map((g, i) => (i === index ? graph : g)),
    }),
  };
}
