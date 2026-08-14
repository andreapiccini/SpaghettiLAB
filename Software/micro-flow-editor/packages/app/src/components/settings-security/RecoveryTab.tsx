import {
  catalogIncompatibleRecoveryPlan,
  configCorruptOrAbsentRecoveryPlan,
  coreReplacedRecoveryPlan,
  deviceIdMismatchRecoveryPlan,
  nodeRedUnreachableRecoveryPlan,
  otaRollbackRecoveryPlan,
  type RecoveryPlan,
} from "@spaghettilab/security-recovery";
import { AlertTriangle, ChevronRight, LifeBuoy, X } from "lucide-react";
import { useState } from "react";

const SCENARIOS: { readonly label: string; readonly build: () => RecoveryPlan }[] = [
  { label: "Core sostituito", build: () => coreReplacedRecoveryPlan("Core", "—", "—") },
  { label: "Device ID mismatch", build: () => deviceIdMismatchRecoveryPlan("Core", "—", "—") },
  { label: "Config corrotto/assente", build: () => configCorruptOrAbsentRecoveryPlan() },
  { label: "Catalogo incompatibile", build: () => catalogIncompatibleRecoveryPlan() },
  { label: "OTA rollback", build: () => otaRollbackRecoveryPlan("—", "—") },
  { label: "Node-RED irraggiungibile", build: () => nodeRedUnreachableRecoveryPlan() },
];

/**
 * `ux/screens/S120-settings-security/visual.md` § Recovery — 6 card fisse,
 * cablate su `@spaghettilab/security-recovery`'s funzioni piano (S124,
 * reali). Gap dichiarato: le funzioni "core sostituito"/"device ID
 * mismatch"/"OTA rollback" accettano parametri (nome binding, device ID
 * atteso/osservato, versioni) che questa card generica non ha — mostrate con
 * placeholder `—`; un flusso reale le popolerebbe dal Core/candidato
 * effettivamente coinvolto (es. aperto da un banner di errore specifico in
 * Core Connections/Aggiornamento), non raggiungibile da qui in isolamento.
 * Ogni step è testo guida/navigazionale — nessuno step qui esegue
 * un'azione reale, per design del pacchetto stesso (funzioni pure, nessuna
 * chiamata wire).
 */
export function RecoveryTab() {
  const [open, setOpen] = useState<RecoveryPlan | null>(null);
  const [done, setDone] = useState<ReadonlySet<number>>(new Set());

  return (
    <div className="flex flex-col gap-4 p-6">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {SCENARIOS.map((s) => (
          <button
            key={s.label}
            type="button"
            onClick={() => {
              setDone(new Set());
              setOpen(s.build());
            }}
            className="flex items-center gap-3 rounded-slmd border border-border p-4 text-left hover:bg-surface-raised"
          >
            <LifeBuoy size={20} className="text-brand-purple-glow" />
            <span className="flex-1 font-body-strong text-sm text-ink">{s.label}</span>
            <ChevronRight size={16} className="text-ink-faint" />
          </button>
        ))}
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: "rgba(20, 23, 31, 0.4)" }}>
          <div className="w-[480px] max-h-[70vh] overflow-auto rounded-slmd bg-surface p-5 shadow-e3">
            <div className="flex items-center justify-between">
              <h3 className="font-heading text-base font-semibold text-ink">{open.scenario}</h3>
              <button type="button" onClick={() => setOpen(null)} className="flex h-8 w-8 items-center justify-center rounded-slsm text-ink-faint hover:bg-surface-raised">
                <X size={16} />
              </button>
            </div>
            <div className="mt-3 flex flex-col gap-2">
              {open.steps.map((step, i) => (
                <label key={i} className="flex items-start gap-2 rounded-slsm border border-border p-2">
                  <input type="checkbox" checked={done.has(i)} onChange={() => setDone((prev) => { const next = new Set(prev); if (next.has(i)) next.delete(i); else next.add(i); return next; })} className="mt-0.5" />
                  <span className="flex-1 font-body text-sm text-ink">{step.step}</span>
                  {step.destructive && (
                    <span className="flex shrink-0 items-center gap-1 rounded-slpill px-2 py-0.5 font-body text-xs text-error" style={{ backgroundColor: "color-mix(in srgb, var(--color-error) 12%, transparent)" }}>
                      <AlertTriangle size={10} />
                      distruttivo
                    </span>
                  )}
                </label>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
