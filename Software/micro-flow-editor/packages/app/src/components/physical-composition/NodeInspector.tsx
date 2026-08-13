import type { CatalogIndex, ProfileIndex, TopologyIndex } from "@spaghettilab/catalog-model";
import type { DomainError, GraphNode } from "@spaghettilab/domain";
import { PowerAdmission, RailAssurance, requiresPowerAcknowledgement, validateComposition, type ElectricalMode, type PhysicalCompositionNodeData } from "@spaghettilab/physical-composition-model";
import { AnimatePresence, motion } from "motion/react";
import { useMemo, useState } from "react";
import { motionTokens } from "../../lib/motion-tokens.js";
import { NODE_KIND_CONFIG } from "./node-kinds.js";

export type InspectorMode = { readonly kind: "create"; readonly nodeKind: PhysicalCompositionNodeData["kind"] } | { readonly kind: "edit"; readonly nodeId: string; readonly data: PhysicalCompositionNodeData; readonly comment: string };

const ELECTRICAL_MODES: readonly ElectricalMode[] = ["input-only", "output-only", "input-output"];

function newModule(): PhysicalCompositionNodeData {
  return { kind: "module", driverTypeId: "", portId: -1, bayId: -1, railId: -1, electricalMode: "input-output", properties: {} };
}

function defaultDataFor(kind: PhysicalCompositionNodeData["kind"]): PhysicalCompositionNodeData {
  switch (kind) {
    case "backbone":
      return { kind: "backbone", variant: "" };
    case "power-source":
      return { kind: "power-source", passive: false };
    case "connector":
      return { kind: "connector" };
    case "external-device":
      return { kind: "external-device" };
    case "module":
      return newModule();
  }
}

export function NodeInspector({
  mode,
  topology,
  catalog,
  profiles,
  existingNodes,
  acknowledgedModuleNodeIds,
  onSave,
  onDelete,
  onAcknowledge,
  onClose,
}: {
  readonly mode: InspectorMode;
  readonly topology: TopologyIndex | null;
  readonly catalog: CatalogIndex | null;
  readonly profiles: ProfileIndex | null;
  readonly existingNodes: readonly GraphNode<"physical-composition", string, PhysicalCompositionNodeData>[];
  readonly acknowledgedModuleNodeIds: ReadonlySet<string>;
  readonly onSave: (data: PhysicalCompositionNodeData, comment: string) => void;
  readonly onDelete?: () => void;
  readonly onAcknowledge: () => void;
  readonly onClose: () => void;
}) {
  const [comment, setComment] = useState(mode.kind === "edit" ? mode.comment : "");
  const [data, setData] = useState<PhysicalCompositionNodeData>(mode.kind === "edit" ? mode.data : defaultDataFor(mode.nodeKind));
  const nodeId = mode.kind === "edit" ? mode.nodeId : "__draft__";
  const config = NODE_KIND_CONFIG[data.kind];

  const errors = useMemo<readonly DomainError[]>(() => {
    if (data.kind !== "module" || !topology) return [];
    const others = existingNodes.filter((n) => n.id !== nodeId);
    const candidate: GraphNode<"physical-composition", string, PhysicalCompositionNodeData> = { layer: "physical-composition", id: nodeId, data };
    const result = validateComposition([...others, candidate], topology, { acknowledgedModuleNodeIds });
    return result.ok ? [] : result.error.filter((e) => e.target === nodeId);
  }, [data, topology, existingNodes, nodeId, acknowledgedModuleNodeIds]);

  const collisionErrors = errors.filter((e) => e.code === "physical-composition.endpoint_collision" || e.code === "physical-composition.module_key_conflict");
  const canSave = data.kind !== "module" || errors.length === 0;

  const selectedFlow = data.kind === "module" ? topology?.flows.find((f) => f.portId === data.portId) : undefined;
  const selectedBay = selectedFlow?.bays.find((b) => b.bayId === (data as { bayId?: number }).bayId);

  function patchModule(patch: Partial<Extract<PhysicalCompositionNodeData, { kind: "module" }>>) {
    if (data.kind !== "module") return;
    setData({ ...data, ...patch });
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
          {collisionErrors.length > 0 && (
            <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={motionTokens.duration.base} className="mb-3 border-l-4 border-error bg-[color-mix(in_srgb,var(--color-error)_8%,transparent)] p-2 font-body text-xs text-ink">
              {collisionErrors[0]!.remediation}
            </motion.div>
          )}
        </AnimatePresence>

        <label className="mb-1 block font-body text-xs font-semibold text-ink-muted" htmlFor="ni-name">
          Nome (etichetta)
        </label>
        <input id="ni-name" value={comment} onChange={(e) => setComment(e.target.value)} placeholder={config.label} className="mb-4 w-full rounded-slsm border border-border-strong px-2 py-1.5 font-body text-sm outline-none" />

        {data.kind === "backbone" && (
          <>
            <label className="mb-1 block font-body text-xs font-semibold text-ink-muted" htmlFor="ni-variant">
              Variante
            </label>
            <input id="ni-variant" value={data.variant} onChange={(e) => setData({ ...data, variant: e.target.value })} placeholder="DIN, compatta, ..." className="mb-4 w-full rounded-slsm border border-border-strong px-2 py-1.5 font-mono text-sm outline-none" />
          </>
        )}

        {data.kind === "power-source" && (
          <label className="mb-4 flex items-center gap-2 font-body text-sm text-ink">
            <input type="checkbox" checked={data.passive} onChange={(e) => setData({ ...data, passive: e.target.checked })} />
            Passivo (non gestito dal firmware)
          </label>
        )}

        {data.kind === "connector" && (
          <>
            <label className="mb-1 block font-body text-xs font-semibold text-ink-muted" htmlFor="ni-pinout">
              Pinout
            </label>
            <input id="ni-pinout" value={data.pinout ?? ""} onChange={(e) => setData({ ...data, pinout: e.target.value || undefined })} className="mb-4 w-full rounded-slsm border border-border-strong px-2 py-1.5 font-mono text-sm outline-none" />
          </>
        )}

        {data.kind === "external-device" && (
          <>
            <label className="mb-1 block font-body text-xs font-semibold text-ink-muted" htmlFor="ni-desc">
              Descrizione
            </label>
            <input id="ni-desc" value={data.description ?? ""} onChange={(e) => setData({ ...data, description: e.target.value || undefined })} className="mb-4 w-full rounded-slsm border border-border-strong px-2 py-1.5 font-body text-sm outline-none" />
          </>
        )}

        {data.kind === "module" && (
          <>
            <label className="mb-1 block font-body text-xs font-semibold text-ink-muted" htmlFor="ni-driver">
              Driver
            </label>
            {catalog && catalog.moduleDrivers.length > 0 ? (
              <select id="ni-driver" value={data.driverTypeId} onChange={(e) => patchModule({ driverTypeId: e.target.value })} className="mb-4 w-full rounded-slsm border border-border-strong px-2 py-1.5 font-mono text-sm outline-none">
                <option value="">—</option>
                {catalog.moduleDrivers.map((d) => (
                  <option key={d.typeId} value={d.typeId}>
                    {d.typeId}
                  </option>
                ))}
              </select>
            ) : (
              <input id="ni-driver" value={data.driverTypeId} onChange={(e) => patchModule({ driverTypeId: e.target.value })} placeholder="typeId (catalogo non disponibile)" className="mb-4 w-full rounded-slsm border border-border-strong px-2 py-1.5 font-mono text-sm outline-none" />
            )}

            {profiles && profiles.profiles.length > 0 && (
              <>
                <label className="mb-1 block font-body text-xs font-semibold text-ink-muted" htmlFor="ni-profile">
                  Profile (opzionale)
                </label>
                <select id="ni-profile" value={data.profileId ?? ""} onChange={(e) => patchModule({ profileId: e.target.value || undefined })} className="mb-4 w-full rounded-slsm border border-border-strong px-2 py-1.5 font-mono text-sm outline-none">
                  <option value="">—</option>
                  {profiles.profiles.map((p) => (
                    <option key={`${p.profileId}@${p.version}`} value={p.profileId}>
                      {p.profileId} v{p.version}
                    </option>
                  ))}
                </select>
              </>
            )}

            <label className="mb-1 block font-body text-xs font-semibold text-ink-muted" htmlFor="ni-port">
              Port
            </label>
            <select id="ni-port" value={data.portId} onChange={(e) => patchModule({ portId: Number(e.target.value), bayId: -1, railId: -1 })} className="mb-4 w-full rounded-slsm border border-border-strong px-2 py-1.5 font-mono text-sm outline-none">
              <option value={-1}>—</option>
              {(topology?.flows ?? []).map((f) => (
                <option key={f.flowId} value={f.portId}>
                  Port {f.portId} (Flow {f.flowId})
                </option>
              ))}
            </select>

            <label className="mb-1 block font-body text-xs font-semibold text-ink-muted" htmlFor="ni-bay">
              Bay
            </label>
            <select id="ni-bay" value={data.bayId} onChange={(e) => patchModule({ bayId: Number(e.target.value), railId: -1 })} disabled={!selectedFlow} className="mb-4 w-full rounded-slsm border border-border-strong px-2 py-1.5 font-mono text-sm outline-none disabled:opacity-50">
              <option value={-1}>—</option>
              {(selectedFlow?.bays ?? []).map((b) => (
                <option key={b.bayId} value={b.bayId}>
                  Bay {b.ordinal}
                </option>
              ))}
            </select>

            <label className="mb-1 block font-body text-xs font-semibold text-ink-muted" htmlFor="ni-rail">
              Power rail
            </label>
            <select id="ni-rail" value={data.railId} onChange={(e) => patchModule({ railId: Number(e.target.value) })} disabled={!selectedBay} className="mb-4 w-full rounded-slsm border border-border-strong px-2 py-1.5 font-mono text-sm outline-none disabled:opacity-50">
              <option value={-1}>—</option>
              {(selectedBay?.rails ?? []).map((r) => (
                <option key={r.railId} value={r.railId}>
                  Rail {r.railId} ({r.assurance === RailAssurance.UNMANAGED ? "non gestita" : r.assurance === RailAssurance.SWITCHED ? "switched" : "switched+measured"})
                </option>
              ))}
            </select>

            <div className="mb-4 flex gap-2">
              <div className="flex-1">
                <label className="mb-1 block font-body text-xs font-semibold text-ink-muted" htmlFor="ni-addr">
                  Indirizzo (I2C)
                </label>
                <input id="ni-addr" type="number" value={data.endpoint?.address ?? ""} onChange={(e) => patchModule({ endpoint: { ...data.endpoint, address: e.target.value === "" ? undefined : Number(e.target.value), chipSelect: undefined } })} className="w-full rounded-slsm border border-border-strong px-2 py-1.5 font-mono text-sm outline-none" style={{ borderColor: collisionErrors.length > 0 ? "var(--color-error)" : undefined }} />
              </div>
              <div className="flex-1">
                <label className="mb-1 block font-body text-xs font-semibold text-ink-muted" htmlFor="ni-cs">
                  Chip-select (SPI)
                </label>
                <input id="ni-cs" type="number" value={data.endpoint?.chipSelect ?? ""} onChange={(e) => patchModule({ endpoint: { ...data.endpoint, chipSelect: e.target.value === "" ? undefined : Number(e.target.value), address: undefined } })} className="w-full rounded-slsm border border-border-strong px-2 py-1.5 font-mono text-sm outline-none" />
              </div>
            </div>

            <label className="mb-1 block font-body text-xs font-semibold text-ink-muted" htmlFor="ni-mode">
              Modalità elettrica
            </label>
            <select id="ni-mode" value={data.electricalMode} onChange={(e) => patchModule({ electricalMode: e.target.value as ElectricalMode })} className="mb-4 w-full rounded-slsm border border-border-strong px-2 py-1.5 font-mono text-sm outline-none">
              {ELECTRICAL_MODES.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>

            {data.moduleKey !== undefined && <p className="mb-4 font-mono text-xs text-ink-faint">moduleKey: {data.moduleKey} (assegnato dal firmware)</p>}

            {selectedBay && selectedBay.rails.find((r) => r.railId === data.railId) && requiresPowerAcknowledgement(selectedBay.rails.find((r) => r.railId === data.railId)!.assurance) && (
              <label className="mb-4 flex items-start gap-2 rounded-slsm bg-surface-raised p-2 font-body text-xs text-ink">
                <input type="checkbox" checked={acknowledgedModuleNodeIds.has(nodeId)} onChange={onAcknowledge} className="mt-0.5" />
                Questa rail è passiva (non verificabile dal firmware) — confermo il posizionamento di questo Module qui.
              </label>
            )}

            {(selectedFlow?.bays.find((b) => b.bayId === data.bayId)?.admission ?? undefined) === PowerAdmission.UNVERIFIED && <p className="mb-4 font-body text-xs text-warning">Bay {data.bayId}: admission UNVERIFIED — non normalizzata come ENFORCED.</p>}
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
