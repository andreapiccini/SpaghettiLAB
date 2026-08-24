import { useEffect, useState } from "react";
import { useNodeRedRuntime } from "../../state/node-red-runtime-context.js";

const REACHABLE_LABEL: Record<string, { readonly text: string; readonly color: string }> = {
  unknown: { text: "non verificato", color: "var(--color-ink-faint)" },
  checking: { text: "verifica…", color: "var(--color-ink-muted)" },
  reachable: { text: "raggiungibile", color: "var(--color-success)" },
  unreachable: { text: "non raggiungibile", color: "var(--color-error)" },
};

/**
 * Node-RED is a selectable host runtime (loopback / LAN / remote), never a
 * second editor. URL is host-local storage; the Admin token stays in session
 * memory and is never written to ProjectV1.
 */
export function NodeRedRuntimeBar() {
  const { target, token, reachability, lastError, setBaseUrl, setToken, probe } = useNodeRedRuntime();
  const [draft, setDraft] = useState(target.baseUrl);
  const status = REACHABLE_LABEL[reachability] ?? REACHABLE_LABEL.unknown!;

  useEffect(() => {
    setDraft(target.baseUrl);
  }, [target.baseUrl]);

  return (
    <div className="flex min-w-0 flex-wrap items-end gap-2">
      <label className="flex min-w-0 flex-col gap-0.5">
        <span className="font-body text-[11px] text-ink-faint">Server Node-RED (locale / LAN / remoto)</span>
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={() => setBaseUrl(draft)}
          onKeyDown={(e) => {
            if (e.key === "Enter") void probe(draft);
          }}
          placeholder="http://127.0.0.1:1880"
          className="w-56 rounded-slsm border border-border-strong px-2 py-1 font-mono text-xs outline-none"
        />
      </label>
      <label className="flex flex-col gap-0.5">
        <span className="font-body text-[11px] text-ink-faint">Token (sessione)</span>
        <input
          value={token}
          onChange={(e) => setToken(e.target.value)}
          type="password"
          className="w-28 rounded-slsm border border-border-strong px-2 py-1 font-mono text-xs outline-none"
        />
      </label>
      <button
        type="button"
        onClick={() => {
          void probe(draft);
        }}
        className="rounded-slpill border border-border-strong px-3 py-1 font-body text-xs text-ink hover:bg-surface-raised"
      >
        Connetti
      </button>
      <span className="mb-1 flex items-center gap-1.5 font-body text-xs" style={{ color: status.color }}>
        <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: status.color }} />
        {status.text}
      </span>
      {lastError && <span className="mb-1 max-w-xs truncate font-body text-[11px] text-error" title={lastError}>{lastError}</span>}
    </div>
  );
}
