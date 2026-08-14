import { MoreVertical, Redo2, Undo2 } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { motionTokens } from "../../lib/motion-tokens.js";
import { useSession } from "../../state/session-context.js";
import { useUiMode } from "../../state/ui-mode-context.js";

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
  const { mode, setMode } = useUiMode();
  const [pulse, setPulse] = useState<"undo" | "redo" | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    function onPointerDown(event: PointerEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    window.addEventListener("pointerdown", onPointerDown);
    return () => window.removeEventListener("pointerdown", onPointerDown);
  }, [menuOpen]);

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
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-slsm text-ink-muted hover:bg-surface-raised"
            aria-label="Menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
          >
            <MoreVertical size={18} />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-11 z-20 w-[280px] rounded-slmd bg-surface p-2 shadow-e2">
              <div className="flex items-start justify-between gap-3 px-2 py-2">
                <div>
                  <div className="font-body text-sm text-ink">Modalità avanzata</div>
                  <p className="font-body text-xs text-ink-faint">Authoring profili, marketplace OTA, automazione multi-Core</p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={mode === "advanced"}
                  aria-label="Modalità avanzata"
                  onClick={() => setMode(mode === "advanced" ? "base" : "advanced")}
                  className={`relative mt-0.5 h-5 w-9 shrink-0 rounded-slpill ${mode === "advanced" ? "bg-brand-blue" : "bg-border"}`}
                >
                  <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-e1 transition-[left] duration-200 ${mode === "advanced" ? "left-4" : "left-0.5"}`} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
