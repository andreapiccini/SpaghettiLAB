import { BaseEdge, EdgeLabelRenderer, getSmoothStepPath, useReactFlow, type EdgeProps } from "@xyflow/react";
import { Trash2 } from "lucide-react";
import { useState } from "react";

/**
 * Processing Graph edge: hovering the wire (or selecting it) shows a trash
 * control at the midpoint. Click deletes via React Flow's `deleteElements`,
 * which goes through `onEdgesChange` → `removeGraphEdgeCommand`. Keyboard
 * Backspace/Delete still work on a selected edge (`deleteKeyCode` on the pane).
 *
 * Routed with `getSmoothStepPath` rather than a bezier: every segment is
 * strictly horizontal or vertical, joined only where one meets the other, and
 * only that join is ever curved (a rounded corner) — never a free diagonal or
 * an S-curve.
 */
export function DeletableEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style,
  markerEnd,
  selected,
}: EdgeProps) {
  const [hovered, setHovered] = useState(false);
  const { deleteElements } = useReactFlow();
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    borderRadius: 10,
  });
  const showDelete = hovered || selected;

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          ...style,
          stroke: showDelete ? "var(--color-brand-blue)" : style?.stroke,
        }}
      />
      <path
        d={edgePath}
        fill="none"
        stroke="transparent"
        strokeWidth={24}
        className="react-flow__edge-interaction"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      />
      <EdgeLabelRenderer>
        <div
          className="nodrag nopan"
          style={{
            position: "absolute",
            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            pointerEvents: "all",
            width: 28,
            height: 28,
          }}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
        >
          {showDelete && (
            <button
              type="button"
              aria-label="Elimina collegamento"
              className="flex h-7 w-7 items-center justify-center rounded-full border border-border-strong bg-surface text-ink-muted shadow-e1 hover:border-error hover:text-error"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                void deleteElements({ edges: [{ id }] });
              }}
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </EdgeLabelRenderer>
    </>
  );
}

export const PROCESSING_EDGE_TYPES = { deletable: DeletableEdge };
