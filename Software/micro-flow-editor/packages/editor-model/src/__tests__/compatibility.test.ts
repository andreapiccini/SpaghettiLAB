import { describe, expect, it } from "vitest";
import { checkHandleCompatibility, createEdgeIfCompatible } from "../compatibility.js";
import { EditorModelErrorCode } from "../errors.js";
import type { HandleDescriptor } from "../handle.js";

function output(overrides: Partial<HandleDescriptor> = {}): HandleDescriptor {
  return { handleId: "out", direction: "output", valueType: "int", ...overrides };
}
function input(overrides: Partial<HandleDescriptor> = {}): HandleDescriptor {
  return { handleId: "in", direction: "input", valueType: "int", ...overrides };
}

describe("checkHandleCompatibility", () => {
  it("allows a matching output -> input edge", () => {
    expect(checkHandleCompatibility(output(), input()).ok).toBe(true);
  });

  it("rejects input -> output (wrong direction) with a structured error", () => {
    const result = checkHandleCompatibility(input(), output());
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe(EditorModelErrorCode.DIRECTION_MISMATCH);
  });

  it("rejects a type mismatch", () => {
    const result = checkHandleCompatibility(output({ valueType: "int" }), input({ valueType: "text" }));
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe(EditorModelErrorCode.TYPE_MISMATCH);
  });

  it("rejects a unit mismatch", () => {
    const result = checkHandleCompatibility(output({ unit: "celsius" }), input({ unit: "fahrenheit" }));
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe(EditorModelErrorCode.UNIT_MISMATCH);
  });

  it("allows the same unit on both ends", () => {
    expect(checkHandleCompatibility(output({ unit: "celsius" }), input({ unit: "celsius" })).ok).toBe(true);
  });

  it("rejects a reference group mismatch for reference-typed handles", () => {
    const result = checkHandleCompatibility(
      output({ valueType: "reference", referenceGroup: "sensor-a" }),
      input({ valueType: "reference", referenceGroup: "sensor-b" }),
    );
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe(EditorModelErrorCode.REFERENCE_GROUP_MISMATCH);
  });

  it("rejects a semantic group mismatch when both sides declare one", () => {
    const result = checkHandleCompatibility(
      output({ semanticGroup: "temperature" }),
      input({ semanticGroup: "humidity" }),
    );
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe(EditorModelErrorCode.SEMANTIC_GROUP_MISMATCH);
  });

  it("does not require a semantic group match when only one side declares one", () => {
    expect(checkHandleCompatibility(output({ semanticGroup: "temperature" }), input()).ok).toBe(true);
  });

  it("does not restrict cross-Flow edges unless a handle opts in with requireSameFlow", () => {
    expect(checkHandleCompatibility(output({ flowId: 1 }), input({ flowId: 2 })).ok).toBe(true);
  });

  it("rejects a cross-Flow edge when a handle declares requireSameFlow", () => {
    const result = checkHandleCompatibility(output({ flowId: 1, requireSameFlow: true }), input({ flowId: 2 }));
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe(EditorModelErrorCode.FLOW_MISMATCH);
  });

  it("allows a same-Flow edge when requireSameFlow is declared", () => {
    expect(
      checkHandleCompatibility(output({ flowId: 1, requireSameFlow: true }), input({ flowId: 1 })).ok,
    ).toBe(true);
  });

  it("skips the capability check entirely when installedCapabilities is not supplied", () => {
    expect(
      checkHandleCompatibility(output(), input({ requiredCapabilities: ["kalman-filter"] })).ok,
    ).toBe(true);
  });

  it("rejects a missing required capability when installedCapabilities is supplied", () => {
    const result = checkHandleCompatibility(
      output(),
      input({ requiredCapabilities: ["kalman-filter"] }),
      new Set(["modbus"]),
    );
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe(EditorModelErrorCode.MISSING_CAPABILITY);
  });

  it("allows the edge when the required capability is installed", () => {
    expect(
      checkHandleCompatibility(output(), input({ requiredCapabilities: ["kalman-filter"] }), new Set(["kalman-filter"]))
        .ok,
    ).toBe(true);
  });
});

describe("createEdgeIfCompatible", () => {
  it("returns the edge descriptor on success", () => {
    const result = createEdgeIfCompatible(output(), input());
    expect(result).toEqual({ ok: true, value: { sourceHandleId: "out", targetHandleId: "in" } });
  });

  it("returns the structured error, never a half-created edge, on failure", () => {
    const result = createEdgeIfCompatible(input(), output());
    expect(result.ok).toBe(false);
  });
});
