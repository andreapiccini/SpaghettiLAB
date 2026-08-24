import { describe, expect, it } from "vitest";
import {
  findSettingsCategory,
  groupSettingsCategories,
  isSettingsCategoryVisible,
  searchSettingsCategories,
  SETTINGS_CATEGORIES,
  SETTINGS_CATEGORY_IDS,
} from "../settings-catalog.js";

describe("settings catalog", () => {
  it("has unique ids covering the declared union", () => {
    const ids = SETTINGS_CATEGORIES.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toEqual([...SETTINGS_CATEGORY_IDS]);
  });

  it("hides advanced-only categories in base mode", () => {
    expect(isSettingsCategoryVisible(findSettingsCategory("permissions")!, "base")).toBe(false);
    expect(isSettingsCategoryVisible(findSettingsCategory("general")!, "base")).toBe(true);
    expect(searchSettingsCategories("", "base", () => "").some((c) => c.id === "audit")).toBe(false);
    expect(searchSettingsCategories("", "advanced", () => "").some((c) => c.id === "audit")).toBe(true);
  });

  it("searches ids, keywords and extra text", () => {
    const hits = searchSettingsCategories("bandiera", "base", (c) => (c.id === "language" ? "Lingua" : ""));
    expect(hits.map((c) => c.id)).toEqual(["language"]);
    expect(searchSettingsCategories("1880", "base", () => "").map((c) => c.id)).toEqual(["nodered"]);
  });

  it("groups without empty sections", () => {
    const groups = groupSettingsCategories(SETTINGS_CATEGORIES);
    expect(groups.every((g) => g.categories.length > 0)).toBe(true);
    expect(groups.some((g) => g.groupId === "application")).toBe(true);
  });
});
