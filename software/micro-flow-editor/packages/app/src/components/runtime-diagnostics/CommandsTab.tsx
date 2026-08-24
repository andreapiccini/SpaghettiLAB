import { CommandOutcomeKind, type CommandOutcome } from "@spaghettilab/core-actions";
import type { CoreBindingId } from "@spaghettilab/domain";
import { Play } from "lucide-react";
import { useState } from "react";
import { useCoreSessions } from "../../state/core-sessions-context.js";
import { PLACEHOLDER_GRANTED_ALL } from "./permission-placeholder.js";

const OUTCOME_STYLE: Record<CommandOutcome["kind"], { readonly label: string; readonly colorVar: string }> = {
  [CommandOutcomeKind.SUCCESS]: { label: "Successo", colorVar: "var(--color-success)" },
  [CommandOutcomeKind.PERMISSION_DENIED]: { label: "Permesso negato", colorVar: "var(--color-error)" },
  [CommandOutcomeKind.QUEUE_FULL]: { label: "Coda piena", colorVar: "var(--color-warning)" },
  [CommandOutcomeKind.TIMEOUT]: { label: "Timeout", colorVar: "var(--color-warning)" },
  [CommandOutcomeKind.UNSUPPORTED_ARGUMENTS]: { label: "Argomenti non supportati", colorVar: "var(--color-error)" },
  [CommandOutcomeKind.REMOTE_ERROR]: { label: "Errore remoto", colorVar: "var(--color-error)" },
};

/**
 * `ux/screens/S090-runtime-diagnostics/visual.md` § Comandi, cablato su
 * `@spaghettilab/core-actions`'s `runCommand` (S092, reale). Gap dichiarato:
 * non esiste alcun catalogo comandi guidato dal catalogo firmware
 * (`ModuleDriverEntry` in `catalog-model` espone solo `{typeId, commandCount}`,
 * nessun metadato per singolo comando) — stesso genere di gap già
 * documentato per Rule/Block in UI-S040/UI-S060/UI-S070. Il form richiede
 * quindi Module key e command ID inseriti manualmente, non selezionati da
 * un elenco.
 */
export function CommandsTab({ bindingId }: { readonly bindingId: CoreBindingId }) {
  const { runCommand } = useCoreSessions();
  const [moduleKey, setModuleKey] = useState(0);
  const [commandId, setCommandId] = useState(0);
  const [requiresArguments, setRequiresArguments] = useState(false);
  const [running, setRunning] = useState(false);
  const [history, setHistory] = useState<readonly { readonly moduleKey: number; readonly commandId: number; readonly outcome: CommandOutcome }[]>([]);

  async function handleRun() {
    setRunning(true);
    try {
      const outcome = await runCommand(bindingId, { moduleKey, commandId, requiresArguments }, PLACEHOLDER_GRANTED_ALL);
      if (outcome) setHistory((prev) => [{ moduleKey, commandId, outcome }, ...prev]);
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="flex h-full flex-col gap-4 p-6">
      <div className="rounded-slmd border-l-4 border-brand-purple-glow p-3" style={{ backgroundColor: "color-mix(in srgb, var(--color-brand-purple-glow) 6%, transparent)" }}>
        <p className="font-body text-sm text-ink">Azione immediata su un Module — non modifica Config né progetto (S092 § Verifiche).</p>
        <p className="mt-0.5 font-body text-xs text-ink-muted">
          Gap onesto: nessun catalogo comandi esiste ancora — inserisci Module key e command ID manualmente. `MODULE_COMMAND` non ha un campo argomenti sul wire: attiva "richiede argomenti" solo se sai che il comando ne ha bisogno, per rifiutarlo esplicitamente invece di inviarlo senza.
        </p>
      </div>

      <div className="flex flex-wrap items-end gap-3 rounded-slmd border border-border p-3">
        <label className="flex flex-col gap-1">
          <span className="font-body text-xs text-ink-muted">Module key</span>
          <input type="number" value={moduleKey} onChange={(e) => setModuleKey(Number(e.target.value))} className="w-28 rounded-slsm border border-border-strong px-2 py-1.5 font-mono text-sm outline-none" />
        </label>
        <label className="flex flex-col gap-1">
          <span className="font-body text-xs text-ink-muted">Command ID</span>
          <input type="number" value={commandId} onChange={(e) => setCommandId(Number(e.target.value))} className="w-28 rounded-slsm border border-border-strong px-2 py-1.5 font-mono text-sm outline-none" />
        </label>
        <label className="flex items-center gap-2 pb-1.5">
          <input type="checkbox" checked={requiresArguments} onChange={(e) => setRequiresArguments(e.target.checked)} />
          <span className="font-body text-xs text-ink-muted">Richiede argomenti (rifiuta localmente — il wire non li supporta)</span>
        </label>
        <button
          type="button"
          disabled={running}
          onClick={() => void handleRun()}
          className="ml-auto flex items-center gap-1.5 rounded-slpill bg-brand-purple-glow px-4 py-1.5 font-body-strong text-sm text-white hover:opacity-90 disabled:opacity-40"
        >
          <Play size={14} />
          Esegui
        </button>
      </div>

      <div className="flex flex-col gap-1.5">
        {history.map((h, i) => {
          const style = OUTCOME_STYLE[h.outcome.kind];
          return (
            <div key={i} className="flex items-center gap-3 rounded-slsm border border-border p-2 font-mono text-xs">
              <span className="text-ink-muted">key {h.moduleKey}</span>
              <span className="text-ink-muted">cmd {h.commandId}</span>
              <span className="ml-auto rounded-slpill px-2 py-0.5" style={{ backgroundColor: `color-mix(in srgb, ${style.colorVar} 12%, transparent)`, color: style.colorVar }}>
                {style.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
