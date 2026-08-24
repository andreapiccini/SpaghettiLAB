import { Handle, Position, type NodeProps } from "@xyflow/react";
import { HoverDeleteButton } from "./HoverDeleteButton.js";
import { PROCESSING_NODE_KIND_CONFIG } from "./node-kinds.js";
import { nodeShellRadius, portsForKind, SOURCE_HANDLE_STYLE, TARGET_HANDLE_STYLE } from "./node-ports.js";
import type { ProcessingNodeUiData } from "./to-nodes.js";

/**
 * Canvas card: n8n-like (solid icon tile + title/subtitle, no category stripe).
 * Handles and shell radius come from `portsForKind` so a future kind only has
 * to declare input/output.
 *
 * Every catalog entry exposes a single unnamed port today (no per-block port
 * list on the wire yet — see `device-processing-graph-model`'s `ports.ts`), so
 * both handles use a fixed id "0"; a real type-compatibility check isn't
 * possible yet, so an invalid edge (cycle, etc.) surfaces as a Dry-run error.
 */
export function ProcessingNode({ id, data, selected }: NodeProps & { readonly data: ProcessingNodeUiData }) {
  const config = PROCESSING_NODE_KIND_CONFIG[data.kind];
  const Icon = config.icon;
  const ports = portsForKind(data.kind);
  const accent = data.hasError ? "var(--color-error)" : config.colorVar;

  return (
    <div className="group relative">
      <HoverDeleteButton id={id} label="Elimina blocco" forceVisible={selected} />
      <div
        className={`flex w-56 items-center gap-3 bg-surface px-3 py-2.5 shadow-e1 transition-[outline,box-shadow] group-hover:shadow-e2 ${selected ? "" : "outline outline-1 outline-[var(--color-border)] group-hover:outline-2 group-hover:outline-[var(--color-brand-blue)]"}`}
        style={{
          borderRadius: nodeShellRadius(ports),
          outline: selected ? "2px solid var(--color-brand-blue)" : undefined,
        }}
      >
        {ports.hasInput && <Handle type="target" position={Position.Left} id="0" style={TARGET_HANDLE_STYLE} />}
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-slsm" style={{ backgroundColor: accent }}>
          <Icon size={16} color="#fff" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate font-body text-sm font-semibold text-ink">{data.label}</div>
          <div className="truncate font-body text-xs text-ink-faint">{data.subtitle}</div>
        </div>
        {ports.hasOutput && <Handle type="source" position={Position.Right} id="0" style={SOURCE_HANDLE_STYLE} />}
      </div>
    </div>
  );
}

export const PROCESSING_NODE_TYPES = { processing: ProcessingNode };
