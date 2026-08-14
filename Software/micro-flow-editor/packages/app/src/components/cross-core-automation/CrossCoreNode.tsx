import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Radio, SendHorizontal, Workflow } from "lucide-react";
import type { CrossCoreRfNodeData } from "./to-nodes.js";

const KIND_ICON = { "record-field": Radio, command: SendHorizontal, nodered: Workflow } as const;
const KIND_BADGE = { "record-field": "record", command: "command", nodered: "Node-RED" } as const;

/** `ux/screens/S110-cross-core-automation/visual.md` § Anatomia nodo — barra laterale 3px + badge pillola colore Core in alto, icona/forma distingue il tipo (non il colore, a differenza di S070). */
export function CrossCoreNode({ data, selected }: NodeProps & { readonly data: CrossCoreRfNodeData }) {
  const { domainData, colorVar } = data;
  const Icon = KIND_ICON[domainData.kind];
  const subtitle =
    domainData.kind === "record-field"
      ? `${domainData.schemaId} · campo ${domainData.fieldId}${domainData.unit ? ` · ${domainData.unit}` : ""}`
      : domainData.kind === "command"
        ? `module ${domainData.moduleKey} · cmd ${domainData.commandId}`
        : "integrazione";

  return (
    <div className="w-56 rounded-slmd bg-surface p-3 shadow-e1" style={{ borderLeft: `3px solid ${colorVar}`, outline: selected ? "2px solid var(--color-brand-blue)" : "1px solid var(--color-border)" }}>
      {domainData.kind !== "record-field" && <Handle type="target" position={Position.Left} />}
      <span className="mb-1 inline-flex items-center gap-1 rounded-slpill px-2 py-0.5 font-body text-[10px]" style={{ backgroundColor: `color-mix(in srgb, ${colorVar} 12%, transparent)`, color: colorVar }}>
        {KIND_BADGE[domainData.kind]}
      </span>
      <div className="flex items-center gap-2">
        <Icon size={14} style={{ color: colorVar }} />
        <div className="min-w-0 flex-1">
          <div className="truncate font-body text-sm font-semibold text-ink">{domainData.label}</div>
          <div className="truncate font-body text-xs text-ink-faint">{subtitle}</div>
        </div>
      </div>
      {domainData.kind !== "command" && <Handle type="source" position={Position.Right} />}
    </div>
  );
}

export const CROSS_CORE_NODE_TYPES = { crossCore: CrossCoreNode };
