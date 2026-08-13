import type { DeviceProfileDraft } from "@spaghettilab/device-profile-authoring-model";
import { PortCapability, PortTransport } from "@spaghettilab/device-profile-authoring-model";
import type { DeviceProfileSummary, GetResourcesResponse } from "@spaghettilab/protocol-sdk";
import { describe, expect, it } from "vitest";
import { exportProfilePackage } from "../package.js";
import { InstallResolution, resolveProfileInstall, type CoreInstallContext } from "../resolver.js";

function draft(overrides: Partial<DeviceProfileDraft> = {}): DeviceProfileDraft {
  return {
    profileId: "sensor.example",
    version: 1,
    transport: PortTransport.I2C,
    requiredCapabilities: PortCapability.I2C,
    maxTotalTimeMs: 100,
    maxTransactions: 5,
    maxBytes: 16,
    initOps: [{ op: "I2C_WRITE", src: 0, length: 1, timeoutMs: 20 }],
    sampleOps: [
      { op: "I2C_READ", dst: 1, length: 2, timeoutMs: 20 },
      { op: "EMIT_FIELD", src: 1, fieldId: 1 },
      { op: "EMIT_RECORD" },
    ],
    safeStopOps: [],
    sampleSchemaId: "sensor.example.sample",
    sampleSchemaVersion: 1,
    sampleFields: [{ fieldId: 1, type: "uint64", name: "value" }],
    ...overrides,
  };
}

const emptyResources: GetResourcesResponse = {
  featureSetHash: new Uint8Array(),
  modules: { capacity: 8, used: 0, peak: 0 },
  rules: { capacity: 8, used: 0, peak: 0 },
  blocks: { capacity: 8, used: 0, peak: 0 },
  profiles: { capacity: 4, used: 0, peak: 0 },
  records: { capacity: 8, used: 0, peak: 0 },
  workspace: { capacity: 8, used: 0, peak: 0 },
  allocationFailures: 0,
  flashSlotBytes: 1048576,
  flashImageBudgetBytes: 786432,
  flashHeadroomBytes: 262144,
  staticRamBudgetBytes: 65536,
};

const baseContext: CoreInstallContext = { installedProfiles: [], availableCapabilities: PortCapability.I2C, resources: emptyResources };

describe("resolveProfileInstall — S062 § Verifiche", () => {
  it("PROFILE_INSTALL_REQUIRED when nothing blocks and it isn't installed yet", () => {
    const pkg = exportProfilePackage(draft(), "andrea");
    const result = resolveProfileInstall(pkg, baseContext);
    expect(result.kind).toBe(InstallResolution.PROFILE_INSTALL_REQUIRED);
  });

  it("FIRMWARE_UPDATE_REQUIRED proposes a Capability Pack and never attempts a data install", () => {
    const pkg = exportProfilePackage(draft(), "andrea");
    const tampered = { ...pkg, opcodeDependencies: [...pkg.opcodeDependencies, 999] };
    const result = resolveProfileInstall(tampered, baseContext, {
      capabilityPackForOpcode: (opcode) => (opcode === 999 ? "pack.exotic-transport" : undefined),
    });
    expect(result.kind).toBe(InstallResolution.FIRMWARE_UPDATE_REQUIRED);
    expect(result.missingOpcodes).toEqual([999]);
    expect(result.suggestedCapabilityPacks).toEqual(["pack.exotic-transport"]);
  });

  it("import of a package with declared opcode dependencies not installed resolves to FIRMWARE_UPDATE_REQUIRED, not a false READY", () => {
    const pkg = exportProfilePackage(draft(), "andrea");
    const declaresUnknownOpcode = { ...pkg, opcodeDependencies: [...pkg.opcodeDependencies, 12345] };
    const context: CoreInstallContext = {
      ...baseContext,
      installedProfiles: [{ profileId: pkg.profileId, version: pkg.version, hash: new Uint8Array([1, 2, 3]) }],
    };
    const result = resolveProfileInstall(declaresUnknownOpcode, context, { matchesInstalled: () => true });
    expect(result.kind).toBe(InstallResolution.FIRMWARE_UPDATE_REQUIRED);
  });

  it("HARDWARE_INCOMPATIBLE when the target Port/Bay lacks a required capability", () => {
    const pkg = exportProfilePackage(draft({ requiredCapabilities: PortCapability.SPI }), "andrea");
    const result = resolveProfileInstall(pkg, { ...baseContext, availableCapabilities: PortCapability.I2C });
    expect(result.kind).toBe(InstallResolution.HARDWARE_INCOMPATIBLE);
  });

  it("READY when the same id+version is installed and matchesInstalled confirms it", () => {
    const pkg = exportProfilePackage(draft(), "andrea");
    const installed: DeviceProfileSummary = { profileId: pkg.profileId, version: pkg.version, hash: new Uint8Array([9]) };
    const result = resolveProfileInstall(pkg, { ...baseContext, installedProfiles: [installed] }, { matchesInstalled: () => true });
    expect(result.kind).toBe(InstallResolution.READY);
  });

  it("VERSION_CONFLICT when the same id+version is installed but content cannot be confirmed matching", () => {
    const pkg = exportProfilePackage(draft(), "andrea");
    const installed: DeviceProfileSummary = { profileId: pkg.profileId, version: pkg.version, hash: new Uint8Array([9]) };
    const result = resolveProfileInstall(pkg, { ...baseContext, installedProfiles: [installed] });
    expect(result.kind).toBe(InstallResolution.VERSION_CONFLICT);
  });

  it("RESOURCE_INCOMPATIBLE when the Core has no free profile slot", () => {
    const pkg = exportProfilePackage(draft(), "andrea");
    const fullResources: GetResourcesResponse = { ...emptyResources, profiles: { capacity: 2, used: 2, peak: 2 } };
    const result = resolveProfileInstall(pkg, { ...baseContext, resources: fullResources });
    expect(result.kind).toBe(InstallResolution.RESOURCE_INCOMPATIBLE);
  });

  it("skips the hardware check when availableCapabilities is omitted, and the resource check when resources is omitted", () => {
    const pkg = exportProfilePackage(draft({ requiredCapabilities: PortCapability.SPI }), "andrea");
    const result = resolveProfileInstall(pkg, { installedProfiles: [] });
    expect(result.kind).toBe(InstallResolution.PROFILE_INSTALL_REQUIRED);
  });
});
