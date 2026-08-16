import { describe, expect, it } from "vitest";
import { defaultPropertiesFromFields, formatFieldsSubtitle } from "../fields.js";

describe("catalog field helpers", () => {
  const fields = [
    { id: "op", label: "Operatore", type: "select" as const, options: [{ value: "gte", label: "≥" }], default: "gte" },
    { id: "1", label: "Valore", type: "number" as const, default: 0 },
    { id: "topic", label: "Topic", type: "text" as const },
  ];

  it("seeds defaults, storing numbers as bigint for the firmware wire", () => {
    expect(defaultPropertiesFromFields(fields)).toEqual({ op: "gte", "1": 0n });
  });

  it("formats a live subtitle from named properties", () => {
    expect(formatFieldsSubtitle(fields, { op: "gte", "1": 30n, topic: "sensors/temp" })).toBe("≥ · 30 · sensors/temp");
    expect(formatFieldsSubtitle(fields, {})).toBeUndefined();
  });
});
