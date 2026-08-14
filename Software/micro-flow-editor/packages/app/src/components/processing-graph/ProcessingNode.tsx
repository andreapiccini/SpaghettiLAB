import type { NodeProps } from "@xyflow/react";
import { PROCESSING_NODE_KIND_CONFIG } from "./node-kinds.js";
import type { ProcessingNodeUiData } from "./to-nodes.js";

/**
 * `ux/screens/S070-processing-graph-editor/visual.md` § Anatomia del nodo — 224px,
 * barra laterale 3px colore-categoria, chip icona 24×24 (colore-categoria 12%),
 * titolo 14/600 troncato, sottotitolo 12px. No connection handles rendered — same
 * reasoning as the Physical Composition Editor: `checkHandleCompatibility` (S042)
 * has no real port data for Block/Rule types yet (`device-processing-graph-model`'s
 * own `ports.ts` doc comment confirms this), so a drag-to-connect gesture that can
 * never resolve to a real compatibility check would mislead more than help.
 */
export function ProcessingNode({ data, selected }: NodeProps & { readonly data: ProcessingNodeUiData }) {
  const config = PROCESSING_NODE_KIND_CONFIG[data.kind];
  const Icon = config.icon;

  return (
    <div
      className="flex w-56 items-center gap-3 rounded-slmd bg-surface p-3 shadow-e1"
      style={{
        borderLeft: `3px solid ${data.hasError ? "var(--color-error)" : config.colorVar}`,
        outline: selected ? "2px solid var(--color-brand-blue)" : "1px solid var(--color-border)",
      }}
    >
      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-slsm" style={{ backgroundColor: `color-mix(in srgb, ${config.colorVar} 12%, transparent)` }}>
        <Icon size={14} style={{ color: config.colorVar }} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate font-body text-sm font-semibold text-ink">{data.label}</div>
        <div className="truncate font-body text-xs text-ink-faint">{data.subtitle}</div>
      </div>
    </div>
  );
}

export const PROCESSING_NODE_TYPES = { processing: ProcessingNode };
