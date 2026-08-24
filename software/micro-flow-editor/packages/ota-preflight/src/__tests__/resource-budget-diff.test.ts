import { describe, expect, it } from "vitest";
import { compareResourceBudget } from "../resource-budget-diff.js";
import { candidateFixture, resourcesFixture } from "./fixtures.js";

describe("compareResourceBudget", () => {
  it("computes a distinct delta per dimension, never a single summed number", () => {
    const comparison = compareResourceBudget(candidateFixture(), resourcesFixture());
    expect(comparison.deltas.map((d) => d.dimension)).toEqual(["flashImage", "staticRam", "stack", "pool", "workspace"]);
    expect(comparison.fits).toBe(true);
  });

  it("flags a specific dimension as not fitting when the candidate exceeds it, others still fit", () => {
    const comparison = compareResourceBudget(candidateFixture({ staticRamBudgetBytes: 999_999_999 }), resourcesFixture());
    expect(comparison.fits).toBe(false);
    const ram = comparison.deltas.find((d) => d.dimension === "staticRam")!;
    expect(ram.marginBytes).toBeLessThan(0);
    const flash = comparison.deltas.find((d) => d.dimension === "flashImage")!;
    expect(flash.marginBytes).toBeGreaterThanOrEqual(0);
  });

  it("never reads current pool usage — only declared flashSlot/flashImageBudget/flashHeadroom/staticRamBudget fields", () => {
    const resources = resourcesFixture();
    const withHeavyUsage = { ...resources, modules: { ...resources.modules, used: resources.modules.capacity } };
    const a = compareResourceBudget(candidateFixture(), resources);
    const b = compareResourceBudget(candidateFixture(), withHeavyUsage);
    expect(a).toEqual(b);
  });
});
