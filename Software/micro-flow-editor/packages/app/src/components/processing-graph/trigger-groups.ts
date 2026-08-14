import type { AuthoringMetadata, GraphState } from "@spaghettilab/domain";
import type { DeviceProcessingNodeData } from "@spaghettilab/device-processing-graph-model";

export type TriggerGroup = {
  readonly id: string;
  readonly triggerId: string;
  readonly label: string;
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
};

// Matches ProcessingNode.tsx's own rendered size (`w-56` = 224px; height is
// intrinsic there, this is a close-enough constant for a bounding box, not a
// pixel-exact one — the box only needs to visibly contain the real nodes).
const NODE_WIDTH = 224;
const NODE_HEIGHT = 64;
const PADDING = 24;

/**
 * One dashed group per Schedule/Event-source — a trigger and every Block it
 * reaches by real outgoing edges, walked transitively (Block -> Block chains
 * included). No new domain concept: this is exactly the "what does this
 * trigger actually run" relationship `config-compiler` already compiles from
 * `processingGraph.edges`, just drawn as a box instead of read one edge at a
 * time. Rule is never a member — it has no outgoing edges to reach through
 * (a Rule's own source/target are Module references, not graph edges) and
 * never anchors a group either, since it's never a trigger.
 */
export function computeTriggerGroups(graphState: GraphState<"device-processing">, authoringMetadata: Readonly<Record<string, AuthoringMetadata>>): readonly TriggerGroup[] {
  const nodesById = new Map(graphState.nodes.map((n) => [n.id, n]));
  const outgoing = new Map<string, string[]>();
  for (const edge of graphState.edges) {
    const list = outgoing.get(edge.source) ?? [];
    list.push(edge.target);
    outgoing.set(edge.source, list);
  }

  const groups: TriggerGroup[] = [];
  for (const node of graphState.nodes) {
    const data = node.data as DeviceProcessingNodeData;
    if (data.kind !== "schedule" && data.kind !== "event-source") continue;

    const memberIds = new Set<string>([node.id]);
    const queue = [...(outgoing.get(node.id) ?? [])];
    while (queue.length > 0) {
      const id = queue.shift()!;
      if (memberIds.has(id)) continue;
      memberIds.add(id);
      for (const next of outgoing.get(id) ?? []) queue.push(next);
    }
    if (memberIds.size <= 1) continue; // A trigger with nothing downstream has nothing to box.

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (const id of memberIds) {
      if (!nodesById.has(id)) continue;
      const pos = authoringMetadata[id]?.position ?? { x: 0, y: 0 };
      minX = Math.min(minX, pos.x);
      minY = Math.min(minY, pos.y);
      maxX = Math.max(maxX, pos.x + NODE_WIDTH);
      maxY = Math.max(maxY, pos.y + NODE_HEIGHT);
    }
    if (!Number.isFinite(minX)) continue;

    const meta = authoringMetadata[node.id];
    const label = meta?.comment && meta.comment.trim() !== "" ? meta.comment : data.kind === "schedule" ? `ogni ${data.periodMs}ms` : "Event source";
    groups.push({
      id: `group-${node.id}`,
      triggerId: node.id,
      label,
      x: minX - PADDING,
      y: minY - PADDING,
      width: maxX - minX + PADDING * 2,
      height: maxY - minY + PADDING * 2,
    });
  }
  return groups;
}
