import { describe, expect, it } from "vitest";
import { exportProfilePackage, exportProfilePackageJson, importProfilePackageJson } from "@spaghettilab/device-profile-package";
import { PortTransport, validateDeviceProfile, type DeviceProfileDraft } from "@spaghettilab/device-profile-authoring-model";

function draft(overrides: Partial<DeviceProfileDraft> = {}): DeviceProfileDraft {
  return {
    profileId: "sensor.example",
    version: 1,
    transport: PortTransport.I2C,
    requiredCapabilities: 0,
    maxTotalTimeMs: 100,
    maxTransactions: 5,
    maxBytes: 16,
    initOps: [],
    sampleOps: [{ op: "EMIT_RECORD" }],
    safeStopOps: [],
    sampleSchemaId: "sensor.example.sample",
    sampleSchemaVersion: 1,
    sampleFields: [],
    ...overrides,
  };
}

describe("malicious Device Profile threat test — S124 § Verifiche", () => {
  it("rejects a profile whose budget is exceeded by its own declared ops before it could ever be considered for install", () => {
    const oversized = draft({
      maxTransactions: 1,
      sampleOps: [
        { op: "I2C_WRITE", src: 0, length: 1, timeoutMs: 20 },
        { op: "I2C_WRITE", src: 0, length: 1, timeoutMs: 20 },
        { op: "EMIT_RECORD" },
      ],
    });
    const result = validateDeviceProfile(oversized);
    expect(result.ok).toBe(false);
  });

  it("rejects a package whose declared hash does not match its content — a forged/tampered profile, never trusted on hash claim alone", () => {
    const pkg = exportProfilePackage(draft(), "attacker");
    const json = exportProfilePackageJson(pkg);
    const tampered = JSON.parse(json);
    tampered.draft.maxBytes = 999999; // mutate content after the hash was computed
    const result = importProfilePackageJson(JSON.stringify(tampered));
    expect(result.ok).toBe(false);
  });

  it("rejects an oversized import payload for a Device Profile package before any parsing", async () => {
    const { MAX_PACKAGE_IMPORT_BYTES } = await import("@spaghettilab/device-profile-package");
    const huge = "x".repeat(MAX_PACKAGE_IMPORT_BYTES + 1);
    const result = importProfilePackageJson(huge);
    expect(result.ok).toBe(false);
  });
});
