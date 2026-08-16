import { describe, expect, it } from "vitest";
import { catalogEntryForNode } from "./catalog-entry-for-node.js";

describe("catalogEntryForNode", () => {
  it("picks the shipped Rule soglia row, not an unavailable typeId collision", () => {
    const entry = catalogEntryForNode({ kind: "rule", ruleTypeId: "threshold", properties: {} });
    expect(entry?.id).toBe("rule.threshold");
    expect(entry?.fields?.some((field) => field.id === "level")).toBe(true);
  });
});
