import type { DomainError, GraphEdge, GraphNode } from "@spaghettilab/domain";
import { isRuleNodeData, validateDeviceProcessingGraph, type DeviceProcessingNodeData } from "@spaghettilab/device-processing-graph-model";
import { catalogEntriesForNodeKind, findCatalogEntriesByTypeId } from "@spaghettilab/processing-block-catalog";
import { Plus, Trash2 } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useMemo, useState } from "react";
import { motionTokens } from "../../lib/motion-tokens.js";
import { PROCESSING_NODE_KIND_CONFIG } from "./node-kinds.js";

function uniqueTypeOptions(kind: "block" | "rule"): readonly { readonly typeId: string; readonly label: string; readonly planned: boolean }[] {
  const seen = new Set<string>();
  const options: { typeId: string; label: string; planned: boolean }[] = [];
  const ranked = [...catalogEntriesForNodeKind(kind)].sort((a, b) => Number(scoreNative(b)) - Number(scoreNative(a)));
  for (const entry of ranked) {
    if (!entry.typeId || seen.has(entry.typeId)) continue;
    seen.add(entry.typeId);
    options.push({ typeId: entry.typeId, label: entry.label, planned: entry.availability === "planned" });
  }
  return options;
}

function scoreNative(entry: { readonly id: string }): boolean {
  return entry.id.startsWith("block.") || entry.id.startsWith("rule.") || entry.id.startsWith("native.");
}

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
  existingEdges,
  nodeLabel,
  knownModuleNodeIds,
  onSave,
  onDelete,
  onClose,
}: {
  readonly mode: ProcessingInspectorMode;
  readonly moduleOptions: readonly { readonly id: string; readonly label: string }[];
  readonly existingNodes: readonly GraphNode<"device-processing", string, DeviceProcessingNodeData>[];
  readonly existingEdges: readonly GraphEdge<"device-processing", string, string>[];
  readonly nodeLabel: (nodeId: string) => string;
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

  const incoming = existingEdges.filter((e) => e.target === nodeId);
  const outgoing = existingEdges.filter((e) => e.source === nodeId);

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

        {mode.kind === "edit" && (
          <EdgeList title="Input" edges={incoming.map((e) => ({ id: e.id, label: nodeLabel(e.source) }))} empty="Nessun collegamento in ingresso." />
        )}

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
              Block
            </label>
            <TypeIdSelect
              id="ni-blocktype"
              kind="block"
              value={data.blockTypeId}
              onChange={(blockTypeId) => patch({ blockTypeId })}
            />
            <CatalogNotes typeId={data.blockTypeId} />
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
            <p className="mb-2 font-body text-xs text-ink-faint">GET_CATALOG non espone ancora lo schema proprietà del Block, quindi qui sotto sono per field_id numerico (`struct spaghetti_block_config`), non per nome — consulta la documentazione del tipo scelto per sapere quali usare.</p>
            <PropertiesEditor properties={data.properties} onChange={(properties) => patch({ properties })} />
          </>
        )}

        {data.kind === "rule" && (
          <>
            <label className="mb-1 block font-body text-xs font-semibold text-ink-muted" htmlFor="ni-ruletype">
              Rule
            </label>
            <TypeIdSelect id="ni-ruletype" kind="rule" value={data.ruleTypeId} onChange={(ruleTypeId) => patch({ ruleTypeId })} />
            <CatalogNotes typeId={data.ruleTypeId} />

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

            <p className="mb-2 font-body text-xs text-ink-faint">Proprietà per field_id numerico, stessa limitazione del Block: nessuno schema per nome esiste ancora.</p>
            <PropertiesEditor properties={data.properties} onChange={(properties) => patch({ properties })} />
          </>
        )}

        {mode.kind === "edit" && (
          <EdgeList title="Output" edges={outgoing.map((e) => ({ id: e.id, label: nodeLabel(e.target) }))} empty={isRuleNodeData(data) ? "Le Rule non hanno un edge di uscita: l'azione è il Comando qui sopra." : "Nessun collegamento in uscita."} />
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

function TypeIdSelect({
  id,
  kind,
  value,
  onChange,
}: {
  readonly id: string;
  readonly kind: "block" | "rule";
  readonly value: string;
  readonly onChange: (typeId: string) => void;
}) {
  const options = uniqueTypeOptions(kind);
  const known = options.some((o) => o.typeId === value);
  return (
    <select id={id} value={value} onChange={(e) => onChange(e.target.value)} className="mb-2 w-full rounded-slsm border border-border-strong px-2 py-1.5 font-mono text-sm outline-none">
      <option value="">—</option>
      {!known && value !== "" && <option value={value}>{value} (non in catalogo)</option>}
      {options.map((o) => (
        <option key={o.typeId} value={o.typeId}>
          {o.label} ({o.typeId}){o.planned ? " · pianificato" : ""}
        </option>
      ))}
    </select>
  );
}

function CatalogNotes({ typeId }: { readonly typeId: string }) {
  const entry = findCatalogEntriesByTypeId(typeId)[0];
  if (!entry) return null;
  return (
    <p className="mb-4 font-body text-xs text-ink-faint">
      {entry.availability === "planned" ? "Il Core V1 non ha ancora questo driver: il grafo si salva, il deploy fallirà finché il Block Driver non è nell'immagine. " : ""}
      {entry.notes}
    </p>
  );
}

/** Real edges already on the graph (Input) or reachable from this node (Output) — never invented, just read from `existingEdges` and labelled via the same resolver the canvas nodes use. */
function EdgeList({ title, edges, empty }: { readonly title: string; readonly edges: readonly { readonly id: string; readonly label: string }[]; readonly empty: string }) {
  return (
    <div className="mb-4">
      <p className="mb-1 font-body text-xs font-semibold text-ink-muted">{title}</p>
      {edges.length === 0 ? (
        <p className="rounded-slsm bg-surface-raised px-2 py-1.5 font-body text-xs text-ink-faint">{empty}</p>
      ) : (
        <ul className="flex flex-col gap-1">
          {edges.map((e) => (
            <li key={e.id} className="truncate rounded-slsm bg-surface-raised px-2 py-1.5 font-body text-xs text-ink">
              {e.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

type PropertyValueKind = "bigint" | "boolean" | "string";

function valueKindOf(value: unknown): PropertyValueKind {
  if (typeof value === "boolean") return "boolean";
  if (typeof value === "bigint") return "bigint";
  return "string";
}

function defaultForKind(kind: PropertyValueKind): boolean | bigint | string {
  if (kind === "boolean") return false;
  if (kind === "bigint") return 0n;
  return "";
}

/**
 * Edits `Record<string, unknown>` directly as firmware's wire format
 * requires it (`config-compiler`'s `toPropertySet`, `properties.ts`): keys
 * are the real numeric `field_id` (1-65535) as a string, values are
 * `bigint | boolean | string` — plain JS numbers are rejected on purpose
 * (firmware's CBOR encoder has no float support). No name/meaning is shown
 * per field because no schema exists anywhere to resolve one from — this is
 * the raw mechanism, not a guess at what any given field_id means.
 */
function PropertiesEditor({ properties, onChange }: { readonly properties: Readonly<Record<string, unknown>>; readonly onChange: (next: Record<string, unknown>) => void }) {
  const rows = Object.entries(properties);

  function updateRow(oldKey: string, newKey: string, value: boolean | bigint | string) {
    const next: Record<string, unknown> = {};
    for (const [k, v] of rows) next[k === oldKey ? newKey : k] = k === oldKey ? value : v;
    onChange(next);
  }

  function removeRow(key: string) {
    const next = { ...properties };
    delete next[key];
    onChange(next);
  }

  function addRow() {
    let n = 1;
    while (Object.prototype.hasOwnProperty.call(properties, String(n))) n++;
    onChange({ ...properties, [String(n)]: 0n });
  }

  return (
    <div className="mb-4">
      <p className="mb-1 font-body text-xs font-semibold text-ink-muted">Proprietà (field_id → valore)</p>
      <div className="flex flex-col gap-1.5">
        {rows.map(([key, value]) => {
          const kind = valueKindOf(value);
          return (
            <div key={key} className="flex items-center gap-1.5">
              <input
                type="number"
                value={key}
                onChange={(e) => updateRow(key, e.target.value, value as boolean | bigint | string)}
                className="w-16 rounded-slsm border border-border-strong px-1.5 py-1 font-mono text-xs outline-none"
                title="field_id"
              />
              <select
                value={kind}
                onChange={(e) => updateRow(key, key, defaultForKind(e.target.value as PropertyValueKind))}
                className="rounded-slsm border border-border-strong px-1 py-1 font-mono text-xs outline-none"
              >
                <option value="bigint">intero</option>
                <option value="boolean">bool</option>
                <option value="string">stringa</option>
              </select>
              {kind === "boolean" ? (
                <input type="checkbox" checked={value as boolean} onChange={(e) => updateRow(key, key, e.target.checked)} className="mx-1" />
              ) : kind === "bigint" ? (
                <input
                  type="number"
                  value={String(value)}
                  onChange={(e) => updateRow(key, key, e.target.value === "" || e.target.value === "-" ? 0n : BigInt(Math.trunc(Number(e.target.value))))}
                  className="min-w-0 flex-1 rounded-slsm border border-border-strong px-1.5 py-1 font-mono text-xs outline-none"
                />
              ) : (
                <input type="text" value={value as string} onChange={(e) => updateRow(key, key, e.target.value)} className="min-w-0 flex-1 rounded-slsm border border-border-strong px-1.5 py-1 font-mono text-xs outline-none" />
              )}
              <button type="button" onClick={() => removeRow(key)} className="shrink-0 text-ink-faint hover:text-error" aria-label="Rimuovi">
                <Trash2 size={13} />
              </button>
            </div>
          );
        })}
      </div>
      <button type="button" onClick={addRow} className="mt-1.5 flex items-center gap-1 font-body text-xs font-semibold text-brand-blue hover:underline">
        <Plus size={12} /> Aggiungi proprietà
      </button>
    </div>
  );
}
