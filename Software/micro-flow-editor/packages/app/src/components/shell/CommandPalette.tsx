import { Activity, Boxes, Cable, FileCode, GitCompareArrows, Network, Redo2, Search, Settings, Share2, Store, Undo2, Workflow, type LucideIcon } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import { motionTokens } from "../../lib/motion-tokens.js";
import { useSession, type ScreenId } from "../../state/session-context.js";

type PaletteEntry = { readonly id: string; readonly label: string; readonly icon: LucideIcon; readonly shortcut?: string; readonly run: () => void };

/** `ux/screens/S010-workspace-shell/visual.md` § 3 + `ui-behavior.md` § Command palette — `⌘K` overlay, keyboard-only navigable. */
export function CommandPalette() {
  const { session, navigate, undo, redo } = useSession();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [highlighted, setHighlighted] = useState(0);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
        setQuery("");
        setHighlighted(0);
      } else if (e.key === "Escape") {
        setOpen(false);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const entries = useMemo<PaletteEntry[]>(() => {
    const navEntries: PaletteEntry[] = (
      [
        ["core-connections", "Core Connections", Cable],
        ["catalog-topology", "Catalog & Topology Explorer", Network],
        ["physical-composition", "Physical Composition Editor", Boxes],
        ["device-profile-studio", "Device Profile Studio", FileCode],
        ["processing-graph", "Processing Graph Editor", Workflow],
        ["deploy-diff", "Deploy & Diff", GitCompareArrows],
        ["runtime-diagnostics", "Runtime & Diagnostics", Activity],
        ["capability-marketplace", "Capability Marketplace & OTA", Store],
        ["cross-core-automation", "Cross-Core Automation", Share2],
        ["settings-security", "Settings, Security & Recovery", Settings],
      ] as const
    ).map(([id, label, icon]: readonly [ScreenId, string, LucideIcon]) => ({
      id: `nav-${id}`,
      label: `Vai a: ${label}`,
      icon,
      run: () => navigate(id),
    }));

    const actionEntries: PaletteEntry[] = [];
    if (session?.stack.canUndo()) {
      actionEntries.push({ id: "undo", label: "Annulla ultima modifica", icon: Undo2, shortcut: "⌘Z", run: undo });
    }
    if (session?.stack.canRedo()) {
      actionEntries.push({ id: "redo", label: "Ripeti ultima modifica", icon: Redo2, shortcut: "⌘⇧Z", run: redo });
    }

    return [...actionEntries, ...navEntries];
  }, [session, navigate, undo, redo]);

  const filtered = entries.filter((e) => e.label.toLowerCase().includes(query.toLowerCase()));

  function runHighlighted() {
    const entry = filtered[highlighted];
    if (entry) {
      entry.run();
      setOpen(false);
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-50 flex justify-center bg-[rgba(20,23,31,.35)] pt-24" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={motionTokens.duration.fast} onClick={() => setOpen(false)}>
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: -8 }}
            transition={motionTokens.spring.smooth}
            onClick={(e) => e.stopPropagation()}
            className="h-fit w-[560px] overflow-hidden rounded-sllg bg-surface shadow-e3"
          >
            <div className="flex h-12 items-center gap-2 border-b border-border px-4">
              <Search size={16} className="text-ink-faint" />
              <input
                autoFocus
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setHighlighted(0);
                }}
                onKeyDown={(e) => {
                  if (e.key === "ArrowDown") {
                    e.preventDefault();
                    setHighlighted((h) => Math.min(h + 1, filtered.length - 1));
                  } else if (e.key === "ArrowUp") {
                    e.preventDefault();
                    setHighlighted((h) => Math.max(h - 1, 0));
                  } else if (e.key === "Enter") {
                    runHighlighted();
                  }
                }}
                placeholder="Cerca un comando o una schermata..."
                className="w-full bg-transparent font-body text-sm outline-none placeholder:text-ink-faint"
              />
            </div>
            <div className="max-h-80 overflow-auto py-1">
              {filtered.map((entry, i) => {
                const Icon = entry.icon;
                return (
                  <button
                    key={entry.id}
                    type="button"
                    onMouseEnter={() => setHighlighted(i)}
                    onClick={() => {
                      entry.run();
                      setOpen(false);
                    }}
                    className={`flex h-11 w-full items-center gap-3 px-4 text-left font-body text-sm ${i === highlighted ? "bg-surface-raised" : ""}`}
                  >
                    <Icon size={16} className="text-ink-faint" />
                    <span className="flex-1 truncate">{entry.label}</span>
                    {entry.shortcut && <span className="font-body text-xs text-ink-faint">{entry.shortcut}</span>}
                  </button>
                );
              })}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
