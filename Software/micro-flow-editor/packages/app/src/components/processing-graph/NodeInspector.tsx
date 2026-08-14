import type { DomainError, GraphNode } from "@spaghettilab/domain";
import { validateDeviceProcessingGraph, type DeviceProcessingNodeData } from "@spaghettilab/device-processing-graph-model";
import { AnimatePresence, motion } from "motion/react";
import { useMemo, useState } from "react";
import { motionTokens } from "../../lib/motion-tokens.js";
import { PROCESSING_NODE_KIND_CONFIG } from "./node-kinds.js";

export type ProcessingInspectorMode = { readonly kind: "create"; readonly nodeKind: DeviceProcessingNodeData["kind"] } | { readonly kind: "edit"; readonly nodeId: string; readonly data: DeviceProcessingNodeData; readonly comment: string };

function defaultDataFor(kind: DeviceProcessingNodeData["kind"], firstModuleId: string | undefined): DeviceProcessingNodeData {
  switch (kind) {
    case "schedule":
      return { kind: "schedule", moduleNodeId: firstModuleId ?? "", periodMs: 1000, enabled: true };
    case "event-source":
      return { kind: "event-source", moduleNodeId: firstModuleId ?? "" };
    case "block":
      return { kind: "block", blockTypeId: "", properties: {} };
    case "rule":
      return { kind: "rule", ruleTypeId: "", properties: {} };
  }
}

export function NodeInspector({
  mode,
  moduleOptions,
  existingNodes,
  knownModuleNodeIds,
  onSave,
  onDelete,
  onClose,
}: {
  readonly mode: ProcessingInspectorMode;
  readonly moduleOptions: readonly { readonly id: string; readonly label: string }[];
  readonly existingNodes: readonly GraphNode<"device-processing", string, DeviceProcessingNodeData>[];
  readonly knownModuleNodeIds: ReadonlySet<string>;
  readonly onSave: (data: DeviceProcessingNodeData, comment: string) => void;
  readonly onDelete?: () => void;
  readonly onClose: () => void;
}) {
  const [comment, setComment] = useState(mode.kind === "edit" ? mode.comment : "");
  const [data, setData] = useState<DeviceProcessingNodeData>(mode.kind === "edit" ? mode.data : defaultDataFor(mode.nodeKind, moduleOptions[0]?.id));
  const nodeId = mode.kind === "edit" ? mode.nodeId : "__draft__";
  const config = PROCESSING_NODE_KIND_CONFIG[data.kind];

  const errors = useMemo<readonly DomainError[]>(() => {
    const others = existingNodes.filter((n) => n.id !== nodeId);
    const candidate: GraphNode<"device-processing", string, DeviceProcessingNodeData> = { layer: "device-processing", id: nodeId, data };
    const graphState = { layer: "device-processing" as const, nodes: [...others, candidate], edges: [] };
    const result = validateDeviceProcessingGraph(graphState, { knownModuleNodeIds });
    return result.ok ? [] : result.error.filter((e) => e.target === nodeId || e.path.includes(nodeId));
  }, [data, existingNodes, nodeId, knownModuleNodeIds]);

  const canSave = errors.length === 0;

  function patch(partial: Partial<DeviceProcessingNodeData>) {
    setData({ ...data, ...partial } as DeviceProcessingNodeData);
  }

  return (
    <motion.div initial={{ x: 320, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 320, opacity: 0 }} transition={motionTokens.spring.smooth} className="flex h-full w-80 flex-col border-l border-border bg-surface shadow-e2">
      <div className="flex h-14 shrink-0 items-center gap-2 border-b border-border px-4">
        <div className="flex h-6 w-6 items-center justify-center rounded-slsm" style={{ backgroundColor: `color-mix(in srgb, ${config.colorVar} 12%, transparent)` }}>
          <config.icon size={14} style={{ color: config.colorVar }} />
        </div>
        <h2 className="font-heading text-sm font-semibold text-ink">{config.label}</h2>
        <button type="button" onClick={onClose} className="ml-auto text-ink-faint hover:text-ink">
          ✕
        </button>
      </div>

      <div className="flex-1 overflow-auto p-4">
        <AnimatePresence>
          {errors.length > 0 && (
            <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={motionTokens.duration.base} className="mb-3 border-l-4 border-error bg-[color-mix(in_srgb,var(--color-error)_8%,transparent)] p-2 font-body text-xs text-ink">
              {errors[0]!.remediation}
            </motion.div>
          )}
        </AnimatePresence>

        <label className="mb-1 block font-body text-xs font-semibold text-ink-muted" htmlFor="ni-name">
          Nome (etichetta)
        </label>
        <input id="ni-name" value={comment} onChange={(e) => setComment(e.target.value)} placeholder={config.label} className="mb-4 w-full rounded-slsm border border-border-strong px-2 py-1.5 font-body text-sm outline-none" />

        {(data.kind === "schedule" || data.kind === "event-source") && (
          <>
            <label className="mb-1 block font-body text-xs font-semibold text-ink-muted" htmlFor="ni-module">
              Module
            </label>
            <select id="ni-module" value={data.moduleNodeId} onChange={(e) => patch({ moduleNodeId: e.target.value })} className="mb-4 w-full rounded-slsm border border-border-strong px-2 py-1.5 font-mono text-sm outline-none">
              <option value="">—</option>
              {moduleOptions.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
            </select>
          </>
        )}

        {data.kind === "schedule" && (
          <>
            <label className="mb-1 block font-body text-xs font-semibold text-ink-muted" htmlFor="ni-period">
              Periodo (ms)
            </label>
            <input id="ni-period" type="number" value={data.periodMs} onChange={(e) => patch({ periodMs: Number(e.target.value) })} className="mb-4 w-full rounded-slsm border border-border-strong px-2 py-1.5 font-mono text-sm outline-none" />
            <label className="mb-4 flex items-center gap-2 font-body text-sm text-ink">
              <input type="checkbox" checked={data.enabled} onChange={(e) => patch({ enabled: e.target.checked })} />
              Abilitato
            </label>
          </>
        )}

        {data.kind === "block" && (
          <>
            <label className="mb-1 block font-body text-xs font-semibold text-ink-muted" htmlFor="ni-blocktype">
              Block type (catalogo non ancora esposto — testo libero)
            </label>
            <input id="ni-blocktype" value={data.blockTypeId} onChange={(e) => patch({ blockTypeId: e.target.value })} className="mb-4 w-full rounded-slsm border border-border-strong px-2 py-1.5 font-mono text-sm outline-none" />
            <div className="mb-4 flex gap-2">
              <div className="flex-1">
                <label className="mb-1 block font-body text-xs font-semibold text-ink-muted" htmlFor="ni-minver">
                  Versione minima
                </label>
                <input id="ni-minver" type="number" value={data.minVersion ?? ""} onChange={(e) => patch({ minVersion: e.target.value === "" ? undefined : Number(e.target.value) })} className="w-full rounded-slsm border border-border-strong px-2 py-1.5 font-mono text-sm outline-none" />
              </div>
              <div className="flex-1">
                <label className="mb-1 block font-body text-xs font-semibold text-ink-muted" htmlFor="ni-exactver">
                  Versione esatta
                </label>
                <input id="ni-exactver" type="number" value={data.exactVersion ?? ""} onChange={(e) => patch({ exactVersion: e.target.value === "" ? undefined : Number(e.target.value) })} className="w-full rounded-slsm border border-border-strong px-2 py-1.5 font-mono text-sm outline-none" />
              </div>
            </div>
            <p className="mb-4 font-body text-xs text-ink-faint">Nessuno schema di proprietà esposto dal protocollo per questo tipo — non ci sono ancora campi aggiuntivi da compilare.</p>
          </>
        )}

        {data.kind === "rule" && (
          <>
            <label className="mb-1 block font-body text-xs font-semibold text-ink-muted" htmlFor="ni-ruletype">
              Rule type (catalogo non ancora esposto — testo libero)
            </label>
            <input id="ni-ruletype" value={data.ruleTypeId} onChange={(e) => patch({ ruleTypeId: e.target.value })} className="mb-4 w-full rounded-slsm border border-border-strong px-2 py-1.5 font-mono text-sm outline-none" />

            <p className="mb-1 font-body text-xs font-semibold text-ink-muted">Sorgente (quale Module/campo legge)</p>
            <div className="mb-4 flex gap-2">
              <select value={data.sourceReference?.moduleNodeId ?? ""} onChange={(e) => patch({ sourceReference: e.target.value ? { moduleNodeId: e.target.value, fieldId: data.sourceReference?.fieldId ?? 0 } : undefined })} className="flex-1 rounded-slsm border border-border-strong px-2 py-1.5 font-mono text-sm outline-none">
                <option value="">—</option>
                {moduleOptions.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label}
                  </option>
                ))}
              </select>
              <input type="number" placeholder="fieldId" value={data.sourceReference?.fieldId ?? ""} disabled={!data.sourceReference} onChange={(e) => patch({ sourceReference: data.sourceReference ? { ...data.sourceReference, fieldId: Number(e.target.value) } : undefined })} className="w-24 rounded-slsm border border-border-strong px-2 py-1.5 font-mono text-sm outline-none disabled:opacity-50" />
            </div>

            <p className="mb-1 font-body text-xs font-semibold text-ink-muted">Comando (quale Module/comando aziona)</p>
            <div className="mb-4 flex gap-2">
              <select value={data.commandTarget?.moduleNodeId ?? ""} onChange={(e) => patch({ commandTarget: e.target.value ? { moduleNodeId: e.target.value, commandId: data.commandTarget?.commandId ?? 0 } : undefined })} className="flex-1 rounded-slsm border border-border-strong px-2 py-1.5 font-mono text-sm outline-none">
                <option value="">—</option>
                {moduleOptions.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label}
                  </option>
                ))}
              </select>
              <input type="number" placeholder="commandId" value={data.commandTarget?.commandId ?? ""} disabled={!data.commandTarget} onChange={(e) => patch({ commandTarget: data.commandTarget ? { ...data.commandTarget, commandId: Number(e.target.value) } : undefined })} className="w-24 rounded-slsm border border-border-strong px-2 py-1.5 font-mono text-sm outline-none disabled:opacity-50" />
            </div>
          </>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-2 border-t border-border p-3">
        {onDelete && (
          <button type="button" onClick={onDelete} className="rounded-slsm border border-border-strong px-3 py-1.5 font-body text-sm text-error hover:bg-surface-raised">
            Elimina
          </button>
        )}
        <button type="button" onClick={() => onSave(data, comment)} disabled={!canSave} className="ml-auto rounded-slsm bg-brand-blue px-4 py-1.5 font-body-strong text-sm text-white hover:bg-brand-blue-dark disabled:opacity-50">
          Salva
        </button>
      </div>
    </motion.div>
  );
}
