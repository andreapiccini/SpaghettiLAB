import {
  Graph,
  ok,
  type AuthoringMetadata,
  type GraphEdge,
  type GraphLayer,
  type GraphNode,
  type GraphState,
  type ProjectCommand,
} from "@spaghettilab/domain";
import type { GraphLens } from "./graph-lens.js";

/** Rebuilds a validating `Graph` from persisted plain data — `GraphState` is already known-valid (it was persisted), so `addNode`/`addEdge` here are just a mechanical replay, not a place new validation failures are expected. */
function toMutableGraph<Layer extends GraphLayer>(state: GraphState<Layer>): Graph<Layer, string, string, unknown> {
  const graph = new Graph<Layer, string, string, unknown>(state.layer);
  for (const node of state.nodes) graph.addNode(node);
  for (const edge of state.edges) graph.addEdge(edge);
  return graph;
}

function toGraphState<Layer extends GraphLayer>(graph: Graph<Layer, string, string, unknown>): GraphState<Layer> {
  return { layer: graph.layer, nodes: graph.getNodes(), edges: graph.getEdges() };
}

/**
 * Turns "the user dropped a new node on the canvas" into a `ProjectCommand`
 * (S043 point 1: "gli eventi React Flow diventano command di dominio").
 * Validated the same way any other node addition is (`Graph.addNode`) —
 * duplicate IDs and cross-layer nodes are rejected with the same structured
 * error, not a separate, looser check for the UI path.
 */
export function addGraphNodeCommand<Layer extends GraphLayer>(
  lens: GraphLens<Layer>,
  node: GraphNode<Layer, string, unknown>,
): ProjectCommand {
  return {
    kind: "AddGraphNode",
    apply: (project) => {
      const mutable = toMutableGraph(lens.get(project));
      const result = mutable.addNode(node);
      if (!result.ok) return result;
      return ok(lens.set(project, toGraphState(mutable)));
    },
  };
}

/**
 * `layer` is deliberately not part of `edge` — the caller (`react-flow-events.ts`)
 * only knows the two endpoint IDs and a new edge ID from a React Flow
 * `Connection`, not which `GraphLayer` they live in; that's derived here from
 * the lens's own graph state, the same source of truth `toMutableGraph` uses.
 */
export function addGraphEdgeCommand<Layer extends GraphLayer>(
  lens: GraphLens<Layer>,
  edge: Omit<GraphEdge<Layer, string, string>, "layer">,
): ProjectCommand {
  return {
    kind: "AddGraphEdge",
    apply: (project) => {
      const graphState = lens.get(project);
      const mutable = toMutableGraph(graphState);
      const result = mutable.addEdge({ ...edge, layer: graphState.layer });
      if (!result.ok) return result;
      return ok(lens.set(project, toGraphState(mutable)));
    },
  };
}

/**
 * Turns "the user saved the Inspector form for an existing node" into a
 * `ProjectCommand` — the edit counterpart to `addGraphNodeCommand`. Uses
 * `Graph.updateNode()`, not a remove-then-add, so edges referencing this node
 * survive the edit (S050's Physical Composition Editor is the first real
 * caller: saving a Module's Port/Bay/Rail/endpoint must not silently drop
 * unrelated cabling).
 */
export function updateGraphNodeCommand<Layer extends GraphLayer>(
  lens: GraphLens<Layer>,
  node: GraphNode<Layer, string, unknown>,
): ProjectCommand {
  return {
    kind: "UpdateGraphNode",
    apply: (project) => {
      const mutable = toMutableGraph(lens.get(project));
      const result = mutable.updateNode(node);
      if (!result.ok) return result;
      return ok(lens.set(project, toGraphState(mutable)));
    },
  };
}

/** Cascades to remove dependent edges too — matches the "delete node" action already specified in `UX-S070`'s Inspector, never leaving a dangling edge behind. */
export function removeGraphNodeCommand<Layer extends GraphLayer>(
  lens: GraphLens<Layer>,
  nodeId: string,
): ProjectCommand {
  return {
    kind: "RemoveGraphNode",
    apply: (project) => {
      const mutable = toMutableGraph(lens.get(project));
      const result = mutable.removeNodeCascade(nodeId);
      if (!result.ok) return result;
      return ok(lens.set(project, toGraphState(mutable)));
    },
  };
}

export function removeGraphEdgeCommand<Layer extends GraphLayer>(
  lens: GraphLens<Layer>,
  edgeId: string,
): ProjectCommand {
  return {
    kind: "RemoveGraphEdge",
    apply: (project) => {
      const mutable = toMutableGraph(lens.get(project));
      const result = mutable.removeEdge(edgeId);
      if (!result.ok) return result;
      return ok(lens.set(project, toGraphState(mutable)));
    },
  };
}

/**
 * Position/selection/viewport changes never touch a graph and can never
 * fail — this command exists only so every `ProjectV1` mutation, including
 * authoring metadata, still goes through `CommandStack` (S014: "ogni
 * mutazione del dominio passa da un comando"). It cannot reject based on
 * graph content because it never reads graph content (S043 § Verifiche: "lo
 * stato React Flow ... non altera l'esito della validazione di dominio").
 */
export function updateAuthoringMetadataCommand(id: string, patch: Partial<AuthoringMetadata>): ProjectCommand {
  return {
    kind: "UpdateAuthoringMetadata",
    apply: (project) =>
      ok({
        ...project,
        authoringMetadata: {
          ...project.authoringMetadata,
          [id]: { ...project.authoringMetadata[id], ...patch },
        },
      }),
  };
}
