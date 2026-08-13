import { coreBindingId, type CoreBindingId } from "@spaghettilab/domain";
import type { SystemAutomationLink } from "@spaghettilab/system-automation-graph";

function mustOk<T>(result: { ok: boolean; value?: T }): T {
  if (!result.ok || result.value === undefined) throw new Error("expected ok result in test fixture");
  return result.value;
}

export const CORE_A: CoreBindingId = mustOk(coreBindingId("11111111-1111-4111-8111-111111111111"));
export const CORE_B: CoreBindingId = mustOk(coreBindingId("22222222-2222-4222-8222-222222222222"));

export function linkFixture(overrides: Partial<SystemAutomationLink> = {}): SystemAutomationLink {
  return {
    id: "link-1",
    source: { kind: "record-field", coreBinding: CORE_A, sourceKey: 1, schemaId: "sensor.temp", schemaVersion: 1, fieldId: 0 },
    target: { kind: "command", coreBinding: CORE_B, moduleKey: 5, commandId: 9 },
    validatedFingerprints: new Map(),
    ...overrides,
  };
}
