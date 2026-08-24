import type { UiMode } from "./ui-mode.js";

/**
 * Registry of settings categories. Add a row here (and a pane or `planned`)
 * to grow the modal — no shell or TopBar changes required.
 */
export const SETTINGS_GROUP_IDS = ["application", "security", "project", "runtime", "editor"] as const;
export type SettingsGroupId = (typeof SETTINGS_GROUP_IDS)[number];

export const SETTINGS_CATEGORY_IDS = [
  "general",
  "language",
  "appearance",
  "credentials",
  "permissions",
  "audit",
  "recovery",
  "privacy",
  "backup",
  "import-export",
  "nodered",
  "core-catalog",
  "updates",
  "editor",
  "keyboard",
  "notifications",
] as const;
export type SettingsCategoryId = (typeof SETTINGS_CATEGORY_IDS)[number];

export type SettingsCategoryDef = {
  readonly id: SettingsCategoryId;
  readonly groupId: SettingsGroupId;
  readonly keywords: readonly string[];
  readonly availability: "always" | "advanced";
  readonly status: "ready" | "planned";
};

export const SETTINGS_CATEGORIES: readonly SettingsCategoryDef[] = [
  { id: "general", groupId: "application", keywords: ["mode", "modalità", "base", "avanzata", "advanced", "ui"], availability: "always", status: "ready" },
  { id: "language", groupId: "application", keywords: ["lingua", "language", "locale", "flag", "bandiera"], availability: "always", status: "ready" },
  { id: "appearance", groupId: "application", keywords: ["tema", "theme", "dark", "chiaro", "aspetto"], availability: "always", status: "planned" },
  { id: "credentials", groupId: "security", keywords: ["credenziali", "secret", "token", "password"], availability: "always", status: "ready" },
  { id: "permissions", groupId: "security", keywords: ["permessi", "scope", "rbac"], availability: "advanced", status: "ready" },
  { id: "audit", groupId: "security", keywords: ["audit", "log", "registro"], availability: "advanced", status: "ready" },
  { id: "recovery", groupId: "security", keywords: ["recovery", "ripristino", "disaster"], availability: "advanced", status: "ready" },
  { id: "privacy", groupId: "security", keywords: ["privacy", "dati", "telemetry"], availability: "always", status: "planned" },
  { id: "backup", groupId: "project", keywords: ["backup", "versioni", "autosave"], availability: "always", status: "ready" },
  { id: "import-export", groupId: "project", keywords: ["import", "export", "json"], availability: "always", status: "ready" },
  { id: "nodered", groupId: "runtime", keywords: ["node-red", "automazioni", "1880", "host"], availability: "always", status: "ready" },
  { id: "core-catalog", groupId: "runtime", keywords: ["catalogo", "driver", "get_catalog", "core", "moduli"], availability: "always", status: "ready" },
  { id: "updates", groupId: "runtime", keywords: ["update", "aggiornamenti", "release"], availability: "always", status: "planned" },
  { id: "editor", groupId: "editor", keywords: ["griglia", "snap", "graph", "canvas"], availability: "always", status: "planned" },
  { id: "keyboard", groupId: "editor", keywords: ["shortcut", "tastiera", "hotkey"], availability: "always", status: "planned" },
  { id: "notifications", groupId: "editor", keywords: ["notifiche", "alert", "toast"], availability: "always", status: "planned" },
];

export function isSettingsCategoryVisible(category: SettingsCategoryDef, mode: UiMode): boolean {
  return category.availability === "always" || mode === "advanced";
}

export function findSettingsCategory(id: string): SettingsCategoryDef | undefined {
  return SETTINGS_CATEGORIES.find((category) => category.id === id);
}

export function searchSettingsCategories(
  query: string,
  mode: UiMode,
  extraText: (category: SettingsCategoryDef) => string,
): readonly SettingsCategoryDef[] {
  const visible = SETTINGS_CATEGORIES.filter((category) => isSettingsCategoryVisible(category, mode));
  const q = query.trim().toLowerCase();
  if (q === "") return visible;
  return visible.filter((category) => {
    const haystack = [category.id, category.groupId, extraText(category), ...category.keywords].join(" ").toLowerCase();
    return haystack.includes(q);
  });
}

export function groupSettingsCategories(
  categories: readonly SettingsCategoryDef[],
): readonly { readonly groupId: SettingsGroupId; readonly categories: readonly SettingsCategoryDef[] }[] {
  return SETTINGS_GROUP_IDS.map((groupId) => ({
    groupId,
    categories: categories.filter((category) => category.groupId === groupId),
  })).filter((group) => group.categories.length > 0);
}
