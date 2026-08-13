import { addCoreBinding, coreBindingId, connectionProfileId, createConnectionProfile, type CoreBindingRecord } from "@spaghettilab/domain";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { saveConnectionProfile } from "../../lib/connection-profile-store.js";
import { motionTokens } from "../../lib/motion-tokens.js";
import { uuidGenerator } from "../../lib/repository.js";
import { useSession } from "../../state/session-context.js";

type Method = "auto" | "manual";

/**
 * `ux/screens/S030-core-connections/visual.md` § Dialogo "Connetti un Core".
 * "Rilevamento automatico" is an honest, documented gap here — real network/BLE
 * discovery needs a host-side agent (the same role
 * `Software/node-red/BLE_GATEWAY.md`'s gateway plays for Node-RED); a browser page
 * cannot do it on its own. This dialog always shows the empty/"nessun Core trovato"
 * state for that method rather than faking scan results.
 */
export function ConnectCoreDialog({ open, onClose, onConnect }: { readonly open: boolean; readonly onClose: () => void; readonly onConnect: (binding: CoreBindingRecord, wsUrl: string) => void }) {
  const { execute } = useSession();
  const [method, setMethod] = useState<Method>("auto");
  const [deviceId, setDeviceId] = useState("");
  const [address, setAddress] = useState("");

  const [error, setError] = useState<string | null>(null);
  const addressValid = /^wss?:\/\/.+/.test(address.trim());
  const canConnect = method === "manual" && addressValid && deviceId.trim() !== "";

  async function handleConnect() {
    if (!canConnect || !execute) return;
    setError(null);

    let parsed: URL;
    try {
      parsed = new URL(address.trim());
    } catch {
      setError("Indirizzo non valido.");
      return;
    }

    const profileIdResult = connectionProfileId(uuidGenerator.generate());
    const bindingResult = coreBindingId(uuidGenerator.generate());
    if (!profileIdResult.ok || !bindingResult.ok) return;

    const profileResult = createConnectionProfile({
      connectionProfileId: profileIdResult.value,
      name: deviceId.trim(),
      transport: "websocket",
      host: parsed.hostname,
      port: parsed.port !== "" ? Number(parsed.port) : parsed.protocol === "wss:" ? 443 : 80,
    });
    if (!profileResult.ok) {
      setError(profileResult.error.map((e) => e.remediation).join(" "));
      return;
    }
    await saveConnectionProfile(profileResult.value);

    const binding: CoreBindingRecord = {
      bindingId: bindingResult.value,
      expectedDeviceId: deviceId.trim(),
      connectionProfileId: profileResult.value.connectionProfileId,
    };
    const result = execute(addCoreBinding(binding));
    if (!result.ok) return;
    onConnect(binding, address.trim());
    setDeviceId("");
    setAddress("");
    onClose();
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-50 flex justify-center bg-[rgba(20,23,31,.35)] pt-24" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={motionTokens.duration.base} onClick={onClose}>
          <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.97 }} transition={motionTokens.spring.smooth} onClick={(e) => e.stopPropagation()} className="h-fit w-[480px] rounded-sllg bg-surface p-6 shadow-e3">
            <h2 className="mb-4 font-heading text-lg font-semibold">Connetti un Core</h2>

            <label className="mb-1 block font-body text-sm font-semibold text-ink" htmlFor="core-device-id">
              Nome Core (identificatore atteso)
            </label>
            <input id="core-device-id" value={deviceId} onChange={(e) => setDeviceId(e.target.value)} placeholder="core-greenhouse-01" className="mb-4 w-full rounded-slsm border border-border-strong px-3 py-2 font-mono text-sm outline-none" />

            <div className="mb-4 flex gap-1 rounded-slpill bg-surface-raised p-1">
              <button type="button" onClick={() => setMethod("auto")} className={`flex-1 rounded-slpill py-1.5 text-sm font-body ${method === "auto" ? "bg-surface shadow-e1" : "text-ink-muted"}`}>
                Rilevamento automatico
              </button>
              <button type="button" onClick={() => setMethod("manual")} className={`flex-1 rounded-slpill py-1.5 text-sm font-body ${method === "manual" ? "bg-surface shadow-e1" : "text-ink-muted"}`}>
                Indirizzo manuale
              </button>
            </div>

            <AnimatePresence mode="wait">
              {method === "manual" ? (
                <motion.div key="manual" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={motionTokens.duration.fast}>
                  <label className="mb-1 block font-body text-sm font-semibold text-ink" htmlFor="core-address">
                    Indirizzo WebSocket
                  </label>
                  <input id="core-address" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="ws://192.168.1.42:8765" className="w-full rounded-slsm border border-border-strong px-3 py-2 font-mono text-sm outline-none" />
                  {error && <p className="mt-1 font-body text-xs text-error">{error}</p>}
                </motion.div>
              ) : (
                <motion.div key="auto" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={motionTokens.duration.fast} className="flex flex-col items-center gap-2 rounded-slsm bg-surface-sunken py-8 text-center">
                  <p className="font-body text-sm text-ink-muted">Nessun Core trovato in rete</p>
                  <p className="max-w-64 font-body text-xs text-ink-faint">Il rilevamento automatico richiede un agente sulla rete locale — usa "Indirizzo manuale" per ora.</p>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="mt-6 flex justify-end gap-2">
              <button type="button" onClick={onClose} className="rounded-slsm px-4 py-2 font-body text-sm text-ink-muted hover:bg-surface-raised">
                Annulla
              </button>
              <button type="button" onClick={() => void handleConnect()} disabled={!canConnect} className="rounded-slsm bg-brand-blue px-4 py-2 font-body-strong text-sm text-white hover:bg-brand-blue-dark disabled:opacity-50">
                Connetti
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
