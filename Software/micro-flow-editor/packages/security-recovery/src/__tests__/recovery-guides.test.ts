import { describe, expect, it } from "vitest";
import { catalogIncompatibleRecoveryPlan, configCorruptOrAbsentRecoveryPlan, coreReplacedRecoveryPlan, deviceIdMismatchRecoveryPlan, nodeRedUnreachableRecoveryPlan, otaRollbackRecoveryPlan } from "../recovery-guides.js";

const ALL_PLANS = [
  () => coreReplacedRecoveryPlan("binding-1", "aa", "bb"),
  () => deviceIdMismatchRecoveryPlan("binding-1", "aa", "bb"),
  () => configCorruptOrAbsentRecoveryPlan(),
  () => catalogIncompatibleRecoveryPlan(),
  () => otaRollbackRecoveryPlan("1.0.0", "2.0.0"),
  () => nodeRedUnreachableRecoveryPlan(),
];

describe("recovery guides — S124 § Verifiche (every scenario has a tested path with no implicit destructive action)", () => {
  it("every one of the six scenarios produces a non-empty, named plan", () => {
    for (const build of ALL_PLANS) {
      const plan = build();
      expect(plan.scenario.length).toBeGreaterThan(0);
      expect(plan.steps.length).toBeGreaterThan(0);
    }
  });

  it("no plan's first step is destructive — every plan starts with an observation/confirmation step, not an action", () => {
    for (const build of ALL_PLANS) {
      const plan = build();
      expect(plan.steps[0]!.destructive).toBe(false);
    }
  });

  it("coreReplacedRecoveryPlan includes both device ids in its steps", () => {
    const plan = coreReplacedRecoveryPlan("binding-1", "expected-id", "observed-id");
    expect(plan.steps.some((s) => s.step.includes("expected-id") && s.step.includes("observed-id"))).toBe(true);
  });

  it("otaRollbackRecoveryPlan names both the candidate and running version", () => {
    const plan = otaRollbackRecoveryPlan("1.0.0", "2.0.0");
    expect(plan.steps.some((s) => s.step.includes("1.0.0") && s.step.includes("2.0.0"))).toBe(true);
  });
});
