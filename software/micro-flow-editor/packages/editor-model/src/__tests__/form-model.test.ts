import { describe, expect, it } from "vitest";
import { buildFormField, buildFormModel, type FieldDescriptor } from "../form-model.js";

describe("buildFormField", () => {
  it("builds a required int field with no default", () => {
    const result = buildFormField({ fieldId: 1, kind: "int", required: true });
    expect(result).toEqual({
      ok: true,
      value: {
        fieldId: 1,
        kind: "int",
        required: true,
        hasDefault: false,
        default: undefined,
        unit: undefined,
        fixedPointScale: undefined,
        enumOptions: undefined,
        referenceGroup: undefined,
        requiresLosslessEncoding: false,
      },
    });
  });

  it("marks hasDefault from an explicit default value", () => {
    const result = buildFormField({ fieldId: 2, kind: "bool", required: false, default: true });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.hasDefault).toBe(true);
    expect(result.value.default).toBe(true);
  });

  it("marks requiresLosslessEncoding only for int/uint with losslessInteger: true", () => {
    const uint64 = buildFormField({ fieldId: 3, kind: "uint", required: true, losslessInteger: true });
    expect(uint64.ok && uint64.value.requiresLosslessEncoding).toBe(true);

    const plainUint = buildFormField({ fieldId: 4, kind: "uint", required: true });
    expect(plainUint.ok && plainUint.value.requiresLosslessEncoding).toBe(false);
  });

  it("rejects an enum field with no options", () => {
    const result = buildFormField({ fieldId: 5, kind: "enum", required: true });
    expect(result.ok).toBe(false);
  });

  it("accepts an enum field with options", () => {
    const result = buildFormField({
      fieldId: 5,
      kind: "enum",
      required: true,
      enumValues: [{ value: 0, label: "off" }, { value: 1, label: "on" }],
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.enumOptions).toHaveLength(2);
  });

  it("rejects a reference field with no referenceGroup", () => {
    const result = buildFormField({ fieldId: 6, kind: "reference", required: true });
    expect(result.ok).toBe(false);
  });

  it("rejects a fixed-point field with no fixedPointScale", () => {
    const result = buildFormField({ fieldId: 7, kind: "fixed-point", required: true });
    expect(result.ok).toBe(false);
  });

  it("rejects fixedPointScale on a non-fixed-point kind", () => {
    const result = buildFormField({ fieldId: 8, kind: "int", required: true, fixedPointScale: 256 });
    expect(result.ok).toBe(false);
  });

  it("accepts bytes and text fields without extra constraints", () => {
    expect(buildFormField({ fieldId: 9, kind: "bytes", required: false }).ok).toBe(true);
    expect(buildFormField({ fieldId: 10, kind: "text", required: false }).ok).toBe(true);
  });
});

describe("buildFormModel", () => {
  it("builds every field when the schema is entirely valid", () => {
    const schema: FieldDescriptor[] = [
      { fieldId: 1, kind: "bool", required: true },
      { fieldId: 2, kind: "text", required: false },
    ];
    const result = buildFormModel(schema);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value).toHaveLength(2);
  });

  it("collects every invalid field's error instead of stopping at the first", () => {
    const schema: FieldDescriptor[] = [
      { fieldId: 1, kind: "enum", required: true }, // invalid: no options
      { fieldId: 2, kind: "reference", required: true }, // invalid: no referenceGroup
    ];
    const result = buildFormModel(schema);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toHaveLength(2);
  });
});
