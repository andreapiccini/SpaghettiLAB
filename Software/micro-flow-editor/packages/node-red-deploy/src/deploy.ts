import { domainError, type DomainError } from "@spaghettilab/domain";
import type { NodeRedAdminApi } from "./admin-api.js";
import { NodeRedDeployErrorCode } from "./errors.js";
import type { NodeRedFlowNode } from "./flow-compiler.js";
import { reconcileFlows } from "./reconcile.js";

export const DeployOutcome = {
  SUCCESS: "SUCCESS",
  CONFLICT: "CONFLICT",
  AUTH_FAILED: "AUTH_FAILED",
  REMOTE_ERROR: "REMOTE_ERROR",
} as const;

export type DeployOutcomeKind = (typeof DeployOutcome)[keyof typeof DeployOutcome];

export type DeployResult = { readonly kind: DeployOutcomeKind; readonly rev?: string; readonly issue?: DomainError };

/**
 * Reads the live flow set, reconciles only this project's own nodes into
 * it (`reconcile.ts` — every foreign tab/subflow/node passes through
 * untouched), and deploys via compare-and-swap on Node-RED's own `rev`.
 * S113 § Verifiche: "una revisione concorrente produce conflict e non
 * sovrascrive silenziosamente" — a `rev` that changed between the read and
 * this call always surfaces as `CONFLICT`, never a silent overwrite; this
 * function never retries with a re-fetched `rev` on its own, that decision
 * belongs to the caller (who may want to show the user what changed first).
 */
export async function deployNodeRedFlow(adminApi: NodeRedAdminApi, projectId: string, compiledNodes: readonly NodeRedFlowNode[]): Promise<DeployResult> {
  let live;
  try {
    live = await adminApi.getFlows();
  } catch (cause) {
    return { kind: DeployOutcome.REMOTE_ERROR, issue: remoteError("getFlows", cause) };
  }

  const merged = reconcileFlows(live.nodes, compiledNodes, projectId);

  const outcome = await adminApi.setFlows(merged, live.rev);
  if (outcome.kind === "SUCCESS") return { kind: DeployOutcome.SUCCESS, rev: outcome.rev };
  if (outcome.kind === "CONFLICT") {
    return {
      kind: DeployOutcome.CONFLICT,
      issue: domainError({
        code: NodeRedDeployErrorCode.REVISION_CONFLICT,
        path: ["node-red-deploy", "deployNodeRedFlow"],
        target: live.rev,
        remediation: "The live Node-RED flow revision changed since it was read — re-fetch, re-reconcile and retry deliberately, never overwrite blindly.",
      }),
    };
  }
  if (outcome.kind === "AUTH_FAILED") {
    return { kind: DeployOutcome.AUTH_FAILED, issue: domainError({ code: NodeRedDeployErrorCode.AUTH_FAILED, path: ["node-red-deploy", "deployNodeRedFlow"], target: "adminAuth", remediation: "Node-RED rejected the Admin API token — check adminAuth configuration." }) };
  }
  return { kind: DeployOutcome.REMOTE_ERROR, issue: remoteError("setFlows", outcome.detail) };
}

function remoteError(fn: string, cause: unknown): DomainError {
  return domainError({ code: NodeRedDeployErrorCode.REMOTE_ERROR, path: ["node-red-deploy", fn], target: fn, remediation: "The Node-RED Admin API call failed — check connectivity and retry.", cause });
}
