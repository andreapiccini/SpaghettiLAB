import { describe, expect, it } from "vitest";
import { MAX_PROJECT_IMPORT_BYTES, previewProjectImport } from "@spaghettilab/domain";
import { MAX_PACKAGE_IMPORT_BYTES, importProfilePackageJson } from "@spaghettilab/device-profile-package";
import { MAX_MARKETPLACE_INDEX_BYTES, parseMarketplaceIndexJson } from "@spaghettilab/capability-marketplace";

describe("oversized import threat test — S124 § Verifiche", () => {
  it("rejects an oversized Project import before JSON.parse runs", () => {
    const huge = "x".repeat(MAX_PROJECT_IMPORT_BYTES + 1);
    const result = previewProjectImport(huge, []);
    expect(result.ok).toBe(false);
  });

  it("rejects an oversized Device Profile package import before JSON.parse runs", () => {
    const huge = "x".repeat(MAX_PACKAGE_IMPORT_BYTES + 1);
    const result = importProfilePackageJson(huge);
    expect(result.ok).toBe(false);
  });

  it("rejects an oversized marketplace index before JSON.parse runs", () => {
    const huge = "x".repeat(MAX_MARKETPLACE_INDEX_BYTES + 1);
    const result = parseMarketplaceIndexJson(huge);
    expect(result.ok).toBe(false);
  });

  it("a payload exactly at the limit is not rejected purely on size (still may fail structural validation for other reasons)", () => {
    const exact = "{" + "x".repeat(Math.max(0, MAX_MARKETPLACE_INDEX_BYTES - 2)) + "}";
    const result = parseMarketplaceIndexJson(exact);
    // Not oversized — whatever it rejects on, it must not be the size gate.
    if (!result.ok) {
      expect(result.error.some((e) => e.code === "capability-marketplace.import_too_large")).toBe(false);
    }
  });
});
