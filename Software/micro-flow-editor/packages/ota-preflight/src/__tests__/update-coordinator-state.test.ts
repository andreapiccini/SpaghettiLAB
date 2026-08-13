import { describe, expect, it } from "vitest";
import { checkArmEligibility, UpdateState } from "../update-coordinator-state.js";

describe("checkArmEligibility — mirrors spaghetti_update_arm()'s real refusal conditions", () => {
  it("allows arming from IDLE", () => {
    expect(checkArmEligibility(UpdateState.IDLE).canArm).toBe(true);
  });

  it("refuses while the running image is an unconfirmed TRIAL_BOOT", () => {
    const result = checkArmEligibility(UpdateState.TRIAL_BOOT);
    expect(result.canArm).toBe(false);
  });

  it("refuses while in ERROR", () => {
    expect(checkArmEligibility(UpdateState.ERROR).canArm).toBe(false);
  });

  it("refuses while an upload is already in progress (RECEIVING/VERIFYING/ARMED/PENDING_REBOOT)", () => {
    expect(checkArmEligibility(UpdateState.ARMED).canArm).toBe(false);
    expect(checkArmEligibility(UpdateState.RECEIVING).canArm).toBe(false);
    expect(checkArmEligibility(UpdateState.VERIFYING).canArm).toBe(false);
    expect(checkArmEligibility(UpdateState.PENDING_REBOOT).canArm).toBe(false);
  });
});
