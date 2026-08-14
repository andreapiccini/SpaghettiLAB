import type { NodeProps } from "@xyflow/react";

export type TriggerGroupNodeData = { readonly label: string };

/**
 * A dashed box behind a trigger and everything it reaches by real outgoing
 * edges — purely a rendering aid over data the canvas already has (positions
 * + edges), not a new graph concept. The trigger itself is never rendered as
 * its own card once it has a group (ProcessingGraphScreen filters it out of
 * the render, though it's still a real node in the domain graph) — this box
 * *is* its on-canvas representation, so it's clickable (this node's `id` is
 * the trigger's own real id, so the existing onNodeClick already opens the
 * right Inspector, no special-casing needed) instead of `pointer-events:
 * none`. Real nodes render on top of it (default zIndex 0 vs this node's -1)
 * and are their own separate elements, so clicks on them still reach them
 * normally — only the empty dashed-border area is this node's own hit area.
 */
export function TriggerGroupNode({ data }: NodeProps & { readonly data: TriggerGroupNodeData }) {
  return (
    <div className="group h-full w-full cursor-pointer rounded-slmd border-2 border-dashed transition-colors hover:border-brand-blue" style={{ borderColor: "var(--color-border-strong)" }}>
      <span className="absolute -top-6 left-0 whitespace-nowrap rounded-slsm bg-surface px-1.5 py-0.5 font-body text-xs text-ink-faint group-hover:text-brand-blue">{data.label}</span>
    </div>
  );
}

export const TRIGGER_GROUP_NODE_TYPES = { "trigger-group": TriggerGroupNode };
