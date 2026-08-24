import { describeAuditEntry, type AuditLogEntryView } from "@spaghettilab/core-status";
import { ConnectivityService, checkCredentialProvisioningAvailability, describeResetScope, FactoryResetScope, type DestructiveConfirmation, type LeaseOutcome, type MaintenanceOutcome, type ResetScopeOutcome } from "@spaghettilab/core-admin";
import type { CoreBindingId } from "@spaghettilab/domain";
import { AlertTriangle, Lock, RefreshCw, ShieldAlert, Unlock, Wifi } from "lucide-react";
import { useState, type ReactNode } from "react";
import { useCoreSessions } from "../../state/core-sessions-context.js";
import { PLACEHOLDER_GRANTED_ALL } from "./permission-placeholder.js";

type PendingConfirm = { readonly target: string; readonly onConfirm: () => void };

/**
 * `ux/screens/S090-runtime-diagnostics/visual.md` § Amministrazione, cablato
 * su `@spaghettilab/core-admin` (S094, reale) e l'audit log di
 * `@spaghettilab/core-status` (S093). Ogni operazione distruttiva (reset,
 * manutenzione di rete) passa da un dialog che richiede di ridigitare
 * esattamente il target mostrato (`checkDestructiveConfirmation`, via i
 * workflow `openNetworkMaintenance`/`requestFactoryReset` già gated in
 * `CoreSession`) — lease e provisioning credenziali non sono distruttivi e
 * non hanno questo dialog (S094 li documenta esplicitamente come tali).
 */
export function AdminTab({ bindingId, coreName }: { readonly bindingId: CoreBindingId; readonly coreName: string }) {
  const { acquireLease, releaseLease, openNetworkMaintenance, requestFactoryReset, getAuditLog } = useCoreSessions();
  const [leaseServices, setLeaseServices] = useState<number>(0);
  const [leaseDurationMs, setLeaseDurationMs] = useState(60_000);
  const [leaseResult, setLeaseResult] = useState<LeaseOutcome | null>(null);
  const [maintenanceResult, setMaintenanceResult] = useState<MaintenanceOutcome | null>(null);
  const [resetScope, setResetScope] = useState<number>(FactoryResetScope.CONFIG);
  const [resetResult, setResetResult] = useState<ResetScopeOutcome | null>(null);
  const [audit, setAudit] = useState<readonly AuditLogEntryView[] | null>(null);
  const [pendingConfirm, setPendingConfirm] = useState<PendingConfirm | null>(null);

  const credentialProvisioning = checkCredentialProvisioningAvailability(PLACEHOLDER_GRANTED_ALL);

  function toggleService(bit: number) {
    setLeaseServices((prev) => (prev & bit ? prev & ~bit : prev | bit));
  }

  function toggleScopeBit(bit: number) {
    setResetScope((prev) => (prev & bit ? prev & ~bit : prev | bit));
  }

  async function handleAcquireLease() {
    const r = await acquireLease(bindingId, leaseServices, leaseDurationMs, PLACEHOLDER_GRANTED_ALL);
    if (r) setLeaseResult(r);
  }
  async function handleReleaseLease() {
    const r = await releaseLease(bindingId, PLACEHOLDER_GRANTED_ALL);
    if (r) setLeaseResult(r);
  }

  function requestMaintenance() {
    setPendingConfirm({
      target: coreName,
      onConfirm: () => {
        const confirmation: DestructiveConfirmation = { target: coreName, confirmedTarget: coreName };
        void openNetworkMaintenance(bindingId, PLACEHOLDER_GRANTED_ALL, confirmation)?.then((r) => r && setMaintenanceResult(r));
      },
    });
  }

  function requestReset() {
    const target = describeResetScope(resetScope);
    setPendingConfirm({
      target,
      onConfirm: () => {
        const confirmation: DestructiveConfirmation = { target, confirmedTarget: target };
        void requestFactoryReset(bindingId, resetScope, PLACEHOLDER_GRANTED_ALL, confirmation)?.then((r) => r && setResetResult(r));
      },
    });
  }

  async function refreshAudit() {
    const entries = await getAuditLog(bindingId);
    if (entries) setAudit(entries.map(describeAuditEntry));
  }

  return (
    <div className="flex h-full flex-col gap-4 overflow-auto p-6">
      <div className="rounded-slmd border-l-4 border-brand-purple-glow p-3" style={{ backgroundColor: "color-mix(in srgb, var(--color-brand-purple-glow) 6%, transparent)" }}>
        <p className="font-body text-sm text-ink">Operazioni immediate sul Core — mai una scrittura di Config o progetto.</p>
        <p className="mt-0.5 font-body text-xs text-ink-muted">
          Gap onesto: nessun sistema di permessi reale esiste ancora in questa app (UI-S120) — tutti gli scope sono concessi come placeholder temporaneo, documentato in `permission-placeholder.ts`.
        </p>
      </div>

      <Section title="Connectivity lease" icon={Wifi}>
        <div className="flex flex-wrap items-center gap-3">
          {Object.entries(ConnectivityService).map(([name, bit]) => (
            <label key={name} className="flex items-center gap-1.5">
              <input type="checkbox" checked={(leaseServices & bit) !== 0} onChange={() => toggleService(bit)} />
              <span className="font-body text-xs text-ink-muted">{name}</span>
            </label>
          ))}
          <label className="flex items-center gap-1.5">
            <span className="font-body text-xs text-ink-muted">durata (ms)</span>
            <input type="number" value={leaseDurationMs} onChange={(e) => setLeaseDurationMs(Number(e.target.value))} className="w-28 rounded-slsm border border-border-strong px-2 py-1 font-mono text-xs outline-none" />
          </label>
          <button type="button" onClick={() => void handleAcquireLease()} className="flex items-center gap-1 rounded-slpill bg-brand-purple-glow px-3 py-1.5 font-body-strong text-xs text-white hover:opacity-90">
            <Lock size={12} />
            Acquisisci
          </button>
          <button type="button" onClick={() => void handleReleaseLease()} className="flex items-center gap-1 rounded-slpill border border-border-strong px-3 py-1.5 font-body-strong text-xs text-ink hover:bg-surface-raised">
            <Unlock size={12} />
            Rilascia
          </button>
          {leaseResult && <OutcomeLabel kind={leaseResult.kind} />}
        </div>
      </Section>

      <Section title="Manutenzione di rete" icon={RefreshCw}>
        <p className="font-body text-xs text-ink-muted">Ferma MQTT per l'intero workspace (e BLE su build minimal) — auto-reversibile ma disruttivo. Richiede conferma.</p>
        <div className="mt-2 flex items-center gap-3">
          <button type="button" onClick={requestMaintenance} className="rounded-slpill bg-brand-purple-glow px-3 py-1.5 font-body-strong text-xs text-white hover:opacity-90">
            Apri manutenzione di rete
          </button>
          {maintenanceResult && <OutcomeLabel kind={maintenanceResult.kind} />}
        </div>
      </Section>

      <Section title="Factory reset" icon={ShieldAlert} danger>
        <div className="flex flex-wrap items-center gap-3">
          {(["CONFIG", "NETWORK", "CREDENTIALS", "BLE_BONDS"] as const).map((name) => (
            <label key={name} className="flex items-center gap-1.5">
              <input type="checkbox" checked={(resetScope & FactoryResetScope[name]) !== 0} onChange={() => toggleScopeBit(FactoryResetScope[name])} />
              <span className="font-body text-xs text-ink-muted">{name}</span>
            </label>
          ))}
          <button type="button" onClick={() => setResetScope(FactoryResetScope.ALL)} className="font-body text-xs font-semibold text-brand-blue underline">
            Tutto
          </button>
          <span className="ml-auto font-mono text-xs text-ink-faint">{describeResetScope(resetScope)}</span>
          <button type="button" disabled={resetScope === 0} onClick={requestReset} className="rounded-slpill bg-error px-3 py-1.5 font-body-strong text-xs text-white hover:opacity-90 disabled:opacity-40">
            Richiedi reset
          </button>
          {resetResult && <OutcomeLabel kind={resetResult.kind} />}
        </div>
      </Section>

      <Section title="Provisioning credenziali" icon={Lock}>
        <p className="font-body text-xs text-ink-muted">
          {credentialProvisioning.kind === "PERMISSION_DENIED" ? "Permesso negato." : credentialProvisioning.remediation}
        </p>
      </Section>

      <div>
        <div className="flex items-center gap-2">
          <h2 className="font-heading text-sm font-semibold text-ink">Audit log</h2>
          <button type="button" onClick={() => void refreshAudit()} className="flex items-center gap-1 rounded-slsm border border-border-strong px-2 py-1 font-body text-xs text-ink hover:bg-surface-raised">
            <RefreshCw size={12} />
            Aggiorna
          </button>
        </div>
        {audit && audit.length > 0 ? (
          <div className="mt-2 flex flex-col gap-1">
            {audit.map((e) => (
              <div key={e.sequence} className="flex items-center gap-3 rounded-slsm border border-border p-2 font-mono text-xs">
                <span className="text-ink-muted">#{e.sequence}</span>
                <span className="text-ink">{e.operation}</span>
                <span className="text-ink-muted">principal {e.principalId}</span>
                <span className="ml-auto text-ink-faint">t+{e.uptimeMs}ms</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-2 font-body text-sm text-ink-faint">{audit ? "Nessuna voce." : "Non ancora richiesto."}</p>
        )}
      </div>

      {pendingConfirm && (
        <ConfirmDialog
          target={pendingConfirm.target}
          onCancel={() => setPendingConfirm(null)}
          onConfirm={() => {
            pendingConfirm.onConfirm();
            setPendingConfirm(null);
          }}
        />
      )}
    </div>
  );
}

function Section({ title, icon: Icon, danger, children }: { readonly title: string; readonly icon: typeof Wifi; readonly danger?: boolean; readonly children: ReactNode }) {
  return (
    <div className="rounded-slmd border p-3" style={{ borderColor: danger ? "var(--color-error)" : "var(--color-border)" }}>
      <h2 className="mb-2 flex items-center gap-1.5 font-heading text-sm font-semibold text-ink">
        <Icon size={14} />
        {title}
      </h2>
      {children}
    </div>
  );
}

function OutcomeLabel({ kind }: { readonly kind: string }) {
  const ok = kind === "SUCCESS";
  return (
    <span className="rounded-slpill px-2 py-0.5 font-body text-xs" style={{ backgroundColor: `color-mix(in srgb, var(${ok ? "--color-success" : "--color-error"}) 12%, transparent)`, color: `var(${ok ? "--color-success" : "--color-error"})` }}>
      {kind}
    </span>
  );
}

function ConfirmDialog({ target, onCancel, onConfirm }: { readonly target: string; readonly onCancel: () => void; readonly onConfirm: () => void }) {
  const [typed, setTyped] = useState("");
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: "rgba(20, 23, 31, 0.4)" }}>
      <div className="w-[420px] rounded-slmd bg-surface p-5 shadow-e3">
        <div className="flex items-center gap-2">
          <AlertTriangle size={18} className="text-error" />
          <h3 className="font-heading text-base font-semibold text-ink">Conferma operazione distruttiva</h3>
        </div>
        <p className="mt-2 font-body text-sm text-ink-muted">
          Ridigita esattamente <span className="font-mono font-semibold text-ink">{target}</span> per confermare.
        </p>
        <input value={typed} onChange={(e) => setTyped(e.target.value)} className="mt-3 w-full rounded-slsm border border-border-strong px-3 py-2 font-mono text-sm outline-none" placeholder={target} />
        <div className="mt-4 flex gap-2">
          <button type="button" onClick={onCancel} className="flex-1 rounded-slsm border border-border-strong px-3 py-2 font-body text-sm text-ink hover:bg-surface-raised">
            Annulla
          </button>
          <button type="button" disabled={typed !== target} onClick={onConfirm} className="flex-1 rounded-slsm bg-error px-3 py-2 font-body-strong text-sm text-white hover:opacity-90 disabled:opacity-40">
            Conferma
          </button>
        </div>
      </div>
    </div>
  );
}
