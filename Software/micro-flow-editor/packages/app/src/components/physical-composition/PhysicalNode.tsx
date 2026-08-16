import type { NodeProps } from "@xyflow/react";
import { ConfiguredPortNode } from "./ConfiguredPortNode.js";
import { NODE_KIND_CONFIG } from "./node-kinds.js";
import type { PhysicalNodeData } from "./to-nodes.js";

/**
 * `ux/screens/S050-physical-composition/visual.md` § Anatomia nodo standard — 224px
 * min width, barra laterale 3px colore-tipo, chip icona 24×24 (colore-tipo 12%),
 * titolo troncato 14/600, sottotitolo 12px. Backbone is the one "wide, horizontal"
 * exception, left-aligned instead of the row layout the rest use. No connection
 * handles are rendered — `checkHandleCompatibility` (S042) always rejects here today
 * because no `HandleDescriptor` exists for any of these kinds yet (the same gap
 * `react-flow-events.ts`'s own doc comment already names); a canvas that let you
 * start a drag-to-connect gesture which can never succeed would be worse than one
 * that doesn't offer it.
 */
export function PhysicalNode({ data, selected }: NodeProps & { readonly data: PhysicalNodeData }) {
  const config = NODE_KIND_CONFIG[data.kind];
  const Icon = config.icon;
  const wide = data.kind === "backbone";

  return (
    <div
      className={`flex items-center gap-3 bg-surface p-3 shadow-e1 ${wide ? "min-w-56" : "w-56"}`}
      style={{
        borderRadius: "16px 2px 16px 2px",
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

export const PHYSICAL_NODE_TYPES = { physical: PhysicalNode, "configured-port": ConfiguredPortNode };
