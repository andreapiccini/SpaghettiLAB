import { describe, expect, it, vi } from "vitest";
import type { NodeRedAdminApi } from "../admin-api.js";
import { DeployOutcome, deployNodeRedFlow } from "../deploy.js";
import type { NodeRedFlowNode } from "../flow-compiler.js";

const compiled: NodeRedFlowNode[] = [{ id: "new-1", type: "spaghetti-record-source", spaghettiOwned: true, spaghettiProjectId: "project-1" }];

describe("deployNodeRedFlow — S113 § Verifiche", () => {
  it("reconciles and deploys successfully when the revision matches", async () => {
    const api: NodeRedAdminApi = {
      getFlows: vi.fn().mockResolvedValue({ rev: "rev-1", nodes: [{ id: "user-1", type: "inject" }] }),
      setFlows: vi.fn().mockResolvedValue({ kind: "SUCCESS", rev: "rev-2" }),
    };

    const result = await deployNodeRedFlow(api, "project-1", compiled);

    expect(result.kind).toBe(DeployOutcome.SUCCESS);
    expect(api.setFlows).toHaveBeenCalledWith(expect.arrayContaining([expect.objectContaining({ id: "user-1" }), expect.objectContaining({ id: "new-1" })]), "rev-1");
  });

  it("never overwrites silently on a concurrent revision change — reports CONFLICT", async () => {
    const api: NodeRedAdminApi = {
      getFlows: vi.fn().mockResolvedValue({ rev: "rev-1", nodes: [] }),
      setFlows: vi.fn().mockResolvedValue({ kind: "CONFLICT" }),
    };

    const result = await deployNodeRedFlow(api, "project-1", compiled);

    expect(result.kind).toBe(DeployOutcome.CONFLICT);
  });

  it("reports AUTH_FAILED distinctly, never as a generic remote error", async () => {
    const api: NodeRedAdminApi = {
      getFlows: vi.fn().mockResolvedValue({ rev: "rev-1", nodes: [] }),
      setFlows: vi.fn().mockResolvedValue({ kind: "AUTH_FAILED" }),
    };

    const result = await deployNodeRedFlow(api, "project-1", compiled);

    expect(result.kind).toBe(DeployOutcome.AUTH_FAILED);
  });

  it("reports REMOTE_ERROR when the initial read itself fails, without attempting setFlows", async () => {
    const setFlows = vi.fn();
    const api: NodeRedAdminApi = { getFlows: vi.fn().mockRejectedValue(new Error("network down")), setFlows };

    const result = await deployNodeRedFlow(api, "project-1", compiled);

    expect(result.kind).toBe(DeployOutcome.REMOTE_ERROR);
    expect(setFlows).not.toHaveBeenCalled();
  });
});
