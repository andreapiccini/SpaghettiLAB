import { describe, expect, it } from "vitest";
import { formatThresholdRuleExpr, readThresholdRule, withThresholdFirmwareFields } from "./threshold-rule-fields.js";

describe("threshold-rule-fields", () => {
  it("writes firmware lower/upper/above from operator and GPIO action", () => {
    const next = withThresholdFirmwareFields({ op: "gte", level: 30n, action: "high" });
    expect(next["3"]).toBe(29n);
    expect(next["4"]).toBe(29n);
    expect(next["7"]).toBe(1n);
    expect(next["8"]).toBe(true);
  });

  it("inverts above_value when the condition is below the threshold", () => {
    const next = withThresholdFirmwareFields({ op: "lt", level: 10n, action: "high" });
    expect(next["3"]).toBe(10n);
    expect(next["4"]).toBe(10n);
    expect(next["8"]).toBe(false);
  });

  it("reads a saved operator back", () => {
    expect(readThresholdRule({ op: "lte", level: 5n, action: "low" })).toEqual({
      op: "lte",
      level: 5n,
      action: "low",
    });
  });

  it("formats the canvas line with operator and GPIO level", () => {
    expect(formatThresholdRuleExpr({ op: "gt", level: 12n, action: "high" })).toBe("> 12 → alto");
  });
});
