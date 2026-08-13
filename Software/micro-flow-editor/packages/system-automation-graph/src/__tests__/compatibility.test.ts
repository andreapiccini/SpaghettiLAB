import { describe, expect, it } from "vitest";
import { checkFieldCompatibility, LinkCompatibility } from "../compatibility.js";

describe("checkFieldCompatibility", () => {
  it("is COMPATIBLE when type and unit match", () => {
    const result = checkFieldCompatibility({ valueType: "float", unit: "celsius" }, { valueType: "float", unit: "celsius" });
    expect(result.kind).toBe(LinkCompatibility.COMPATIBLE);
  });

  it("is INCOMPATIBLE on a unit mismatch with no transformation declared", () => {
    const result = checkFieldCompatibility({ valueType: "float", unit: "celsius" }, { valueType: "float", unit: "fahrenheit" });
    expect(result.kind).toBe(LinkCompatibility.INCOMPATIBLE);
  });

  it("is TRANSFORMED once an explicit transformation is declared for a mismatch", () => {
    const result = checkFieldCompatibility({ valueType: "float", unit: "celsius" }, { valueType: "float", unit: "fahrenheit" }, "celsius-to-fahrenheit");
    expect(result.kind).toBe(LinkCompatibility.TRANSFORMED);
  });

  it("is INCOMPATIBLE on a type mismatch too, not just units", () => {
    const result = checkFieldCompatibility({ valueType: "float" }, { valueType: "bool" });
    expect(result.kind).toBe(LinkCompatibility.INCOMPATIBLE);
  });

  it("rejects a blank/whitespace-only transformation the same as none at all", () => {
    const result = checkFieldCompatibility({ valueType: "float", unit: "celsius" }, { valueType: "float", unit: "fahrenheit" }, "   ");
    expect(result.kind).toBe(LinkCompatibility.INCOMPATIBLE);
  });
});
