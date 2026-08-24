import { exportProfilePackage } from "@spaghettilab/device-profile-package";
import type { DeviceProfileDraft } from "@spaghettilab/device-profile-authoring-model";
import type { DeviceProfileSummary } from "@spaghettilab/protocol-sdk";
import { describe, expect, it } from "vitest";
import type { MarketplaceCatalog } from "../marketplace-catalog.js";
import { resolveProfileRequirement } from "../profile-resolver.js";

const DRAFT: DeviceProfileDraft = {
  profileId: "ina219-raw",
  version: 1,
  transport: 1,
  requiredCapabilities: 0,
  maxTotalTimeMs: 100,
  maxTransactions: 4,
  maxBytes: 64,
  initOps: [],
  sampleOps: [],
  safeStopOps: [],
  sampleSchemaId: "ina219-raw",
  sampleSchemaVersion: 1,
  sampleFields: [],
};

function catalogWith(profiles: MarketplaceCatalog["profiles"]): MarketplaceCatalog {
  return { indexHash: "h", packs: [], profiles, skipped: [] };
}

describe("resolveProfileRequirement — S104", () => {
  it("reports NOT_FOUND when no marketplace entry provides the profile", () => {
    const result = resolveProfileRequirement("ina219-raw", catalogWith([]), { installedProfiles: [] });
    expect(result.kind).toBe("NOT_FOUND");
  });

  it("reuses S062's own resolveProfileInstall outcome verbatim — READY when an identical version is already installed", () => {
    const pkg = exportProfilePackage(DRAFT, "author");
    const installed: readonly DeviceProfileSummary[] = [{ profileId: "ina219-raw", version: 1, hash: new Uint8Array(0) }];
    const result = resolveProfileRequirement("ina219-raw", catalogWith([pkg]), { installedProfiles: installed }, { matchesInstalled: () => true, trustVerifier: () => true });
    expect(result.kind).toBe("RESOLVED");
    if (result.kind === "RESOLVED") expect(result.install.kind).toBe("READY");
  });

  it("never arms an OTA — FIRMWARE_UPDATE_REQUIRED is returned as data, not a triggered transfer", () => {
    const opcodeDraft: DeviceProfileDraft = { ...DRAFT, initOps: [{ op: "GPIO_GET", dst: 0 }] };
    const pkg = exportProfilePackage(opcodeDraft, "author");
    const result = resolveProfileRequirement("ina219-raw", catalogWith([pkg]), { installedProfiles: [], knownOpcodes: new Set() }, { trustVerifier: () => true });
    expect(result.kind).toBe("RESOLVED");
    if (result.kind === "RESOLVED") {
      expect(result.install.kind).toBe("FIRMWARE_UPDATE_REQUIRED");
      expect(result.install.missingOpcodes && result.install.missingOpcodes.length).toBeGreaterThan(0);
    }
  });

  it("picks the highest version when multiple versions of the same profile are in the catalog", () => {
    const v1 = exportProfilePackage(DRAFT, "author");
    const v2 = exportProfilePackage({ ...DRAFT, version: 2 }, "author");
    const result = resolveProfileRequirement("ina219-raw", catalogWith([v1, v2]), { installedProfiles: [] }, { trustVerifier: () => true });
    expect(result.kind).toBe("RESOLVED");
    if (result.kind === "RESOLVED") expect(result.manifest.version).toBe(2);
  });

  it("never resolves an untrusted profile — no default-trust fallback, same as an untrusted firmware pack", () => {
    const pkg = exportProfilePackage(DRAFT, "author");
    const result = resolveProfileRequirement("ina219-raw", catalogWith([pkg]), { installedProfiles: [] }, { trustVerifier: () => false });
    expect(result.kind).toBe("UNTRUSTED");
  });

  it("never resolves a profile at all when no trust verifier is supplied — unverifiable is never treated as trusted", () => {
    const pkg = exportProfilePackage(DRAFT, "author");
    const result = resolveProfileRequirement("ina219-raw", catalogWith([pkg]), { installedProfiles: [] });
    expect(result.kind).toBe("UNTRUSTED");
  });
});
