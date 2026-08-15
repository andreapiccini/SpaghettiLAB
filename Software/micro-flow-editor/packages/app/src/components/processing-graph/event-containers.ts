import type { AuthoringMetadata, GraphState } from "@spaghettilab/domain";
import type { DeviceProcessingNodeData } from "@spaghettilab/device-processing-graph-model";
import { EVENT_CONTAINER_HEADER_HEIGHT, NODE_HEIGHT, NODE_PADDING, NODE_WIDTH } from "./layout-constants.js";

export type EventContainer = {
  readonly id: string;
  readonly triggerId: string;
  readonly label: string;
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  /** Real Block/Rule ids reachable from this trigger — become React Flow children. */
  readonly memberIds: readonly string[];
};

/**
 * One dashed container per Schedule/Event-source, always rendered — even with
 * no members yet, so there is always a real drop target to build a chain into
 * instead of the container only appearing after a first edge already exists.
 * Anchored at the trigger's own real, stored position — the same
 * `AuthoringMetadata.position` every other node uses — so the trigger drags
 * like a normal node and its container follows.
 *
 * Membership is still edge-derived, walked transitively from the trigger's
 * outgoing edges (Block -> Block chains included): per `AuthoringMetadata`'s
 * own contract, position/grouping must never become the source of truth for
 * what the compiled Config runs, only the graph's real edges may decide that.
 * `ProcessingGraphScreen`'s drop handling creates a real edge when a block is
 * dropped into a container — this only ever reacts to an edge that now
 * exists, it never treats containment itself as membership. Rule is never a
 * member — it has no outgoing edges to reach through (a Rule's own
 * source/target are Module references, not graph edges) and never anchors a
 * container either, since it's never a trigger.
 */
export function computeEventContainers(
  graphState: GraphState<"device-processing">,
  authoringMetadata: Readonly<Record<string, AuthoringMetadata>>,
  // Live, uncommitted positions (from React Flow's own node state, updated on
  // every drag frame) take priority over authoringMetadata's last-committed
  // position — this is what makes the container grow/shrink while the trigger
  // or a member is still being dragged, instead of only after the drag commits.
  livePositions?: ReadonlyMap<string, { readonly x: number; readonly y: number }>,
): readonly EventContainer[] {
  const nodesById = new Map(graphState.nodes.map((n) => [n.id, n]));
  const outgoing = new Map<string, string[]>();
  for (const edge of graphState.edges) {
    const list = outgoing.get(edge.source) ?? [];
    list.push(edge.target);
    outgoing.set(edge.source, list);
  }

  const containers: EventContainer[] = [];
  for (const node of graphState.nodes) {
    const data = node.data as DeviceProcessingNodeData;
    if (data.kind !== "schedule" && data.kind !== "event-source") continue;

    const triggerPos = livePositions?.get(node.id) ?? authoringMetadata[node.id]?.position ?? { x: 0, y: 0 };

    const memberIds = new Set<string>();
    const queue = [...(outgoing.get(node.id) ?? [])];
    while (queue.length > 0) {
      const id = queue.shift()!;
      if (memberIds.has(id) || id === node.id) continue;
      memberIds.add(id);
      for (const next of outgoing.get(id) ?? []) queue.push(next);
    }

    // Members only ever grow the box to the right/down of the trigger's own
    // anchor (never negative) — matches the clamp ProcessingGraphScreen
    // applies when a block is connected into the chain.
    let maxRelX = 0;
    let maxRelY = 0;
    for (const id of memberIds) {
      if (!nodesById.has(id)) continue;
      const pos = livePositions?.get(id) ?? authoringMetadata[id]?.position ?? { x: 0, y: 0 };
      maxRelX = Math.max(maxRelX, pos.x - triggerPos.x);
      maxRelY = Math.max(maxRelY, pos.y - triggerPos.y);
    }

    const meta = authoringMetadata[node.id];
    const label = meta?.comment && meta.comment.trim() !== "" ? meta.comment : data.kind === "schedule" ? `ogni ${data.periodMs}ms` : "Event source";
    // Rounded to whole pixels: React Flow's ResizeObserver measures the actual
    // rendered DOM size and would dispatch a "dimensions" change to reconcile
    // it back into a controlled node whenever it disagrees with an asserted
    // sub-pixel value (e.g. 582.995 vs the browser's own rounded layout) —
    // this container never declares a top-level width/height prop (see
    // ProcessingGraphScreen), so that reconciliation loop doesn't apply here,
    // but whole pixels keep the CSS-declared size and any future measurement
    // consistent regardless.
    containers.push({
      id: `container-${node.id}`,
      triggerId: node.id,
      label,
      x: Math.round(triggerPos.x - NODE_PADDING),
      y: Math.round(triggerPos.y - NODE_PADDING - EVENT_CONTAINER_HEADER_HEIGHT),
      width: Math.round(maxRelX + NODE_WIDTH + NODE_PADDING * 2),
      height: Math.round(maxRelY + NODE_HEIGHT + NODE_PADDING * 2 + EVENT_CONTAINER_HEADER_HEIGHT),
      memberIds: Array.from(memberIds).filter((id) => nodesById.has(id)),
    });
  }
  return containers;
}
