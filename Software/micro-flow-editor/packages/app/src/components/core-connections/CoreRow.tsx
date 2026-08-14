import { diffConfigs, isConfigDiffEmpty } from "@spaghettilab/config-deployment";
import { decodeConfigCbor, dryRunConfig } from "@spaghettilab/config-decompiler";
import type { GraphState } from "@spaghettilab/domain";
import { CloudOff, Cpu } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useMemo, useState } from "react";
import { DEFAULT_ENERGY, DISABLED_MQTT } from "../../lib/default-config-policy.js";
import { motionTokens } from "../../lib/motion-tokens.js";
import type { CoreRowState } from "../../state/core-sessions-context.js";
import { useCoreSessions } from "../../state/core-sessions-context.js";
import { useSession } from "../../state/session-context.js";
import { ConfigDiffView } from "../deploy-diff/ConfigDiffView.js";
import { rowActionLabel, sessionBadgeStyle, syncBadge } from "./session-badge.js";

const TRANSITIONAL = new Set(["CONNECTING", "AUTHENTICATING", "SYNCHRONIZING", "VALIDATING", "APPLYING", "UPDATING", "REBOOTING", "TRIAL"]);
const EMPTY_PHYSICAL: GraphState<"physical-composition"> = { layer: "physical-composition", nodes: [], edges: [] };
const EMPTY_PROCESSING: GraphState<"device-processing"> = { layer: "device-processing", nodes: [], edges: [] };

export function CoreRow({ row, bindingIndex, onConnect }: { readonly row: CoreRowState; readonly bindingIndex: number; readonly onConnect: () => void }) {
  const { cancel, getSnapshot } = useCoreSessions();
  const { session } = useSession();
  const [expanded, setExpanded] = useState(false);
  const hasError = row.error !== null && row.sessionState === "DISCONNECTED";
  const badge = sessionBadgeStyle(row.sessionState);
  const action = rowActionLabel(row.sessionState, row.stale, row.syncRelationship, hasError);
  const showStale = row.sessionState === "DISCONNECTED" && row.stale && !hasError;
  const isErrorLike = row.sessionState === "ERROR" || row.sessionState === "CONFLICT" || hasError;

  // Recomputed fresh from the live Config snapshot + current graphs, not `row.syncRelationship`
  // (which is a point-in-time classification from connect() and goes stale the moment the user
  // edits the project afterwards) — same reasoning Deploy & Diff's own candidate list documents.
  const diff = useMemo(() => {
    if (!expanded || !session) return null;
    const snapshot = getSnapshot(row.binding.bindingId);
    if (!snapshot?.config) return null;
    const liveDecoded = decodeConfigCbor(snapshot.config.configBytes);
    if (!liveDecoded.ok) return null;
    const physicalGraph = session.stack.current.physicalGraphs[bindingIndex] ?? EMPTY_PHYSICAL;
    const processingGraph = session.stack.current.deviceGraphs[bindingIndex] ?? EMPTY_PROCESSING;
    const dryRun = dryRunConfig({ physicalGraph, processingGraph, mqtt: DISABLED_MQTT, connectivity: 0, energy: DEFAULT_ENERGY });
    if (!dryRun.compiled) return null;
    return diffConfigs(liveDecoded.value, dryRun.compiled);
  }, [expanded, session, getSnapshot, row.binding.bindingId, bindingIndex]);

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
              {row.error ? (
                <p className="text-error">{typeof row.error === "string" ? row.error : row.error.remediation}</p>
              ) : diff ? (
                isConfigDiffEmpty(diff) ? (
                  <p>Relazione: {row.syncRelationship ?? "n/d"} — il Config live e quello ricompilato dal progetto sono in realtà identici in questo momento (la classificazione di sync risale al connect, il progetto potrebbe essere cambiato da allora).</p>
                ) : (
                  <ConfigDiffView diff={diff} />
                )
              ) : (
                <p>Relazione: {row.syncRelationship ?? "n/d"} — nessun Config live disponibile per calcolare il dettaglio.</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
