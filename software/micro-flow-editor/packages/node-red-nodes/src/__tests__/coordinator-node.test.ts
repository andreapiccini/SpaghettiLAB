import { describe, expect, it } from "vitest";
import { coreBindingId } from "@spaghettilab/domain";
import type { SystemAutomationLink } from "@spaghettilab/system-automation-graph";
import { coordinateRecordToCommand, CoordinateOutcome, type TransformRegistry } from "../coordinator-node.js";
import type { RecordSourceMessage } from "../record-source.js";

function mustOk<T>(result: { ok: boolean; value?: T }): T {
  if (!result.ok || result.value === undefined) throw new Error("expected ok result in test fixture");
  return result.value;
}

const CORE_A = mustOk(coreBindingId("11111111-1111-4111-8111-111111111111"));
const CORE_B = mustOk(coreBindingId("22222222-2222-4222-8222-222222222222"));

const message: RecordSourceMessage = { sourceKey: 1, sequence: 1, schemaId: "sensor.temp", schemaVersion: 1, fields: { 0: 21.5 } };

const noTransforms: TransformRegistry = { resolve: () => undefined };

function linkFixture(overrides: Partial<SystemAutomationLink> = {}): SystemAutomationLink {
  return {
    id: "link-1",
    source: { kind: "record-field", coreBinding: CORE_A, sourceKey: 1, schemaId: "sensor.temp", schemaVersion: 1, fieldId: 0 },
    target: { kind: "command", coreBinding: CORE_B, moduleKey: 5, commandId: 9 },
    validatedFingerprints: new Map(),
    ...overrides,
  };
}

describe("coordinateRecordToCommand — S112 coordinator node", () => {
  it("routes a matching record straight through when the link declares no transformation", () => {
    const result = coordinateRecordToCommand(linkFixture(), message, noTransforms);
    expect(result).toEqual({ kind: CoordinateOutcome.ROUTED, invocation: { moduleKey: 5, commandId: 9, value: 21.5 } });
  });

  it("applies the link's declared transformation via the caller-supplied registry", () => {
    const registry: TransformRegistry = { resolve: (name) => (name === "celsius-to-fahrenheit" ? (v) => (v as number) * 1.8 + 32 : undefined) };
    const result = coordinateRecordToCommand(linkFixture({ transformation: "celsius-to-fahrenheit" }), message, registry);
    expect(result.kind).toBe(CoordinateOutcome.ROUTED);
    if (result.kind === "ROUTED") expect(result.invocation.value).toBeCloseTo(70.7);
  });

  it("reports TRANSFORM_UNRESOLVED rather than forwarding untransformed when the registry can't resolve the declared transformation", () => {
    const result = coordinateRecordToCommand(linkFixture({ transformation: "unknown-transform" }), message, noTransforms);
    expect(result).toEqual({ kind: CoordinateOutcome.TRANSFORM_UNRESOLVED, transformation: "unknown-transform" });
  });

  it("reports NOT_MATCHED for a message from a different sourceKey", () => {
    const result = coordinateRecordToCommand(linkFixture(), { ...message, sourceKey: 99 }, noTransforms);
    expect(result.kind).toBe(CoordinateOutcome.NOT_MATCHED);
  });

  it("reports NOT_MATCHED when the link's source isn't a record-field endpoint", () => {
    const link = linkFixture({ source: { kind: "command", coreBinding: CORE_A, moduleKey: 1, commandId: 1 } });
    const result = coordinateRecordToCommand(link, message, noTransforms);
    expect(result.kind).toBe(CoordinateOutcome.NOT_MATCHED);
  });
});
