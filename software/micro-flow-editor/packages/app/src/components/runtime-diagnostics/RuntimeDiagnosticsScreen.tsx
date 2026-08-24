import type { CoreBindingId } from "@spaghettilab/domain";
import { Activity, ShieldAlert, SlidersHorizontal, Terminal, WifiOff } from "lucide-react";
import { useMemo, useState } from "react";
import { useCoreSessions } from "../../state/core-sessions-context.js";
import { useSession } from "../../state/session-context.js";
import { AdminTab } from "./AdminTab.js";
import { CommandsTab } from "./CommandsTab.js";
import { DiscoveryTab } from "./DiscoveryTab.js";
import { StatusResourcesTab } from "./StatusResourcesTab.js";
import { TelemetryTab } from "./TelemetryTab.js";

const TABS = [
  { id: "telemetria", label: "Telemetria", icon: Activity },
  { id: "comandi", label: "Comandi", icon: Terminal },
  { id: "discovery", label: "Discovery", icon: WifiOff },
  { id: "stato-risorse", label: "Stato & Risorse", icon: SlidersHorizontal },
  { id: "amministrazione", label: "Amministrazione", icon: ShieldAlert },
] as const;
type TabId = (typeof TABS)[number]["id"];

/**
 * `ux/screens/S090-runtime-diagnostics/{visual,ui-behavior,backend-behavior}.md`,
 * cablato su `@spaghettilab/telemetry-buffer` (S091), `@spaghettilab/core-actions`
 * (S092), `@spaghettilab/core-status` (S093) e `@spaghettilab/core-admin` (S094) —
 * tutti reali. Un unico Core alla volta è "a fuoco" (selettore in testata,
 * stesso pattern a pillola di Deploy & Diff), i 5 tab operano tutti su quel
 * binding. Gap dichiarati per tab in ciascun componente figlio.
 */
export function RuntimeDiagnosticsScreen() {
  const { session } = useSession();
  const { rows } = useCoreSessions();
  const bindings = session?.stack.current.coreBindings ?? [];

  const readyRows = useMemo(() => rows.filter((r) => r.sessionState === "READY"), [rows]);
  const [selected, setSelected] = useState<CoreBindingId | null>(null);
  const [tab, setTab] = useState<TabId>("telemetria");

  const activeRow = readyRows.find((r) => r.binding.bindingId === selected) ?? readyRows[0] ?? null;

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex h-14 shrink-0 items-center gap-3 border-b border-border bg-surface px-4">
        <h1 className="font-heading text-lg font-semibold text-ink">Runtime & Diagnostics</h1>
        <span className="ml-auto flex items-center gap-1.5 rounded-slpill border border-border-strong px-3 py-1.5 font-body text-sm text-ink-muted">
          {bindings.length} Core · {readyRows.length} pronti
        </span>
      </div>

      {readyRows.length === 0 ? (
        <div className="flex flex-1 items-center justify-center">
          <p className="font-body text-sm text-ink-faint">Nessun Core connesso e pronto — connetti un Core (Core Connections) per vedere telemetria, comandi e stato qui.</p>
        </div>
      ) : (
        <>
          <div className="flex shrink-0 flex-wrap gap-2 border-b border-border bg-surface px-4 py-2">
            {readyRows.map((r) => (
              <button
                key={r.binding.bindingId}
                type="button"
                onClick={() => setSelected(r.binding.bindingId)}
                className="flex items-center gap-2 rounded-slpill px-3 py-1.5 font-body text-sm"
                style={{
                  border: activeRow?.binding.bindingId === r.binding.bindingId ? "2px solid var(--color-brand-blue)" : "1px solid var(--color-border-strong)",
                  backgroundColor: activeRow?.binding.bindingId === r.binding.bindingId ? "color-mix(in srgb, var(--color-brand-blue) 8%, transparent)" : "transparent",
                }}
              >
                {r.displayName}
              </button>
            ))}
          </div>

          <div className="flex shrink-0 gap-1 border-b border-border bg-surface px-4">
            {TABS.map((t) => {
              const Icon = t.icon;
              const activeTab = tab === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTab(t.id)}
                  className="flex items-center gap-1.5 border-b-2 px-3 py-2.5 font-body text-sm"
                  style={{ borderColor: activeTab ? "var(--color-brand-blue)" : "transparent", color: activeTab ? "var(--color-brand-blue)" : "var(--color-ink-muted)" }}
                >
                  <Icon size={14} />
                  {t.label}
                </button>
              );
            })}
          </div>

          <div className="flex-1 overflow-auto">
            {activeRow && tab === "telemetria" && <TelemetryTab key={activeRow.binding.bindingId} bindingId={activeRow.binding.bindingId} />}
            {activeRow && tab === "comandi" && <CommandsTab key={activeRow.binding.bindingId} bindingId={activeRow.binding.bindingId} />}
            {activeRow && tab === "discovery" && <DiscoveryTab key={activeRow.binding.bindingId} bindingId={activeRow.binding.bindingId} />}
            {activeRow && tab === "stato-risorse" && <StatusResourcesTab key={activeRow.binding.bindingId} bindingId={activeRow.binding.bindingId} />}
            {activeRow && tab === "amministrazione" && <AdminTab key={activeRow.binding.bindingId} bindingId={activeRow.binding.bindingId} coreName={activeRow.displayName} />}
          </div>
        </>
      )}
    </div>
  );
}
