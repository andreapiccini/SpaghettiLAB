import { domainError, type DomainError } from "./errors.js";
import type { GraphLayer } from "./graph-layer.js";
import { err, ok, type Result } from "./result.js";

export const GraphErrorCode = {
  CROSS_LAYER_REFERENCE: "domain.graph.cross_layer_reference",
  DUPLICATE_NODE: "domain.graph.duplicate_node",
  DANGLING_EDGE_ENDPOINT: "domain.graph.dangling_edge_endpoint",
} as const;

export type GraphNode<Layer extends GraphLayer, Id extends string, Data> = {
  readonly layer: Layer;
  readonly id: Id;
  /** Deployable content only — never authoring metadata; see `authoring-metadata.ts`. */
  readonly data: Data;
};

export type GraphEdge<Layer extends GraphLayer, Id extends string, EdgeId extends string> = {
  readonly layer: Layer;
  readonly id: EdgeId;
  readonly source: Id;
  readonly target: Id;
};

/**
 * A graph whose nodes/edges all belong to exactly one `GraphLayer`. Adding a
 * node or edge tagged with a different layer, or an edge whose endpoint isn't
 * a registered node of this graph, is rejected with a structured error
 * instead of silently accepted — this is the runtime half of "riferimenti fra
 * layer non consentiti sono rifiutati" (the type-level half is that `Id` and
 * `EdgeId` are branded per S012, so a `ModuleId` can't be passed where the
 * caller declared a `NodeRedResourceId` is expected).
 */
export class Graph<Layer extends GraphLayer, Id extends string, EdgeId extends string, Data> {
  private readonly nodeMap = new Map<Id, GraphNode<Layer, Id, Data>>();
  private readonly edgeList: GraphEdge<Layer, Id, EdgeId>[] = [];

  constructor(readonly layer: Layer) {}

  addNode(node: GraphNode<Layer, Id, Data>): Result<GraphNode<Layer, Id, Data>, DomainError> {
    if (node.layer !== this.layer) {
      return err(
        domainError({
          code: GraphErrorCode.CROSS_LAYER_REFERENCE,
          path: [this.layer, "nodes", node.id],
          target: node.id,
          remediation: `A "${node.layer}" node cannot be added to the "${this.layer}" graph — build it in the graph matching its own layer instead.`,
        }),
      );
    }
    if (this.nodeMap.has(node.id)) {
      return err(
        domainError({
          code: GraphErrorCode.DUPLICATE_NODE,
          path: [this.layer, "nodes", node.id],
          target: node.id,
          remediation: `A node with ID "${node.id}" already exists in this graph.`,
        }),
      );
    }
    this.nodeMap.set(node.id, node);
    return ok(node);
  }

  addEdge(
    edge: GraphEdge<Layer, Id, EdgeId>,
  ): Result<GraphEdge<Layer, Id, EdgeId>, DomainError> {
    if (edge.layer !== this.layer) {
      return err(
        domainError({
          code: GraphErrorCode.CROSS_LAYER_REFERENCE,
          path: [this.layer, "edges", edge.id],
          target: edge.id,
          remediation: `A "${edge.layer}" edge cannot be added to the "${this.layer}" graph — cross-layer connections belong to the System Automation Graph (S110), not a direct edge here.`,
        }),
      );
    }
    for (const endpoint of [edge.source, edge.target] as const) {
      if (!this.nodeMap.has(endpoint)) {
        return err(
          domainError({
            code: GraphErrorCode.DANGLING_EDGE_ENDPOINT,
            path: [this.layer, "edges", edge.id],
            target: endpoint,
            remediation: `Edge "${edge.id}" references node "${endpoint}", which is not registered in this graph. Add the node first.`,
          }),
        );
      }
    }
    this.edgeList.push(edge);
    return ok(edge);
  }

  getNode(id: Id): GraphNode<Layer, Id, Data> | undefined {
    return this.nodeMap.get(id);
  }

  getNodes(): readonly GraphNode<Layer, Id, Data>[] {
    return [...this.nodeMap.values()];
  }

  getEdges(): readonly GraphEdge<Layer, Id, EdgeId>[] {
    return [...this.edgeList];
  }
}

export function createPhysicalCompositionGraph<
  Id extends string,
  EdgeId extends string,
  Data,
>(): Graph<"physical-composition", Id, EdgeId, Data> {
  return new Graph("physical-composition");
}

export function createDeviceProcessingGraph<
  Id extends string,
  EdgeId extends string,
  Data,
>(): Graph<"device-processing", Id, EdgeId, Data> {
  return new Graph("device-processing");
}

export function createSystemAutomationGraph<
  Id extends string,
  EdgeId extends string,
  Data,
>(): Graph<"system-automation", Id, EdgeId, Data> {
  return new Graph("system-automation");
}

/**
 * A deterministic, metadata-free view of a graph's deployable content —
 * nodes and edges only, sorted by ID so unrelated authoring changes (adding
 * nodes in a different order) don't change the result. Used to prove that
 * authoring metadata (position, viewport, ...) never affects what would be
 * compiled — see `authoring-metadata.ts`. Not the canonical Config
 * serialization (that is S072's job); this is only a domain-level equality
 * check.
 */
export function deployableSnapshot<
  Layer extends GraphLayer,
  Id extends string,
  EdgeId extends string,
  Data,
>(graph: Graph<Layer, Id, EdgeId, Data>): string {
  const nodes = [...graph.getNodes()]
    .sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))
    .map((n) => ({ id: n.id, data: n.data }));
  const edges = [...graph.getEdges()]
    .sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))
    .map((e) => ({ id: e.id, source: e.source, target: e.target }));
  return JSON.stringify({ layer: graph.layer, nodes, edges });
}
