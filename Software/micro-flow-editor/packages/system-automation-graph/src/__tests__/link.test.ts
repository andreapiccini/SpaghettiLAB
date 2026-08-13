import { describe, expect, it } from "vitest";
import { createSystemAutomationLink, involvedCoreBindings } from "../link.js";
import type { FieldRegistry } from "../field-registry.js";
import { CORE_A, CORE_B, NODE_RED_RESOURCE } from "./fixtures.js";

const tempField = { schemaId: "sensor.temp", schemaVersion: 1, fieldId: 0, valueType: "float", unit: "celsius" };
const displayField = { schemaId: "display.gauge", schemaVersion: 1, fieldId: 0, valueType: "float", unit: "fahrenheit" };
const matchingField = { schemaId: "display.gauge2", schemaVersion: 1, fieldId: 0, valueType: "float", unit: "celsius" };

function registryFixture(): FieldRegistry {
  return {
    resolveField(schemaId, schemaVersion, fieldId) {
      for (const f of [tempField, displayField, matchingField]) {
        if (f.schemaId === schemaId && f.schemaVersion === schemaVersion && f.fieldId === fieldId) return f;
      }
      return undefined;
    },
    resolveCommand: () => undefined,
  };
}

describe("createSystemAutomationLink — S111 § Verifiche", () => {
  it("every endpoint references coreBinding + stable key, never a runtime session id (type-level: no such field exists on the endpoint types)", () => {
    const registry = registryFixture();
    const result = createSystemAutomationLink(
      "link-1",
      { kind: "record-field", coreBinding: CORE_A, sourceKey: 1, ...matchingField },
      { kind: "record-field", coreBinding: CORE_B, sourceKey: 2, ...matchingField },
      registry,
      new Map(),
    );
    expect(result.ok).toBe(true);
  });

  it("rejects a temperature-to-display link with mismatched units when no transformation is declared — never converts implicitly", () => {
    const registry = registryFixture();
    const result = createSystemAutomationLink(
      "link-2",
      { kind: "record-field", coreBinding: CORE_A, sourceKey: 1, ...tempField },
      { kind: "record-field", coreBinding: CORE_B, sourceKey: 2, ...displayField },
      registry,
      new Map(),
    );
    expect(result.ok).toBe(false);
  });

  it("accepts the same mismatched link once an explicit transformation is declared", () => {
    const registry = registryFixture();
    const result = createSystemAutomationLink(
      "link-3",
      { kind: "record-field", coreBinding: CORE_A, sourceKey: 1, ...tempField },
      { kind: "record-field", coreBinding: CORE_B, sourceKey: 2, ...displayField },
      registry,
      new Map(),
      "celsius-to-fahrenheit",
    );
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.transformation).toBe("celsius-to-fahrenheit");
  });

  it("rejects a link to/from an endpoint the registry cannot resolve, rather than assuming compatible", () => {
    const registry = registryFixture();
    const result = createSystemAutomationLink(
      "link-4",
      { kind: "record-field", coreBinding: CORE_A, sourceKey: 1, schemaId: "unknown", schemaVersion: 1, fieldId: 99 },
      { kind: "record-field", coreBinding: CORE_B, sourceKey: 2, ...matchingField },
      registry,
      new Map(),
    );
    expect(result.ok).toBe(false);
  });

  it("allows a Node-RED processing endpoint on either side without requiring it in the field registry", () => {
    const registry = registryFixture();
    const result = createSystemAutomationLink("link-5", { kind: "record-field", coreBinding: CORE_A, sourceKey: 1, ...matchingField }, { kind: "nodered", nodeRedResourceId: NODE_RED_RESOURCE }, registry, new Map());
    expect(result.ok).toBe(true);
  });
});

describe("involvedCoreBindings", () => {
  it("lists both Cores for a cross-Core link", () => {
    const ids = involvedCoreBindings({ kind: "command", coreBinding: CORE_A, moduleKey: 1, commandId: 1 }, { kind: "command", coreBinding: CORE_B, moduleKey: 2, commandId: 2 });
    expect(ids).toEqual([CORE_A, CORE_B]);
  });

  it("excludes a Node-RED endpoint, which has no CoreBinding", () => {
    const ids = involvedCoreBindings({ kind: "command", coreBinding: CORE_A, moduleKey: 1, commandId: 1 }, { kind: "nodered", nodeRedResourceId: NODE_RED_RESOURCE });
    expect(ids).toEqual([CORE_A]);
  });
});
