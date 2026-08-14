import { exportProjectSelective, previewProjectImport, projectId, resolveProjectImportId, type ProjectImportPreview } from "@spaghettilab/domain";
import { AlertTriangle, Download, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { projectRepository, uuidGenerator } from "../../lib/repository.js";
import { useSession } from "../../state/session-context.js";

/**
 * `ux/screens/S120-settings-security/visual.md` § Import/Export, cablato su
 * `@spaghettilab/domain`'s `previewProjectImport`/`resolveProjectImportId`/
 * `exportProjectSelective` (S123, reale) — mai un'importazione silenziosa,
 * l'anteprima è obbligatoria prima di importare. Gap dichiarato:
 * `includeImages`/`includeLiveRecords` sono accettati da
 * `exportProjectSelective` ma strutturalmente inerti oggi — `ProjectV1` non
 * ha ancora campi immagine/record live (nessuno screen li scrive), come
 * documentato dal pacchetto stesso.
 */
export function ImportExportTab() {
  const { session } = useSession();
  const [preview, setPreview] = useState<ProjectImportPreview | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [includeImages, setIncludeImages] = useState(false);
  const [includeLiveRecords, setIncludeLiveRecords] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleImportFile(file: File) {
    setImportError(null);
    const text = await file.text();
    const rawIds = await projectRepository.listProjectIds();
    const existingIds = rawIds.map((id) => projectId(id)).filter((r) => r.ok).map((r) => r.value);
    const result = previewProjectImport(text, existingIds);
    if (!result.ok) {
      setImportError(result.error.map((e) => e.remediation).join("; "));
      return;
    }
    setPreview(result.value);
  }

  async function handleConfirmImport(decision: "rename" | "keep") {
    if (!preview) return;
    const resolved = resolveProjectImportId(preview, decision, uuidGenerator);
    await projectRepository.save(resolved);
    setPreview(null);
  }

  function handleExport() {
    if (!session) return;
    const result = exportProjectSelective(session.stack.current, { includeImages, includeLiveRecords });
    const blob = new Blob([result.json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${session.stack.current.name || session.projectId}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const exportPreview = session ? exportProjectSelective(session.stack.current, { includeImages, includeLiveRecords }) : null;

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h2 className="font-heading text-sm font-semibold text-ink">Importa progetto</h2>
        <button type="button" onClick={() => fileInputRef.current?.click()} className="mt-2 flex items-center gap-1.5 rounded-slpill border border-border-strong px-3 py-1.5 font-body-strong text-xs text-ink hover:bg-surface-raised">
          <Upload size={12} />
          Scegli file
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
        {importError && <p className="mt-2 font-body text-xs text-error">{importError}</p>}

        {preview && (
          <div className="mt-3 flex flex-col gap-2 rounded-slmd border border-border p-3">
            <p className="font-body text-sm text-ink">
              <span className="font-mono">{preview.project.name}</span> — {preview.project.coreBindings.length} Core
            </p>
            {preview.isDuplicateId && (
              <div className="flex items-center gap-2 text-warning">
                <AlertTriangle size={14} />
                <p className="font-body text-xs">ID progetto già esistente — scegli come procedere.</p>
              </div>
            )}
            <div className="flex gap-2">
              {preview.isDuplicateId ? (
                <>
                  <button type="button" onClick={() => void handleConfirmImport("rename")} className="rounded-slsm bg-brand-blue px-3 py-1.5 font-body-strong text-xs text-white hover:bg-brand-blue-dark">
                    Importa con nuovo ID
                  </button>
                  <button type="button" onClick={() => void handleConfirmImport("keep")} className="rounded-slsm border border-border-strong px-3 py-1.5 font-body-strong text-xs text-ink hover:bg-surface-raised">
                    Sovrascrivi esistente
                  </button>
                </>
              ) : (
                <button type="button" onClick={() => void handleConfirmImport("keep")} className="rounded-slsm bg-brand-blue px-3 py-1.5 font-body-strong text-xs text-white hover:bg-brand-blue-dark">
                  Importa
                </button>
              )}
              <button type="button" onClick={() => setPreview(null)} className="rounded-slsm border border-border-strong px-3 py-1.5 font-body-strong text-xs text-ink-muted hover:bg-surface-raised">
                Annulla
              </button>
            </div>
          </div>
        )}
      </div>

      <div>
        <h2 className="font-heading text-sm font-semibold text-ink">Esporta progetto</h2>
        {!session ? (
          <p className="mt-2 font-body text-sm text-ink-faint">Nessun progetto aperto.</p>
        ) : (
          <>
            <div className="mt-2 flex flex-col gap-1 rounded-slmd border border-border p-3">
              <p className="font-body-strong text-xs text-ink-muted">Escluso automaticamente</p>
              <p className="font-body text-xs text-ink-faint">Credenziali, valori record live — mai inclusi, nessuna opzione per abilitarli.</p>
            </div>
            <label className="mt-2 flex items-center gap-2">
              <input type="checkbox" checked={includeImages} onChange={(e) => setIncludeImages(e.target.checked)} />
              <span className="font-body text-sm text-ink">Includi immagini</span>
              <span className="font-body text-xs text-ink-faint">(inerte oggi — ProjectV1 non ha ancora campi immagine)</span>
            </label>
            <label className="mt-1 flex items-center gap-2">
              <input type="checkbox" checked={includeLiveRecords} onChange={(e) => setIncludeLiveRecords(e.target.checked)} />
              <span className="font-body text-sm text-ink">Includi record live più recenti</span>
              <span className="font-body text-xs text-ink-faint">(inerte oggi — ProjectV1 non ha ancora campi record live)</span>
            </label>
            {exportPreview && exportPreview.suspiciousKeysFound.length > 0 && (
              <div className="mt-2 flex items-center gap-2 text-warning">
                <AlertTriangle size={14} />
                <p className="font-body text-xs">{exportPreview.suspiciousKeysFound.length} chiavi dall'aspetto sospetto (segreto?) trovate — verificale prima di condividere l'export.</p>
              </div>
            )}
            <button type="button" onClick={handleExport} className="mt-3 flex items-center gap-1.5 rounded-slpill bg-brand-blue px-4 py-1.5 font-body-strong text-sm text-white hover:bg-brand-blue-dark">
              <Download size={14} />
              Scarica export
            </button>
          </>
        )}
      </div>
    </div>
  );
}
