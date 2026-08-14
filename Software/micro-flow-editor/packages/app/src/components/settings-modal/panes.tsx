import type { ComponentType } from "react";
import type { SettingsCategoryId } from "../../lib/settings-catalog.js";
import { AuditTab } from "../settings-security/AuditTab.js";
import { BackupVersionsTab } from "../settings-security/BackupVersionsTab.js";
import { CredentialsTab } from "../settings-security/CredentialsTab.js";
import { ImportExportTab } from "../settings-security/ImportExportTab.js";
import { PermissionsTab } from "../settings-security/PermissionsTab.js";
import { RecoveryTab } from "../settings-security/RecoveryTab.js";
import { ComingSoonPane } from "./ComingSoonPane.js";
import { GeneralPane } from "./panes/GeneralPane.js";
import { LanguagePane } from "./panes/LanguagePane.js";
import { NodeRedPane } from "./panes/NodeRedPane.js";

function Planned({ categoryId }: { readonly categoryId: SettingsCategoryId }) {
  return <ComingSoonPane categoryId={categoryId} />;
}

/** Map catalog ids to panes. Existing S120 tabs are reused, not rewritten. */
export const SETTINGS_PANES: Record<SettingsCategoryId, ComponentType> = {
  general: GeneralPane,
  language: LanguagePane,
  appearance: () => <Planned categoryId="appearance" />,
  credentials: CredentialsTab,
  permissions: PermissionsTab,
  audit: AuditTab,
  recovery: RecoveryTab,
  privacy: () => <Planned categoryId="privacy" />,
  backup: BackupVersionsTab,
  "import-export": ImportExportTab,
  nodered: NodeRedPane,
  updates: () => <Planned categoryId="updates" />,
  editor: () => <Planned categoryId="editor" />,
  keyboard: () => <Planned categoryId="keyboard" />,
  notifications: () => <Planned categoryId="notifications" />,
};
