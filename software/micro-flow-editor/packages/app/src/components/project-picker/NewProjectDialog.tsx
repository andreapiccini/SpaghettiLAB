import { createEmptyProject, projectId as generateProjectId, type ProjectId } from "@spaghettilab/domain";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { motionTokens } from "../../lib/motion-tokens.js";
import { projectRepository, uuidGenerator } from "../../lib/repository.js";

/** `ux/screens/S010-workspace-shell/ui-behavior.md` § Creazione di un nuovo progetto. */
export function NewProjectDialog({ open, onClose, onCreated }: { readonly open: boolean; readonly onClose: () => void; readonly onCreated: (id: ProjectId) => void }) {
  const [name, setName] = useState("");
  const [fieldError, setFieldError] = useState<string | undefined>();
  const [remoteError, setRemoteError] = useState<string | undefined>();
  const [saving, setSaving] = useState(false);

  async function handleConfirm() {
    if (name.trim() === "") {
      setFieldError("Il nome non può essere vuoto.");
      return;
    }
    setFieldError(undefined);
    setRemoteError(undefined);

    const idResult = generateProjectId(uuidGenerator.generate());
    if (!idResult.ok) {
      setRemoteError(idResult.error.remediation);
      return;
    }
    const project = createEmptyProject(idResult.value, name.trim());
    setSaving(true);
    try {
      await projectRepository.save(project);
      setName("");
      onCreated(project.projectId);
    } catch (cause) {
      setRemoteError(cause instanceof Error ? cause.message : "Salvataggio fallito.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-50 flex items-start justify-center bg-[rgba(20,23,31,.35)] pt-24" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={motionTokens.duration.base}>
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={motionTokens.duration.base}
            className="w-[420px] rounded-sllg bg-surface p-6 shadow-e3"
          >
            <h2 className="mb-4 font-heading text-lg font-semibold">Nuovo progetto</h2>
            <label className="mb-1 block font-body text-sm font-semibold text-ink" htmlFor="new-project-name">
              Nome progetto
            </label>
            <input
              id="new-project-name"
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") void handleConfirm();
                if (e.key === "Escape") onClose();
              }}
              className={`w-full rounded-slsm border px-3 py-2 font-body text-sm outline-none ${fieldError ? "border-error" : "border-border-strong"}`}
            />
            {fieldError && <p className="mt-1 font-body text-xs text-error">{fieldError}</p>}
            {remoteError && <p className="mt-1 font-body text-xs text-error">{remoteError}</p>}
            <div className="mt-6 flex justify-end gap-2">
              <button type="button" onClick={onClose} className="rounded-slsm px-4 py-2 font-body text-sm text-ink-muted hover:bg-surface-raised">
                Annulla
              </button>
              <button type="button" onClick={() => void handleConfirm()} disabled={saving} className="rounded-slsm bg-brand-blue px-4 py-2 font-body-strong text-sm text-white hover:bg-brand-blue-dark disabled:opacity-50">
                {saving ? "Creazione..." : "Crea progetto"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
