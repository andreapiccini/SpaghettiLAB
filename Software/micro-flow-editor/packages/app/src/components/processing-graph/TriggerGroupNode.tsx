import type { NodeProps } from "@xyflow/react";

export type TriggerGroupNodeData = { readonly label: string };

/**
 * A dashed box behind a trigger and everything it reaches by real outgoing
 * edges — purely a rendering aid over data the canvas already has (positions
 * + edges), not a new graph concept. `pointer-events: none` so it never
 * steals clicks/drags meant for the real nodes on top of it; ProcessingGraphScreen
 * already keeps these nodes non-draggable/non-selectable/non-connectable and
 * out of the domain graph entirely.
 */
export function TriggerGroupNode({ data }: NodeProps & { readonly data: TriggerGroupNodeData }) {
  return (
    <div className="pointer-events-none h-full w-full rounded-slmd border-2 border-dashed" style={{ borderColor: "var(--color-border-strong)" }}>
      <span className="absolute -top-6 left-0 whitespace-nowrap rounded-slsm bg-surface px-1.5 py-0.5 font-body text-xs text-ink-faint">{data.label}</span>
    </div>
  );
}

export const TRIGGER_GROUP_NODE_TYPES = { "trigger-group": TriggerGroupNode };
