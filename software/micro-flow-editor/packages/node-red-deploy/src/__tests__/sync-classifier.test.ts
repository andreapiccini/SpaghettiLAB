import { describe, expect, it } from "vitest";
import { classifyNodeRedSync } from "../sync-classifier.js";

describe("classifyNodeRedSync — mirrors core-session's classifySyncRelationship", () => {
  it("IN_SYNC when deployed, live and current compiled hashes all match", () => {
    expect(classifyNodeRedSync({ lastDeployedFlowHash: "h1", currentCompiledFlowHash: "h1", liveOwnedFlowHash: "h1" })).toBe("IN_SYNC");
  });

  it("PROJECT_DIRTY when the project changed since the last deploy but the live flow still matches what was deployed", () => {
    expect(classifyNodeRedSync({ lastDeployedFlowHash: "h1", currentCompiledFlowHash: "h2", liveOwnedFlowHash: "h1" })).toBe("PROJECT_DIRTY");
  });

  it("DEVICE_CHANGED when the live flow no longer matches what was deployed but the project is unchanged", () => {
    expect(classifyNodeRedSync({ lastDeployedFlowHash: "h1", currentCompiledFlowHash: "h1", liveOwnedFlowHash: "h2" })).toBe("DEVICE_CHANGED");
  });

  it("DIVERGED when both differ from the last deployed hash", () => {
    expect(classifyNodeRedSync({ lastDeployedFlowHash: "h1", currentCompiledFlowHash: "h2", liveOwnedFlowHash: "h3" })).toBe("DIVERGED");
  });

  it("DIVERGED, conservatively, when never deployed", () => {
    expect(classifyNodeRedSync({ lastDeployedFlowHash: null, currentCompiledFlowHash: "h1", liveOwnedFlowHash: "h1" })).toBe("DIVERGED");
  });

  it("DIVERGED, conservatively, when the live flow is unreadable", () => {
    expect(classifyNodeRedSync({ lastDeployedFlowHash: "h1", currentCompiledFlowHash: "h1", liveOwnedFlowHash: null })).toBe("DIVERGED");
  });
});
