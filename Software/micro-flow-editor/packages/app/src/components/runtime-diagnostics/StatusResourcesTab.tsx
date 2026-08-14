import { describeConnectivityStatus, describeCoreStatus, describeResourceMonitor, type ConnectivityStatusView, type CoreStatusView, type ResourceMonitorView } from "@spaghettilab/core-status";
import type { CoreBindingId } from "@spaghettilab/domain";
import { RefreshCw } from "lucide-react";
import { useState } from "react";
import { useCoreSessions } from "../../state/core-sessions-context.js";

/**
 * `ux/screens/S090-runtime-diagnostics/visual.md` § Stato & Risorse, cablato
 * su `@spaghettilab/core-status` (S093, reale). Status/capabilities/resources
 * vengono da `CoreSession.lastKnownSnapshot` (già popolato al connect, S030)
 * — nessuna nuova chiamata wire per quelli. Connectivity status è invece
 * on-demand (`getConnectivityStatus()`), non parte dello snapshot di
 * connessione. Il chiamante monta questo componente con `key={bindingId}`,
 * così lo stato locale (connectivity già richiesta) riparte pulito ad ogni
 * cambio di Core selezionato.
 */
export function StatusResourcesTab({ bindingId }: { readonly bindingId: CoreBindingId }) {
  const { getSnapshot, getConnectivityStatus } = useCoreSessions();
  const [connectivity, setConnectivity] = useState<ConnectivityStatusView | null>(null);
  const [loading, setLoading] = useState(false);

  const snapshot = getSnapshot(bindingId);
  const status: CoreStatusView | null = snapshot?.status ? describeCoreStatus(snapshot.status) : null;
  const resources: ResourceMonitorView | null = snapshot?.resources && snapshot?.capabilities ? describeResourceMonitor(snapshot.resources, snapshot.capabilities) : null;

  async function refreshConnectivity() {
    setLoading(true);
    try {
      const r = await getConnectivityStatus(bindingId);
      if (r) setConnectivity(describeConnectivityStatus(r));
    } finally {
      setLoading(false);
    }
  }

  if (!status || !resources) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="font-body text-sm text-ink-faint">Nessuno snapshot disponibile per questo Core.</p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col gap-4 overflow-auto p-6">
      <div className="flex flex-wrap gap-2">
        <Chip label="Stato" value={status.state} />
        <Chip label="Modo" value={status.mode} />
        <Chip label="Immagine" value={status.imageState} />
        <Chip label="Slot attivo" value={String(status.activeSlot)} />
        <Chip label="Immagine confermata" value={status.imageConfirmed ? "sì" : "no"} />
        <Chip label="Versione" value={status.version} />
        <Chip label="Health" value={status.healthState} />
        <Chip label="Watchdog" value={status.watchdog} note={status.watchdog === "unknown" ? "inferenza da health state, non un campo diretto" : undefined} />
      </div>

      <div className="rounded-slmd border border-border p-3 font-mono text-xs text-ink-muted">
        last reset cause (raw bitmask, non decodificato): 0x{status.lastResetCauseRaw.toString(16)}
      </div>

      <div>
        <h2 className="font-heading text-sm font-semibold text-ink">Module ({status.modules.length})</h2>
        <div className="mt-2 flex flex-col gap-1.5">
          {status.modules.map((m) => (
            <div key={m.key} className="flex items-center gap-3 rounded-slsm border border-border p-2 font-mono text-xs">
              <span className="text-ink-muted">key {m.key}</span>
              <span className="text-ink">{m.typeId}</span>
              <span className="text-ink-muted">port {m.portId}</span>
              <span className="text-ink-muted">{m.endpointKind}</span>
              <span className="ml-auto">{m.state}</span>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h2 className="font-heading text-sm font-semibold text-ink">Resource pools</h2>
        <div className="mt-2 grid grid-cols-2 gap-2 md:grid-cols-3">
          {Object.entries(resources.pools).map(([name, pool]) => (
            <div key={name} className="rounded-slmd border border-border p-3">
              <p className="font-body text-xs text-ink-muted">{name}</p>
              <p className="font-mono text-sm text-ink">
                {pool.used}/{pool.capacity} <span className="text-ink-faint">(picco {pool.peak})</span>
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
        <div className="rounded-slmd border border-border p-3">
          <p className="font-body text-xs text-ink-muted">Flash slot</p>
          <p className="font-mono text-sm text-ink">{resources.flashAndStaticRam.flashSlotBytes} B</p>
        </div>
        <div className="rounded-slmd border border-border p-3">
          <p className="font-body text-xs text-ink-muted">Flash headroom</p>
          <p className="font-mono text-sm text-ink">{resources.flashAndStaticRam.flashHeadroomBytes} B</p>
        </div>
        <div className="rounded-slmd border border-border p-3">
          <p className="font-body text-xs text-ink-muted">Static RAM budget</p>
          <p className="font-mono text-sm text-ink">{resources.flashAndStaticRam.staticRamBudgetBytes} B</p>
        </div>
        <div className="rounded-slmd border p-3" style={{ borderColor: resources.allocationFailures.hasEverFailed ? "var(--color-warning)" : "var(--color-border)" }}>
          <p className="font-body text-xs text-ink-muted">Allocation failures</p>
          <p className="font-mono text-sm text-ink">{resources.allocationFailures.count}</p>
          {resources.allocationFailures.hasEverFailed && <p className="mt-0.5 font-body text-xs text-warning">{resources.allocationFailures.note}</p>}
        </div>
      </div>

      <div>
        <div className="flex items-center gap-2">
          <h2 className="font-heading text-sm font-semibold text-ink">Connectivity</h2>
          <button type="button" disabled={loading} onClick={() => void refreshConnectivity()} className="flex items-center gap-1 rounded-slsm border border-border-strong px-2 py-1 font-body text-xs text-ink hover:bg-surface-raised disabled:opacity-40">
            <RefreshCw size={12} />
            Aggiorna
          </button>
        </div>
        {connectivity ? (
          <div className="mt-2 flex flex-wrap gap-2">
            <Chip label="Policy (raw)" value={`0x${connectivity.policyRaw.toString(16)}`} note="nessuna tabella bit→nome confermata" />
            <Chip label="Servizi attivi (raw)" value={`0x${connectivity.activeServicesRaw.toString(16)}`} />
            <Chip label="Servizi in lease (raw)" value={`0x${connectivity.leasedServicesRaw.toString(16)}`} />
            <Chip label="Lease attivo" value={connectivity.hasActiveLease ? "sì" : "no"} />
          </div>
        ) : (
          <p className="mt-2 font-body text-sm text-ink-faint">Non ancora richiesto.</p>
        )}
      </div>
    </div>
  );
}

function Chip({ label, value, note }: { readonly label: string; readonly value: string; readonly note?: string }) {
  return (
    <span className="flex items-center gap-1.5 rounded-slpill border border-border-strong px-3 py-1.5 font-body text-xs" title={note}>
      <span className="text-ink-faint">{label}</span>
      <span className="font-semibold text-ink">{value}</span>
    </span>
  );
}
