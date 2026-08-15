import type { NodeProps } from "@xyflow/react";
import { PROCESSING_NODE_KIND_CONFIG } from "./node-kinds.js";

export type EventContainerNodeData = { readonly label: string; readonly kind: "schedule" | "event-source" };

/**
 * A real React Flow parent node representing "everything that runs when this
 * event fires" — a dashed rectangle whose members are true React Flow
 * children (`parentId`, set in ProcessingGraphScreen), not a decorative box
 * drawn behind independently-positioned nodes. This node's own id is the
 * trigger's real domain id, so onNodeClick's existing
 * `domainNodes.find(n => n.id === node.id)` lookup already opens the right
 * Inspector when the dashed area is clicked.
 */
export function EventContainerNode({ data }: NodeProps & { readonly data: EventContainerNodeData }) {
  const config = PROCESSING_NODE_KIND_CONFIG[data.kind];
  const Icon = config.icon;

  return (
    <div
      className="group flex h-full w-full cursor-pointer flex-col rounded-slmd border-2 border-dashed transition-colors hover:border-brand-blue"
      style={{ borderColor: "var(--color-border-strong)", backgroundColor: `color-mix(in srgb, ${config.colorVar} 4%, transparent)` }}
    >
      <div className="flex h-8 shrink-0 items-center gap-1.5 px-2">
        <Icon size={13} style={{ color: config.colorVar }} />
        <span className="truncate font-body text-xs font-semibold text-ink-muted group-hover:text-brand-blue">{data.label}</span>
      </div>
    </div>
  );
}

export const EVENT_CONTAINER_NODE_TYPES = { "event-container": EventContainerNode };
