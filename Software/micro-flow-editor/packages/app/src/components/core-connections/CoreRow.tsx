import { CloudOff, Cpu } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { motionTokens } from "../../lib/motion-tokens.js";
import type { CoreRowState } from "../../state/core-sessions-context.js";
import { useCoreSessions } from "../../state/core-sessions-context.js";
import { rowActionLabel, sessionBadgeStyle, syncBadge } from "./session-badge.js";

const TRANSITIONAL = new Set(["CONNECTING", "AUTHENTICATING", "SYNCHRONIZING", "VALIDATING", "APPLYING", "UPDATING", "REBOOTING", "TRIAL"]);

export function CoreRow({ row, onConnect }: { readonly row: CoreRowState; readonly onConnect: () => void }) {
  const { cancel } = useCoreSessions();
  const [expanded, setExpanded] = useState(false);
  const hasError = row.error !== null && row.sessionState === "DISCONNECTED";
  const badge = sessionBadgeStyle(row.sessionState);
  const action = rowActionLabel(row.sessionState, row.stale, row.syncRelationship, hasError);
  const showStale = row.sessionState === "DISCONNECTED" && row.stale && !hasError;
  const isErrorLike = row.sessionState === "ERROR" || row.sessionState === "CONFLICT" || hasError;

  function handleAction() {
    if (action === "Connetti" || action === "Riconnetti") {
      onConnect();
    } else if (action === "Annulla") {
      cancel(row.binding.bindingId);
    } else if (action) {
      setExpanded((e) => !e);
    }
  }

  return (
    <motion.div
      layout
      className="rounded-slmd border bg-surface p-4 shadow-e1 hover:shadow-e2"
      style={{ borderColor: isErrorLike ? "var(--color-error)" : "var(--color-border)", borderWidth: isErrorLike ? 2 : 1 }}
    >
      <div className="flex min-h-10 items-center gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-slsm" style={{ backgroundColor: `color-mix(in srgb, ${badge.colorVar} 12%, transparent)` }}>
          <Cpu size={20} style={{ color: badge.colorVar }} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="truncate font-body text-sm font-semibold text-ink">{row.displayName}</div>
          <div className="truncate font-mono text-xs text-ink-faint">core://{row.binding.expectedDeviceId}{row.binding.lastKnownVariant ? ` · ${row.binding.lastKnownVariant}` : ""}</div>
        </div>

        <AnimatePresence mode="wait">
          {hasError ? (
            <motion.div key="conn-error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={motionTokens.duration.base} className="flex items-center gap-1.5 rounded-slpill px-2 py-0.5 text-xs" style={{ backgroundColor: "color-mix(in srgb, var(--color-error) 12%, transparent)", color: "var(--color-error)" }}>
              <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: "var(--color-error)" }} />
              ERRORE
            </motion.div>
          ) : showStale ? (
            <motion.div key="stale" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={motionTokens.duration.base} className="flex items-center gap-1.5 rounded-slpill bg-ink-faint/12 px-2 py-0.5 text-xs text-ink-muted">
              <CloudOff size={12} />
              stale
            </motion.div>
          ) : (
            <motion.div key={row.sessionState} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={motionTokens.duration.base} className="flex items-center gap-1.5 rounded-slpill px-2 py-0.5 text-xs" style={{ backgroundColor: `color-mix(in srgb, ${badge.colorVar} 12%, transparent)`, color: badge.colorVar }}>
              <motion.span
                className="h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: badge.colorVar }}
                animate={TRANSITIONAL.has(row.sessionState) ? { opacity: [0.4, 1, 0.4] } : {}}
                transition={TRANSITIONAL.has(row.sessionState) ? { duration: 1.2, repeat: Infinity, ease: "linear" } : undefined}
              />
              {badge.label}
            </motion.div>
          )}
        </AnimatePresence>

        {row.sessionState === "READY" && row.syncRelationship && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={motionTokens.spring.bouncy}
            className="flex items-center gap-1.5 rounded-slpill px-2 py-0.5 text-xs"
            style={{ backgroundColor: `color-mix(in srgb, ${syncBadge(row.syncRelationship).colorVar} 12%, transparent)`, color: syncBadge(row.syncRelationship).colorVar }}
          >
            {(() => {
              const Icon = syncBadge(row.syncRelationship).icon;
              return <Icon size={12} />;
            })()}
            {row.syncRelationship}
          </motion.div>
        )}

        {action && (
          <button type="button" onClick={handleAction} className={row.sessionState === "READY" ? "h-9 shrink-0 rounded-slsm border border-border-strong px-3 text-sm font-body text-ink hover:bg-surface-raised" : "ml-auto h-9 shrink-0 rounded-slsm border border-border-strong px-3 text-sm font-body text-ink hover:bg-surface-raised"}>
            {action}
          </button>
        )}
        {row.sessionState === "READY" && (
          <button type="button" onClick={() => cancel(row.binding.bindingId)} className={`h-9 shrink-0 rounded-slsm border border-border-strong px-3 text-sm font-body text-ink-muted hover:bg-surface-raised ${action ? "" : "ml-auto"}`}>
            Disconnetti
          </button>
        )}
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={motionTokens.duration.base} className="overflow-hidden">
            <div className="mt-3 border-t border-border pt-3 font-body text-sm text-ink-muted">
              {row.error ? <p className="text-error">{typeof row.error === "string" ? row.error : row.error.remediation}</p> : <p>Relazione: {row.syncRelationship ?? "n/d"} — dettaglio strutturato non ancora disponibile per questo esito (UI-S080/UI-S100 lo estendono).</p>}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
