import { Handle, Position, type NodeProps } from "@xyflow/react";
import { PROCESSING_NODE_KIND_CONFIG } from "./node-kinds.js";
import type { ProcessingNodeUiData } from "./to-nodes.js";

const HANDLE_STYLE = { width: 10, height: 10, background: "var(--color-brand-blue)", border: "2px solid var(--color-surface)" };

/**
 * `ux/screens/S070-processing-graph-editor/visual.md` § Anatomia del nodo — 224px,
 * barra laterale 3px colore-categoria, chip icona 24×24 (colore-categoria 12%),
 * titolo 14/600 troncato, sottotitolo 12px.
 *
 * Handles: Schedule/Event-source (pure triggers) get a source handle only;
 * Block gets both, since Blocks can chain into each other on the wire
 * (`config-compiler`'s `compileConfig` reads `processingGraph.edges` into real
 * `CanonicalEdge`s). Rule gets none — on the wire a Rule has no input/output
 * port at all (`RULE_AS_EDGE_TARGET`/`OUTPUT_NODE_AS_SOURCE` in
 * `validate-processing-graph.ts`); its source/target are Module references
 * picked in the Inspector's dropdowns, not an edge to another processing node.
 * Every catalog entry exposes a single unnamed port today (no per-block port
 * list on the wire yet — see `device-processing-graph-model`'s `ports.ts`), so
 * both handles use a fixed id "0"; a real type-compatibility check isn't
 * possible yet for the same reason, so an edge that turns out invalid (a
 * cycle, or any other structural problem) is left to surface as a Dry-run
 * error instead of being blocked at connect time.
 */
export function ProcessingNode({ data, selected }: NodeProps & { readonly data: ProcessingNodeUiData }) {
  const config = PROCESSING_NODE_KIND_CONFIG[data.kind];
  const Icon = config.icon;
  const hasTarget = data.kind === "block";
  const hasSource = data.kind === "block" || data.kind === "schedule" || data.kind === "event-source";

  return (
    <div
      className="flex w-56 items-center gap-3 rounded-slmd bg-surface p-3 shadow-e1"
      style={{
        borderLeft: `3px solid ${data.hasError ? "var(--color-error)" : config.colorVar}`,
        outline: selected ? "2px solid var(--color-brand-blue)" : "1px solid var(--color-border)",
      }}
    >
      {hasTarget && <Handle type="target" position={Position.Top} id="0" style={HANDLE_STYLE} />}
      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-slsm" style={{ backgroundColor: `color-mix(in srgb, ${config.colorVar} 12%, transparent)` }}>
        <Icon size={14} style={{ color: config.colorVar }} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate font-body text-sm font-semibold text-ink">{data.label}</div>
        <div className="truncate font-body text-xs text-ink-faint">{data.subtitle}</div>
      </div>
      {hasSource && <Handle type="source" position={Position.Bottom} id="0" style={HANDLE_STYLE} />}
    </div>
  );
}

export const PROCESSING_NODE_TYPES = { processing: ProcessingNode };
