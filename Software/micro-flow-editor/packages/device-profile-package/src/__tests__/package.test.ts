import type { DeviceProfileDraft } from "@spaghettilab/device-profile-authoring-model";
import { PortTransport } from "@spaghettilab/device-profile-authoring-model";
import { describe, expect, it } from "vitest";
import { MAX_PACKAGE_IMPORT_BYTES, exportProfilePackage, exportProfilePackageJson, importProfilePackageJson } from "../package.js";

function draft(): DeviceProfileDraft {
  return {
    profileId: "sensor.example",
    version: 1,
    transport: PortTransport.I2C,
    requiredCapabilities: 0,
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
  };
}

describe("exportProfilePackage — S062 point 2", () => {
  it("computes opcodeDependencies from the draft's actual ops, sorted and deduplicated", () => {
    const pkg = exportProfilePackage(draft(), "andrea");
    // I2C_WRITE=1, I2C_READ=2, EMIT_FIELD=21, EMIT_RECORD=22
    expect(pkg.opcodeDependencies).toEqual([1, 2, 21, 22]);
  });

  it("a profile exported and reimported produces the same hash", () => {
    const pkg = exportProfilePackage(draft(), "andrea");
    const json = exportProfilePackageJson(pkg);
    const reimported = importProfilePackageJson(json);
    expect(reimported.ok).toBe(true);
    if (reimported.ok) {
      expect(reimported.value.hash).toBe(pkg.hash);
      const reExported = exportProfilePackageJson(reimported.value);
      expect(reExported).toBe(json);
    }
  });
});

describe("importProfilePackageJson", () => {
  it("never executes anything — malformed JSON produces a structured error, not a thrown SyntaxError", () => {
    const result = importProfilePackageJson("{not json");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("device-profile-package.malformed_json");
  });

  it("rejects a payload over the size limit before parsing", () => {
    const huge = `{"padding":"${"x".repeat(MAX_PACKAGE_IMPORT_BYTES)}"}`;
    const result = importProfilePackageJson(huge);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("device-profile-package.import_too_large");
  });

  it("rejects a shape missing required fields", () => {
    const result = importProfilePackageJson(JSON.stringify({ profileId: "x" }));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("device-profile-package.invalid_shape");
  });

  it("rejects a package whose declared hash doesn't match its recomputed content hash (tampering)", () => {
    const pkg = exportProfilePackage(draft(), "andrea");
    const tampered = { ...pkg, hash: "deadbeef" };
    const result = importProfilePackageJson(JSON.stringify(tampered));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("device-profile-package.hash_mismatch");
  });

  it("rejects a package whose draft was edited after export without updating the hash", () => {
    const pkg = exportProfilePackage(draft(), "andrea");
    const tampered = { ...pkg, draft: { ...pkg.draft, profileId: "sensor.evil" } };
    const result = importProfilePackageJson(JSON.stringify(tampered));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("device-profile-package.hash_mismatch");
  });
});
