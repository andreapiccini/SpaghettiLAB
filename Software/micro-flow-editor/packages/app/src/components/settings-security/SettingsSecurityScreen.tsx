import { useState } from "react";
import { useUiMode } from "../../state/ui-mode-context.js";
import { AuditTab } from "./AuditTab.js";
import { BackupVersionsTab } from "./BackupVersionsTab.js";
import { CredentialsTab } from "./CredentialsTab.js";
import { ImportExportTab } from "./ImportExportTab.js";
import { InterfaceTab } from "./InterfaceTab.js";
import { PermissionsTab } from "./PermissionsTab.js";
import { RecoveryTab } from "./RecoveryTab.js";

const BASE_TABS = [
  { id: "interfaccia", label: "Interfaccia" },
  { id: "credenziali", label: "Credenziali" },
  { id: "backup", label: "Backup & Versioni" },
  { id: "import-export", label: "Import/Export" },
] as const;
const ADVANCED_TABS = [
  { id: "permessi", label: "Permessi" },
  { id: "audit", label: "Audit" },
  { id: "recovery", label: "Recovery" },
] as const;
type TabId = (typeof BASE_TABS)[number]["id"] | (typeof ADVANCED_TABS)[number]["id"];

/**
 * `ux/screens/S120-settings-security/{visual,ui-behavior,backend-behavior}.md`,
 * cablato su `@spaghettilab/security-recovery` (S124), `domain/permission.ts`
 * (S121), `project-store`'s `ProjectAutosaveStore` (S122) e
 * `domain/project-import-export.ts` (S123) — tutti reali, contrariamente alla
 * nota "⬜ TODO" stantia del `backend-behavior.md` (S121-S124 sono tutti
 * ✅ DONE nel roadmap backend, stesso pattern visto per ogni screen
 * precedente tranne S104). Permessi/Audit/Recovery restano nascosti in
 * modalità base (S125), come i visual.md richiede.
 */
export function SettingsSecurityScreen() {
  const { mode } = useUiMode();
  const [tab, setTab] = useState<TabId>("interfaccia");
  const tabs = mode === "advanced" ? [...BASE_TABS, ...ADVANCED_TABS] : BASE_TABS;

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex h-14 shrink-0 items-center gap-3 border-b border-border bg-surface px-4">
        <h1 className="font-heading text-lg font-semibold text-ink">Sicurezza e recupero</h1>
      </div>

      <div className="flex shrink-0 flex-wrap gap-1 border-b border-border bg-surface px-4">
        {tabs.map((t) => {
          const active = tab === t.id;
          return (
            <button key={t.id} type="button" onClick={() => setTab(t.id)} className="flex items-center gap-1.5 border-b-2 px-3 py-2.5 font-body text-sm" style={{ borderColor: active ? "var(--color-brand-blue)" : "transparent", color: active ? "var(--color-brand-blue)" : "var(--color-ink-muted)" }}>
              {t.label}
            </button>
          );
        })}
      </div>

      <div className="flex-1 overflow-auto">
        {tab === "interfaccia" && <InterfaceTab />}
        {tab === "credenziali" && <CredentialsTab />}
        {tab === "backup" && <BackupVersionsTab />}
        {tab === "import-export" && <ImportExportTab />}
        {tab === "permessi" && <PermissionsTab />}
        {tab === "audit" && <AuditTab />}
        {tab === "recovery" && <RecoveryTab />}
      </div>
    </div>
  );
}
