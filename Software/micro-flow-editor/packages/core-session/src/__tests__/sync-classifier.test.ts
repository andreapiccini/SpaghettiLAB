import { describe, expect, it } from "vitest";
import { classifySyncRelationship } from "../sync-classifier.js";
import type { DeploymentRecordV1 } from "@spaghettilab/domain";

function deployment(overrides: Partial<DeploymentRecordV1> = {}): DeploymentRecordV1 {
  return {
    deploymentId: "d1" as DeploymentRecordV1["deploymentId"],
    target: "core-1",
    timestamp: "2026-01-01T00:00:00.000Z",
    sourceProjectHash: "hash-a",
    configHash: "config-hash-a",
    outcome: "success",
    ...overrides,
  };
}

describe("classifySyncRelationship", () => {
  it("INCOMPATIBLE takes priority over every hash comparison", () => {
    expect(
      classifySyncRelationship({
        lastDeployment: deployment(),
        currentProjectHash: "hash-a",
        liveConfigHash: "config-hash-a",
        catalogCompatible: false,
      }),
    ).toBe("INCOMPATIBLE");
  });

  it("DIVERGED when there is no live Config to compare (blank/unreadable device)", () => {
    expect(
      classifySyncRelationship({
        lastDeployment: deployment(),
        currentProjectHash: "hash-a",
        liveConfigHash: null,
        catalogCompatible: true,
      }),
    ).toBe("DIVERGED");
  });

  it("DIVERGED when there is no prior deployment record at all", () => {
    expect(
      classifySyncRelationship({
        lastDeployment: null,
        currentProjectHash: "hash-a",
        liveConfigHash: "some-hash",
        catalogCompatible: true,
      }),
    ).toBe("DIVERGED");
  });

  it("IN_SYNC when the live Config matches the last deploy and the project hasn't changed since", () => {
    expect(
      classifySyncRelationship({
        lastDeployment: deployment({ configHash: "c1", sourceProjectHash: "p1" }),
        currentProjectHash: "p1",
        liveConfigHash: "c1",
        catalogCompatible: true,
      }),
    ).toBe("IN_SYNC");
  });

  it("PROJECT_DIRTY when the device still matches the last deploy but the project has since changed", () => {
    expect(
      classifySyncRelationship({
        lastDeployment: deployment({ configHash: "c1", sourceProjectHash: "p1" }),
        currentProjectHash: "p2",
        liveConfigHash: "c1",
        catalogCompatible: true,
      }),
    ).toBe("PROJECT_DIRTY");
  });

  it("DEVICE_CHANGED when the project is unchanged but the device no longer matches the last deploy", () => {
    expect(
      classifySyncRelationship({
        lastDeployment: deployment({ configHash: "c1", sourceProjectHash: "p1" }),
        currentProjectHash: "p1",
        liveConfigHash: "c2",
        catalogCompatible: true,
      }),
    ).toBe("DEVICE_CHANGED");
  });

  it("DIVERGED when both the project and the device changed since the last deploy", () => {
    expect(
      classifySyncRelationship({
        lastDeployment: deployment({ configHash: "c1", sourceProjectHash: "p1" }),
        currentProjectHash: "p2",
        liveConfigHash: "c2",
        catalogCompatible: true,
      }),
    ).toBe("DIVERGED");
  });
});
