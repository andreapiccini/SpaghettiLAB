import { importProjectV1, projectId as parseProjectId, type ProjectId } from "@spaghettilab/domain";
import { FolderPlus, Plus, Search, Settings, Upload } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { motionTokens } from "../../lib/motion-tokens.js";
import { projectRepository } from "../../lib/repository.js";
import { useSession } from "../../state/session-context.js";
import { useSettingsModal } from "../../state/settings-modal-context.js";
import { ChromeStatus } from "../shell/ChromeStatus.js";
import { NewProjectDialog } from "./NewProjectDialog.js";
import { ProjectCard } from "./ProjectCard.js";

export type ProjectSummary = { readonly projectId: ProjectId; readonly name: string; readonly coreBindingCount: number };

type LoadState = { readonly kind: "loading" } | { readonly kind: "error"; readonly message: string } | { readonly kind: "loaded"; readonly projects: readonly ProjectSummary[] };

/**
 * `ux/screens/S010-workspace-shell/backend-behavior.md` § "Caricamento del Project
 * Picker": `ProjectRepository` has no lightweight metadata-only read, so populating
 * the grid means loading every project in full — an honest, documented performance
 * limit, not a correctness bug.
 */
async function loadSummaries(): Promise<LoadState> {
  const ids = await projectRepository.listProjectIds();
  const summaries: ProjectSummary[] = [];
  for (const rawId of ids) {
    const idResult = parseProjectId(rawId);
    if (!idResult.ok) continue;
    const loaded = await projectRepository.load(idResult.value);
    if (!loaded.ok) {
      return { kind: "error", message: loaded.error.map((e) => e.remediation).join("; ") };
    }
    summaries.push({ projectId: loaded.value.projectId, name: loaded.value.name, coreBindingCount: loaded.value.coreBindings.length });
  }
  return { kind: "loaded", projects: summaries };
}

export function ProjectPicker() {
  const { openProject } = useSession();
  const { openSettings } = useSettingsModal();
  const [state, setState] = useState<LoadState>({ kind: "loading" });
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Explicit re-load (Riprova, after import) — resets to "loading" first since the
  // grid is already populated/errored when this runs, unlike the initial mount below.
  const refresh = useCallback(() => {
    setState({ kind: "loading" });
    loadSummaries().then(setState);
  }, []);

  useEffect(() => {
    // Initial load only — state already starts as "loading" (useState above), so this
    // effect only needs to kick off the async read, never a synchronous setState of
    // its own.
    loadSummaries().then(setState);
  }, []);

  const openById = useCallback(
    async (id: ProjectId) => {
      const loaded = await projectRepository.load(id);
      if (loaded.ok) openProject(id, loaded.value);
    },
    [openProject],
  );

  const handleImportFile = useCallback(
    async (file: File) => {
      setImporting(true);
      const text = await file.text();
      const result = importProjectV1(text);
      if (!result.ok) {
        setState({ kind: "error", message: result.error.map((e) => e.remediation).join("; ") });
        setImporting(false);
        return;
      }
      await projectRepository.save(result.value);
      setImporting(false);
      refresh();
    },
    [refresh],
  );

  const filtered = state.kind === "loaded" ? state.projects.filter((p) => p.name.toLowerCase().includes(search.toLowerCase())) : [];

  return (
    <div className="flex h-full flex-col bg-surface">
      <header className="flex h-16 items-center justify-between border-b border-border px-6">
        <img src="/ux-assets/logo-full.png" alt="Spaghetti LAB" className="h-8" />
        <div className="flex items-center gap-2">
          <ChromeStatus />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 rounded-slsm border border-border-strong px-3 py-1.5 text-sm font-body text-ink-muted hover:bg-surface-raised"
          >
            <Upload size={16} /> Import
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleImportFile(file);
              e.target.value = "";
            }}
          />
          <button type="button" onClick={() => openSettings()} className="flex h-9 w-9 items-center justify-center rounded-slsm text-ink-muted hover:bg-surface-raised" aria-label="Settings">
            <Settings size={18} />
          </button>
        </div>
      </header>

      {state.kind === "loaded" && state.projects.length === 0 ? (
        <EmptyState onCreate={() => setDialogOpen(true)} />
      ) : (
        <div className="flex-1 overflow-auto p-6">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex h-9 w-80 items-center gap-2 rounded-slpill border border-border-strong bg-surface-raised px-3">
              <Search size={14} className="text-ink-faint" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="cerca progetti..."
                className="w-full bg-transparent text-sm font-body outline-none placeholder:text-ink-faint"
              />
            </div>
            <button
              type="button"
              onClick={() => setDialogOpen(true)}
              className="flex items-center gap-1.5 rounded-slpill bg-brand-blue px-4 py-2 text-sm font-body-strong text-white hover:bg-brand-blue-dark"
            >
              <Plus size={16} /> Nuovo progetto
            </button>
          </div>

          {state.kind === "loading" || importing ? (
            <SkeletonGrid />
          ) : state.kind === "error" ? (
            <ErrorBanner message={state.message} onRetry={refresh} />
          ) : (
            <div className="grid grid-cols-[repeat(auto-fill,240px)] gap-4">
              <AnimatePresence>
                {filtered.map((project) => (
                  <motion.div key={project.projectId} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={motionTokens.duration.fast}>
                    <ProjectCard project={project} onOpen={() => void openById(project.projectId)} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      )}

      <NewProjectDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onCreated={(id) => {
          setDialogOpen(false);
          void openById(id);
        }}
      />
    </div>
  );
}

function EmptyState({ onCreate }: { readonly onCreate: () => void }) {
  return (
    <div
      className="flex flex-1 flex-col items-center justify-center gap-4 text-center"
      style={{
        background: "radial-gradient(circle at 20% 20%, rgba(0,196,204,0.35), transparent 40%), radial-gradient(circle at 80% 30%, rgba(125,42,232,0.30), transparent 45%)",
      }}
    >
      <FolderPlus size={48} className="text-ink-faint" />
      <h1 className="font-heading text-[28px] font-bold leading-[1.2]">Nessun progetto ancora</h1>
      <p className="max-w-sm font-body text-sm text-ink-muted">Crea il tuo primo progetto per iniziare a comporre Core, sensori e automazioni.</p>
      <button type="button" onClick={onCreate} className="mt-2 flex items-center gap-1.5 rounded-slpill bg-brand-blue px-4 py-2 text-sm font-body-strong text-white hover:bg-brand-blue-dark">
        <Plus size={16} /> Crea il tuo primo progetto
      </button>
    </div>
  );
}

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-[repeat(auto-fill,240px)] gap-4">
      {[0, 1, 2].map((i) => (
        <div key={i} className="h-[140px] w-[240px] animate-pulse rounded-slmd bg-surface-raised" />
      ))}
    </div>
  );
}

function ErrorBanner({ message, onRetry }: { readonly message: string; readonly onRetry: () => void }) {
  return (
    <div className="flex items-center justify-between rounded-slsm border-l-4 border-error bg-surface-raised p-4">
      <p className="font-body text-sm text-ink">{message}</p>
      <button type="button" onClick={onRetry} className="rounded-slsm border border-border-strong px-3 py-1.5 text-sm font-body-strong">
        Riprova
      </button>
    </div>
  );
}
