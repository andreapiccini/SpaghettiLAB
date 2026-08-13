import { MoreVertical, Redo2, Undo2 } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { motionTokens } from "../../lib/motion-tokens.js";
import { useSession } from "../../state/session-context.js";

const COMMAND_LABELS: Record<string, string> = {
  RenameProject: "Rinomina progetto",
  AddCoreBinding: "Aggiungi Core Binding",
  RemoveCoreBinding: "Rimuovi Core Binding",
};

function describeCommand(kind: string | undefined): string | undefined {
  if (!kind) return undefined;
  return COMMAND_LABELS[kind] ?? kind;
}

/** `ux/screens/S010-workspace-shell/visual.md` § 2 — the standard top bar extended with undo/redo, inside an open project. */
export function TopBar() {
  const { session, undo, redo } = useSession();
  const [pulse, setPulse] = useState<"undo" | "redo" | null>(null);

  if (!session) return null;
  const canUndo = session.stack.canUndo();
  const canRedo = session.stack.canRedo();

  function handleUndo() {
    if (!canUndo) return;
    setPulse("undo");
    undo();
  }
  function handleRedo() {
    if (!canRedo) return;
    setPulse("redo");
    redo();
  }

  return (
    <header className="flex h-14 items-center justify-between border-b border-border bg-surface px-4">
      <div className="flex items-center gap-3">
        <img src="/ux-assets/icon-transparent-28@2x.png" alt="" className="h-7 w-7" />
        <div className="flex items-center gap-1">
          <motion.button
            type="button"
            title={canUndo ? `Annulla: ${describeCommand(session.stack.peekUndoKind())}` : undefined}
            onClick={handleUndo}
            animate={pulse === "undo" ? { scale: [1, 0.9, 1] } : {}}
            transition={motionTokens.spring.snappy}
            onAnimationComplete={() => setPulse(null)}
            disabled={!canUndo}
            className={`flex h-9 w-9 items-center justify-center rounded-slsm ${canUndo ? "text-ink-muted hover:bg-surface-raised" : "cursor-not-allowed opacity-40"}`}
          >
            <Undo2 size={18} />
          </motion.button>
          <motion.button
            type="button"
            title={canRedo ? `Ripeti: ${describeCommand(session.stack.peekRedoKind())}` : undefined}
            onClick={handleRedo}
            animate={pulse === "redo" ? { scale: [1, 0.9, 1] } : {}}
            transition={motionTokens.spring.snappy}
            onAnimationComplete={() => setPulse(null)}
            disabled={!canRedo}
            className={`flex h-9 w-9 items-center justify-center rounded-slsm ${canRedo ? "text-ink-muted hover:bg-surface-raised" : "cursor-not-allowed opacity-40"}`}
          >
            <Redo2 size={18} />
          </motion.button>
        </div>
        <div className="h-6 w-px bg-border" />
        <span className="font-body text-sm text-ink-muted">Nessun Core attivo</span>
      </div>
      <div className="flex items-center gap-2">
        <button type="button" className="rounded-slpill bg-brand-blue px-4 py-1.5 font-body-strong text-sm text-white hover:bg-brand-blue-dark">
          Deploy
        </button>
        <button type="button" className="flex h-9 w-9 items-center justify-center rounded-slsm text-ink-muted hover:bg-surface-raised" aria-label="Menu">
          <MoreVertical size={18} />
        </button>
      </div>
    </header>
  );
}
