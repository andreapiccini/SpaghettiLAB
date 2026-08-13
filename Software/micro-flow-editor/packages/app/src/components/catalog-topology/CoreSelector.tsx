import type { CoreBindingRecord } from "@spaghettilab/domain";
import { ChevronDown, Cpu } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { motionTokens } from "../../lib/motion-tokens.js";

/** `ux/screens/S040-catalog-topology/visual.md` § Header — "stesso pattern di S070" (S070 non è ancora costruito: pattern minimo coerente col resto della shell, non copiato da nulla di esistente). */
export function CoreSelector({ bindings, selected, onSelect }: { readonly bindings: readonly CoreBindingRecord[]; readonly selected: CoreBindingRecord | null; readonly onSelect: (binding: CoreBindingRecord) => void }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button type="button" onClick={() => setOpen((o) => !o)} className="flex h-9 items-center gap-2 rounded-slsm border border-border-strong px-3 font-body text-sm text-ink hover:bg-surface-raised">
        <Cpu size={14} className="text-ink-faint" />
        <span className="text-ink-faint">Core</span>
        <span className="font-semibold">{selected ? selected.expectedDeviceId : "—"}</span>
        <ChevronDown size={14} className="text-ink-faint" />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={motionTokens.duration.fast} className="absolute left-0 top-11 z-40 w-64 overflow-hidden rounded-slmd border border-border bg-surface shadow-e2">
            {bindings.length === 0 ? (
              <p className="p-3 font-body text-sm text-ink-faint">Nessun Core nel progetto.</p>
            ) : (
              bindings.map((b) => (
                <button
                  key={b.bindingId}
                  type="button"
                  onClick={() => {
                    onSelect(b);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center gap-2 px-3 py-2 text-left font-body text-sm hover:bg-surface-raised ${selected?.bindingId === b.bindingId ? "bg-surface-raised font-semibold" : ""}`}
                >
                  {b.expectedDeviceId}
                </button>
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
