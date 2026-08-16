import { describe, expect, it } from "vitest";
import { formatConfiguredSubtitle } from "./configured-subtitle.js";

describe("formatConfiguredSubtitle", () => {
  it("shows the IF Condition as in ≥ level so the canvas reads the live test", () => {
    expect(formatConfiguredSubtitle("block", "threshold", { "1": 30n })).toBe("≥ 30");
    expect(formatConfiguredSubtitle("block", "threshold", { "1": 30n }, "var")).toBe("var ≥ 30");
  });

  it("accepts number and decimal-string property values, not only bigint", () => {
    expect(formatConfiguredSubtitle("block", "threshold", { "1": 30 })).toBe("≥ 30");
    expect(formatConfiguredSubtitle("block", "threshold", { "1": "30n" })).toBe("≥ 30");
  });

  it("formats a Rule threshold band from firmware fields 3/4", () => {
    expect(formatConfiguredSubtitle("rule", "threshold", { "3": 10n, "4": 20n }, "temp")).toBe("temp 10 … 20");
    expect(formatConfiguredSubtitle("rule", "threshold", { "3": 30n, "4": 30n })).toBe("≥ 30");
  });

  it("returns undefined when the block has no configured properties yet", () => {
    expect(formatConfiguredSubtitle("block", "threshold", {})).toBeUndefined();
  });

  it("falls back to the property values for unknown type ids", () => {
    expect(formatConfiguredSubtitle("block", "mystery", { "1": 2n, "2": 5n })).toBe("2 · 5");
  });
});
