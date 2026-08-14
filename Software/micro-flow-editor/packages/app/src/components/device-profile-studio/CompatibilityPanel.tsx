import type { DeviceProfileBudget } from "@spaghettilab/device-profile-authoring-model";
import type { InstallResolutionResult } from "@spaghettilab/device-profile-package";
import type { CoreBindingRecord } from "@spaghettilab/domain";
import { CircleCheck, CircleX, DownloadCloud, GitCompareArrows, Gauge, TriangleAlert, type LucideIcon } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { motionTokens } from "../../lib/motion-tokens.js";
import { CoreSelector } from "../catalog-topology/CoreSelector.js";

const OUTCOME_CONFIG: Record<InstallResolutionResult["kind"], { readonly colorVar: string; readonly icon: LucideIcon; readonly title: string; readonly action?: string }> = {
  READY: { colorVar: "var(--color-success)", icon: CircleCheck, title: "Pronto", action: "Instanzia come Module" },
  PROFILE_INSTALL_REQUIRED: { colorVar: "var(--color-info)", icon: DownloadCloud, title: "Serve installare il profilo", action: "Installa profilo" },
  FIRMWARE_UPDATE_REQUIRED: { colorVar: "var(--color-warning)", icon: TriangleAlert, title: "Manca supporto firmware", action: "Vedi opcode mancanti" },
  HARDWARE_INCOMPATIBLE: { colorVar: "var(--color-error)", icon: CircleX, title: "Bay non compatibile" },
  RESOURCE_INCOMPATIBLE: { colorVar: "var(--color-error)", icon: Gauge, title: "Budget locale superato", action: "Vedi dettaglio budget" },
  VERSION_CONFLICT: { colorVar: "var(--color-error)", icon: GitCompareArrows, title: "Versione non corrispondente" },
};

/** `ux/screens/S060-device-profile-studio/visual.md` § Pannello "Compatibilità". */
export function CompatibilityPanel({
  bindings,
  selected,
  onSelect,
  resolution,
  budget,
  maxBudget,
  onInstall,
  onInstantiate,
  busy,
}: {
  readonly bindings: readonly CoreBindingRecord[];
  readonly selected: CoreBindingRecord | null;
  readonly onSelect: (b: CoreBindingRecord) => void;
  readonly resolution: InstallResolutionResult | null;
  readonly budget: DeviceProfileBudget;
  readonly maxBudget: { readonly maxTotalTimeMs: number; readonly maxTransactions: number; readonly maxBytes: number };
  readonly onInstall: () => void;
  readonly onInstantiate: () => void;
  readonly busy: boolean;
}) {
  const [budgetOpen, setBudgetOpen] = useState(false);
  const config = resolution ? OUTCOME_CONFIG[resolution.kind] : null;

  function handleAction() {
    if (!resolution) return;
    if (resolution.kind === "PROFILE_INSTALL_REQUIRED") onInstall();
    else if (resolution.kind === "READY") onInstantiate();
    else if (resolution.kind === "RESOURCE_INCOMPATIBLE") setBudgetOpen(true);
    else if (resolution.kind === "FIRMWARE_UPDATE_REQUIRED") setBudgetOpen(true);
  }

  const rows: readonly [string, number, number][] = [
    ["Tempo totale (ms)", budget.totalTimeMs, maxBudget.maxTotalTimeMs],
    ["Transazioni", budget.transactions, maxBudget.maxTransactions],
    ["Byte", budget.bytes, maxBudget.maxBytes],
    ["Operazioni", budget.operations, Number.POSITIVE_INFINITY],
  ];

  return (
    <div className="flex w-80 shrink-0 flex-col border-l border-border bg-surface">
      <div className="border-b border-border p-4">
        <h2 className="mb-2 font-heading text-sm font-semibold text-ink">Compatibilità con {selected?.expectedDeviceId ?? "—"}</h2>
        <CoreSelector bindings={bindings} selected={selected} onSelect={onSelect} />
      </div>

      <div className="flex-1 overflow-auto p-4">
        <AnimatePresence mode="wait">
          {resolution && config && (
            <motion.div key={resolution.kind} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={motionTokens.duration.base}>
              <div className="flex h-8 w-8 items-center justify-center rounded-slsm" style={{ backgroundColor: `color-mix(in srgb, ${config.colorVar} 12%, transparent)` }}>
                <config.icon size={18} style={{ color: config.colorVar }} />
              </div>
              <h3 className="mt-2 font-heading text-sm font-semibold text-ink">{config.title}</h3>
              {resolution.kind === "FIRMWARE_UPDATE_REQUIRED" && resolution.missingOpcodes && <p className="mt-1 font-mono text-xs text-ink-faint">opcode mancanti: {resolution.missingOpcodes.join(", ")}</p>}
              {config.action && (
                <button type="button" onClick={handleAction} disabled={busy} className="mt-3 rounded-slpill bg-brand-blue px-4 py-1.5 font-body-strong text-sm text-white hover:bg-brand-blue-dark disabled:opacity-50">
                  {busy ? "..." : config.action}
                </button>
              )}
            </motion.div>
          )}
          {!resolution && (
            <p className="font-body text-sm text-ink-faint">Seleziona un Core connesso per calcolare la compatibilità.</p>
          )}
        </AnimatePresence>

        <div className="mt-4 border-t border-border pt-3">
          <button type="button" onClick={() => setBudgetOpen((o) => !o)} className="font-body text-xs font-semibold text-ink-muted underline">
            {budgetOpen ? "Nascondi" : "Vedi"} dettaglio budget
          </button>
          <AnimatePresence initial={false}>
            {budgetOpen && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={motionTokens.duration.base} className="overflow-hidden">
                <table className="mt-2 w-full font-mono text-xs">
                  <tbody>
                    {rows.map(([label, value, limit]) => (
                      <tr key={label} className={value > limit ? "text-error" : "text-ink"}>
                        <td className="py-0.5 pr-2 text-ink-faint">{label}</td>
                        <td className="py-0.5 text-right">{value}</td>
                        <td className="py-0.5 pl-2 text-right text-ink-faint">/ {Number.isFinite(limit) ? limit : "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
