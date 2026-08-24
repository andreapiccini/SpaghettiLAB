import type { NodeProps } from "@xyflow/react";
import { HoverDeleteButton } from "./HoverDeleteButton.js";
import { PROCESSING_NODE_KIND_CONFIG } from "./node-kinds.js";

export type EventContainerNodeData = {
  readonly label: string;
  readonly kind: "schedule" | "event-source";
  /** A member is being dragged past the top/left dashed edge — release outside detaches it. */
  readonly rejecting?: boolean;
  /** A free block is being dragged into this dashed box — release inside attaches it. */
  readonly accepting?: boolean;
};

/**
 * A real React Flow parent node representing "everything that runs when this
 * event fires" — a dashed rectangle whose members are true React Flow
 * children (`parentId`, set in ProcessingGraphScreen), not a decorative box
 * drawn behind independently-positioned nodes. This node's own id is the
 * trigger's real domain id, so onNodeClick's existing
 * `domainNodes.find(n => n.id === node.id)` lookup already opens the right
 * Inspector when the dashed area is clicked.
 */
export function EventContainerNode({ id, data, selected }: NodeProps & { readonly data: EventContainerNodeData }) {
  const config = PROCESSING_NODE_KIND_CONFIG[data.kind];
  const Icon = config.icon;

  const rejecting = data.rejecting === true;
  const accepting = data.accepting === true;
  const highlight = rejecting ? "var(--color-error)" : accepting ? "var(--color-success)" : undefined;
  const idle = highlight === undefined && !selected;
  return (
    <div
      className={`group relative flex h-full w-full cursor-pointer flex-col overflow-visible rounded-slmd border-2 border-dashed transition-colors ${idle ? "border-border-strong hover:border-brand-blue" : ""}`}
      style={{
        borderColor: highlight ?? (selected ? "var(--color-brand-blue)" : undefined),
        backgroundColor: highlight
          ? `color-mix(in srgb, ${highlight} 8%, transparent)`
          : selected
            ? `color-mix(in srgb, var(--color-brand-blue) 8%, transparent)`
            : `color-mix(in srgb, ${config.colorVar} 4%, transparent)`,
      }}
    >
      <HoverDeleteButton id={id} label="Elimina contenitore" forceVisible={selected} />
      <div className="flex h-8 shrink-0 items-center gap-1.5 px-2">
        <Icon size={13} style={{ color: config.colorVar }} />
        <span className="truncate font-body text-xs font-semibold text-ink-muted group-hover:text-brand-blue">{data.label}</span>
      </div>
    </div>
  );
}

export const EVENT_CONTAINER_NODE_TYPES = { "event-container": EventContainerNode };
