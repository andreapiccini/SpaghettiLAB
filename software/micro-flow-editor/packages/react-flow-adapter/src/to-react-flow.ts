import type { AuthoringMetadata, GraphLayer, GraphState } from "@spaghettilab/domain";
import { isPlaceholderDiagnostic, resolveNodeType, type EditorModel, type NodeTypeDescriptor, type PlaceholderDiagnostic } from "@spaghettilab/editor-model";
import type { Edge, Node } from "@xyflow/react";

export type DomainNodeData = {
  readonly domainId: string;
  readonly domainData: unknown;
  /** Resolved via `EditorModel` only — never a `switch (typeId)` or a concrete component import per type (S043 point 2/§ Verifiche). A new catalog entry appears here automatically once `EditorModel` knows about it. */
  readonly resolvedType: NodeTypeDescriptor | PlaceholderDiagnostic;
};

/**
 * Converts one graph layer's persisted nodes into React Flow `Node`s. Position
 * and selection come from `AuthoringMetadata` — never from the domain graph
 * itself, which has no such fields (S013). React Flow's `type` field is left
 * `undefined`: which component renders a node is a UI-layer decision made
 * from `resolvedType`, not baked in here — this file has no per-type
 * branching to keep in sync when the catalog changes (S043 point 2).
 */
export function toReactFlowNodes<Layer extends GraphLayer>(
  graphState: GraphState<Layer>,
  authoringMetadata: Readonly<Record<string, AuthoringMetadata>>,
  editorModel: EditorModel,
  typeIdOf: (nodeData: unknown) => string,
): Node<DomainNodeData>[] {
  return graphState.nodes.map((node) => {
    const meta = authoringMetadata[node.id];
    const typeId = typeIdOf(node.data);
    return {
      id: node.id,
      position: meta?.position ?? { x: 0, y: 0 },
      selected: meta?.selected ?? false,
      data: {
        domainId: node.id,
        domainData: node.data,
        resolvedType: resolveNodeType(typeId, editorModel, node.data),
      },
    };
  });
}

export function toReactFlowEdges<Layer extends GraphLayer>(graphState: GraphState<Layer>): Edge[] {
  return graphState.edges.map((edge) => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    sourceHandle: edge.sourceHandle,
    targetHandle: edge.targetHandle,
  }));
}

export { isPlaceholderDiagnostic };
