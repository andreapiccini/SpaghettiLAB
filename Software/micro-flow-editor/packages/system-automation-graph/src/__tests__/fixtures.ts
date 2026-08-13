import { coreBindingId, nodeRedResourceId, type CoreBindingId, type NodeRedResourceId } from "@spaghettilab/domain";

function mustOk<T>(result: { ok: boolean; value?: T }): T {
  if (!result.ok || result.value === undefined) throw new Error("expected ok result in test fixture");
  return result.value;
}

export const CORE_A: CoreBindingId = mustOk(coreBindingId("11111111-1111-4111-8111-111111111111"));
export const CORE_B: CoreBindingId = mustOk(coreBindingId("22222222-2222-4222-8222-222222222222"));
export const NODE_RED_RESOURCE: NodeRedResourceId = mustOk(nodeRedResourceId("33333333-3333-4333-8333-333333333333"));
