import { exportProfilePackageJson, importProfilePackageJson, type DeviceProfilePackage } from "@spaghettilab/device-profile-package";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { motionTokens } from "../../lib/motion-tokens.js";

function PackagePreview({ pkg }: { readonly pkg: DeviceProfilePackage }) {
  return (
    <div className="mt-3 flex flex-col gap-1 rounded-slsm bg-surface-sunken p-3 font-mono text-xs text-ink">
      <div>ID: {pkg.profileId}</div>
      <div>Versione: {pkg.version}</div>
      <div>Hash: {pkg.hash}</div>
      <div>Autore: {pkg.author}</div>
      <div>Dipendenze opcode: {pkg.opcodeDependencies.join(", ") || "nessuna"}</div>
      <div>
        Step: {pkg.draft.initOps.length} init · {pkg.draft.sampleOps.length} sample · {pkg.draft.safeStopOps.length} safe-stop
      </div>
      <div>Campi output: {pkg.draft.sampleFields.length}</div>
    </div>
  );
}

/**
 * `ux/screens/S060-device-profile-studio/visual.md` § Dialogo import/export — mai
 * un'importazione silenziosa: l'anteprima è obbligatoria prima di "Importa"/
 * conferma download, in entrambi i casi calcolata dal package reale
 * (`exportProfilePackageJson`/`importProfilePackageJson`), mai ricostruita a parte
 * lato UI.
 */
export function ImportExportDialog({ mode, exportPackage, onImport, onClose }: { readonly mode: "import" | "export"; readonly exportPackage?: DeviceProfilePackage; readonly onImport: (pkg: DeviceProfilePackage) => void; readonly onClose: () => void }) {
  const [text, setText] = useState("");
  const [imported, setImported] = useState<DeviceProfilePackage | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleParse() {
    const result = importProfilePackageJson(text);
    if (!result.ok) {
      setError(result.error.remediation);
      setImported(null);
      return;
    }
    setError(null);
    setImported(result.value);
  }

  function handleDownload() {
    if (!exportPackage) return;
    const json = exportProfilePackageJson(exportPackage);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${exportPackage.profileId}@${exportPackage.version}.json`;
    a.click();
    URL.revokeObjectURL(url);
    onClose();
  }

  return (
    <AnimatePresence>
      <motion.div className="fixed inset-0 z-50 flex justify-center bg-[rgba(20,23,31,.35)] pt-24" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={motionTokens.duration.base} onClick={onClose}>
        <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.97 }} transition={motionTokens.spring.smooth} onClick={(e) => e.stopPropagation()} className="h-fit max-h-[70vh] w-[520px] overflow-auto rounded-sllg bg-surface p-6 shadow-e3">
          <h2 className="mb-4 font-heading text-lg font-semibold text-ink">{mode === "export" ? "Esporta profilo" : "Importa profilo"}</h2>

          {mode === "export" ? (
            exportPackage && <PackagePreview pkg={exportPackage} />
          ) : (
            <>
              <textarea value={text} onChange={(e) => setText(e.target.value)} rows={8} placeholder="Incolla qui il JSON del pacchetto..." className="w-full rounded-slsm border border-border-strong p-2 font-mono text-xs outline-none" />
              <button type="button" onClick={handleParse} className="mt-2 rounded-slsm border border-border-strong px-3 py-1.5 font-body text-sm text-ink hover:bg-surface-raised">
                Analizza
              </button>
              {error && <p className="mt-2 font-body text-xs text-error">{error}</p>}
              {imported && <PackagePreview pkg={imported} />}
            </>
          )}

          <div className="mt-6 flex justify-end gap-2">
            <button type="button" onClick={onClose} className="rounded-slsm px-4 py-2 font-body text-sm text-ink-muted hover:bg-surface-raised">
              Annulla
            </button>
            {mode === "export" ? (
              <button type="button" onClick={handleDownload} disabled={!exportPackage} className="rounded-slsm bg-brand-blue px-4 py-2 font-body-strong text-sm text-white hover:bg-brand-blue-dark disabled:opacity-50">
                Scarica
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  if (imported) {
                    onImport(imported);
                    onClose();
                  }
                }}
                disabled={!imported}
                className="rounded-slsm bg-brand-blue px-4 py-2 font-body-strong text-sm text-white hover:bg-brand-blue-dark disabled:opacity-50"
              >
                Importa
              </button>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
