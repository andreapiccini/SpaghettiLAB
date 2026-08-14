import { interpretJobStatus, JobProgressOutcomeKind, ScanOutcomeKind, type ScanOutcome } from "@spaghettilab/core-actions";
import type { CoreBindingId } from "@spaghettilab/domain";
import type { DiscoveryCandidate } from "@spaghettilab/protocol-sdk";
import { Radar, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { useCoreSessions } from "../../state/core-sessions-context.js";
import { useSession } from "../../state/session-context.js";
import { PLACEHOLDER_GRANTED_ALL } from "./permission-placeholder.js";

const JOB_PROGRESS_LABEL: Record<string, string> = {
  [JobProgressOutcomeKind.PENDING]: "In coda",
  [JobProgressOutcomeKind.RUNNING]: "In corso",
  [JobProgressOutcomeKind.COMPLETED]: "Completato",
  [JobProgressOutcomeKind.FAILED]: "Fallito",
  [JobProgressOutcomeKind.CANCELLED]: "Annullato",
  [JobProgressOutcomeKind.TIMEOUT]: "Timeout",
  [JobProgressOutcomeKind.UNKNOWN]: "Sconosciuto",
};

/**
 * `ux/screens/S090-runtime-diagnostics/visual.md` § Discovery, cablato su
 * `@spaghettilab/core-actions`'s `requestScan`/`interpretJobStatus` (S092,
 * reale) per avviare/monitorare la scan; la lista candidati riusa
 * `CoreSession.listDiscoveryCandidates()` già cablato per S050. Onestamente
 * non duplica qui l'accettazione bay/rail di Physical Composition (richiede
 * `TopologyIndex`/nodi esistenti, dati di quello schermo): un candidato
 * accettabile rimanda lì invece di reimplementare un secondo flusso di
 * accept parziale.
 */
export function DiscoveryTab({ bindingId }: { readonly bindingId: CoreBindingId }) {
  const { requestScan, getJobStatus, listDiscoveryCandidates } = useCoreSessions();
  const { navigate } = useSession();
  const [portId, setPortId] = useState(0);
  const [invasive, setInvasive] = useState(false);
  const [scanOutcome, setScanOutcome] = useState<ScanOutcome | null>(null);
  const [jobProgress, setJobProgress] = useState<{ readonly kind: string; readonly progress: number } | null>(null);
  const [candidates, setCandidates] = useState<readonly DiscoveryCandidate[]>([]);

  useEffect(() => {
    listDiscoveryCandidates(bindingId)?.then(setCandidates).catch(() => undefined);
  }, [bindingId, listDiscoveryCandidates]);

  useEffect(() => {
    if (!scanOutcome || scanOutcome.kind !== ScanOutcomeKind.STARTED || scanOutcome.jobId === undefined) return;
    const jobId = scanOutcome.jobId;
    let cancelled = false;
    const interval = setInterval(() => {
      getJobStatus(bindingId, jobId)
        ?.then((status) => {
          if (cancelled) return;
          const interpreted = interpretJobStatus(status);
          setJobProgress(interpreted);
          if (interpreted.kind === JobProgressOutcomeKind.COMPLETED || interpreted.kind === JobProgressOutcomeKind.FAILED || interpreted.kind === JobProgressOutcomeKind.CANCELLED || interpreted.kind === JobProgressOutcomeKind.TIMEOUT) {
            clearInterval(interval);
            listDiscoveryCandidates(bindingId)?.then(setCandidates).catch(() => undefined);
          }
        })
        .catch(() => undefined);
    }, 1500);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [scanOutcome, bindingId, getJobStatus, listDiscoveryCandidates]);

  async function handleScan() {
    setJobProgress(null);
    const outcome = await requestScan(bindingId, { portId, invasive }, PLACEHOLDER_GRANTED_ALL);
    if (outcome) setScanOutcome(outcome);
  }

  return (
    <div className="flex h-full flex-col gap-4 p-6">
      <div className="rounded-slmd border-l-4 border-brand-purple-glow p-3" style={{ backgroundColor: "color-mix(in srgb, var(--color-brand-purple-glow) 6%, transparent)" }}>
        <p className="font-body text-sm text-ink">Azione immediata sul Core — una scan invasiva può alterare lo stato dell'hardware collegato.</p>
      </div>

      <div className="flex flex-wrap items-end gap-3 rounded-slmd border border-border p-3">
        <label className="flex flex-col gap-1">
          <span className="font-body text-xs text-ink-muted">Port ID</span>
          <input type="number" value={portId} onChange={(e) => setPortId(Number(e.target.value))} className="w-28 rounded-slsm border border-border-strong px-2 py-1.5 font-mono text-sm outline-none" />
        </label>
        <label className="flex items-center gap-2 pb-1.5">
          <input type="checkbox" checked={invasive} onChange={(e) => setInvasive(e.target.checked)} />
          <span className="font-body text-xs text-ink-muted">Scan invasiva (richiede permesso "core.discovery.invasive-scan")</span>
        </label>
        <button type="button" onClick={() => void handleScan()} className="ml-auto flex items-center gap-1.5 rounded-slpill bg-brand-purple-glow px-4 py-1.5 font-body-strong text-sm text-white hover:opacity-90">
          <Search size={14} />
          Avvia scan
        </button>
      </div>

      {scanOutcome && (
        <div className="rounded-slmd border border-border p-3">
          {scanOutcome.kind === ScanOutcomeKind.STARTED ? (
            <p className="font-body text-sm text-ink">
              Job {scanOutcome.jobId} avviato — {jobProgress ? `${JOB_PROGRESS_LABEL[jobProgress.kind]} (${jobProgress.progress}%)` : "in attesa di stato"}
            </p>
          ) : (
            <p className="font-body text-sm text-error">Scan non avviata: {scanOutcome.kind}</p>
          )}
        </div>
      )}

      <div>
        <h2 className="font-heading text-sm font-semibold text-ink">Candidati rilevati ({candidates.length})</h2>
        {candidates.length === 0 ? (
          <div className="mt-3 flex flex-col items-center gap-2 py-8 text-center">
            <Radar size={32} className="text-ink-faint" />
            <p className="font-body text-sm text-ink-muted">Nessun candidato al momento</p>
          </div>
        ) : (
          <div className="mt-3 flex flex-col gap-2">
            {candidates.map((c) => (
              <div key={c.id} className="flex items-center gap-3 rounded-slsm border border-border p-2 font-body text-sm">
                <span className="font-mono text-xs text-ink-muted">port {c.portId}</span>
                <span className="text-ink">{c.suggestedTypeId}</span>
                <span className="ml-auto font-mono text-xs text-ink-faint">confidenza {c.confidence}</span>
                <button type="button" onClick={() => navigate("physical-composition")} className="font-body text-xs font-semibold text-brand-blue underline">
                  Accetta in Physical Composition
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
