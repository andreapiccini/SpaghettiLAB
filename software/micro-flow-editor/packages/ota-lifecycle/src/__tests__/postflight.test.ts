import { describe, expect, it } from "vitest";
import { evaluatePostflight, PostflightOutcome } from "../postflight.js";
import { candidateFixture, snapshotFixture } from "./fixtures.js";

describe("evaluatePostflight — S103 § Verifiche (never a false 'installed')", () => {
  it("confirms installed only when identity, version, feature-set hash, Config and profiles all match", () => {
    const before = snapshotFixture({ fwVersion: "1.0.0" });
    const after = snapshotFixture({ fwVersion: "2.0.0", featureSetHash: new Uint8Array([0xaa, 0xbb, 0xcc]) });
    const result = evaluatePostflight(before, after, candidateFixture({ fwVersion: "2.0.0", featureSetHash: "aabbcc" }));
    expect(result.kind).toBe(PostflightOutcome.CONFIRMED_INSTALLED);
  });

  it("detects a rollback — post-OTA version still equals pre-OTA version — instead of a false CONFIRMED_INSTALLED", () => {
    const before = snapshotFixture({ fwVersion: "1.0.0" });
    const after = snapshotFixture({ fwVersion: "1.0.0" });
    const result = evaluatePostflight(before, after, candidateFixture({ fwVersion: "2.0.0" }));
    expect(result.kind).toBe(PostflightOutcome.ROLLBACK_DETECTED);
  });

  it("rejects a different device id before checking anything else — WRONG_DEVICE", () => {
    const before = snapshotFixture({ deviceId: new Uint8Array([1, 1]) });
    const after = snapshotFixture({ deviceId: new Uint8Array([2, 2]), fwVersion: "2.0.0" });
    const result = evaluatePostflight(before, after, candidateFixture({ fwVersion: "2.0.0" }));
    expect(result.kind).toBe(PostflightOutcome.WRONG_DEVICE);
  });

  it("flags a version that matches neither before nor the candidate as VERSION_MISMATCH", () => {
    const before = snapshotFixture({ fwVersion: "1.0.0" });
    const after = snapshotFixture({ fwVersion: "9.9.9" });
    const result = evaluatePostflight(before, after, candidateFixture({ fwVersion: "2.0.0" }));
    expect(result.kind).toBe(PostflightOutcome.VERSION_MISMATCH);
  });

  it("flags a feature-set hash mismatch even when the version matches", () => {
    const before = snapshotFixture({ fwVersion: "1.0.0" });
    const after = snapshotFixture({ fwVersion: "2.0.0", featureSetHash: new Uint8Array([1, 1, 1]) });
    const result = evaluatePostflight(before, after, candidateFixture({ fwVersion: "2.0.0", featureSetHash: "aabbcc" }));
    expect(result.kind).toBe(PostflightOutcome.FEATURE_SET_MISMATCH);
  });

  it("flags a resource-report mismatch when the booted image's declared budget doesn't match the candidate's", () => {
    const before = snapshotFixture({ fwVersion: "1.0.0" });
    const after = snapshotFixture({ fwVersion: "2.0.0", featureSetHash: new Uint8Array([0xaa, 0xbb, 0xcc]), resourceReport: { flashImageBudgetBytes: 1, staticRamBudgetBytes: 1 } });
    const result = evaluatePostflight(before, after, candidateFixture({ fwVersion: "2.0.0", featureSetHash: "aabbcc" }));
    expect(result.kind).toBe(PostflightOutcome.RESOURCE_REPORT_MISMATCH);
  });

  it("never confirms installed when Config was not preserved, simulating power loss/trial crash scenarios", () => {
    const before = snapshotFixture({ fwVersion: "1.0.0" });
    const after = snapshotFixture({ fwVersion: "2.0.0", featureSetHash: new Uint8Array([0xaa, 0xbb, 0xcc]), configPreserved: false });
    const result = evaluatePostflight(before, after, candidateFixture({ fwVersion: "2.0.0", featureSetHash: "aabbcc" }));
    expect(result.kind).toBe(PostflightOutcome.CONFIG_NOT_PRESERVED);
  });

  it("never confirms installed when Device Profiles were not preserved", () => {
    const before = snapshotFixture({ fwVersion: "1.0.0" });
    const after = snapshotFixture({ fwVersion: "2.0.0", featureSetHash: new Uint8Array([0xaa, 0xbb, 0xcc]), profilesPreserved: false });
    const result = evaluatePostflight(before, after, candidateFixture({ fwVersion: "2.0.0", featureSetHash: "aabbcc" }));
    expect(result.kind).toBe(PostflightOutcome.PROFILES_NOT_PRESERVED);
  });
});
