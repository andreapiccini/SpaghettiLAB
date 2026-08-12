/**
 * Editor-only data about a node/edge: where it sits on screen, whether it's
 * selected, a free-text comment, which visual group it belongs to. Per
 * REACT_FLOW_ARCHITECTURE.md, this must never reach the firmware Config —
 * enforced here structurally, not by convention: `GraphNode.data` (see
 * `graph.ts`) has no field for any of this, and this store is a completely
 * separate map that nothing in the compile path (S072) ever reads from.
 */
export type AuthoringMetadata = {
  position?: { x: number; y: number };
  viewport?: { x: number; y: number; zoom: number };
  selected?: boolean;
  comment?: string;
  groupId?: string;
};

/** Keyed the same way as a graph's nodes/edges, but stored separately — see `AuthoringMetadata`. */
export class AuthoringMetadataStore<Id extends string> {
  private readonly metadata = new Map<Id, AuthoringMetadata>();

  set(id: Id, metadata: AuthoringMetadata): void {
    this.metadata.set(id, metadata);
  }

  get(id: Id): AuthoringMetadata | undefined {
    return this.metadata.get(id);
  }

  remove(id: Id): void {
    this.metadata.delete(id);
  }

  clear(): void {
    this.metadata.clear();
  }

  get size(): number {
    return this.metadata.size;
  }
}
