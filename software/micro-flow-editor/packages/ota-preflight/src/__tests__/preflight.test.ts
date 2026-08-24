import { describe, expect, it } from "vitest";
import { PreflightOutcome, preflightOtaCandidate } from "../preflight.js";
import { UpdateState } from "../update-coordinator-state.js";
import { candidateFixture, coreContextFixture, resourcesFixture } from "./fixtures.js";

const trustAll = () => true;

describe("preflightOtaCandidate — S102 § Verifiche", () => {
  it("rejects an untrusted artifact before any transfer, when no verifier is supplied", () => {
    const result = preflightOtaCandidate(candidateFixture(), coreContextFixture());
    expect(result.kind).toBe(PreflightOutcome.REJECTED_UNTRUSTED);
  });

  it("rejects an artifact whose declared hash does not match the expected hash", () => {
    const result = preflightOtaCandidate(candidateFixture({ hash: "wrong-hash" }), coreContextFixture(), { trustVerifier: trustAll, expectedHash: "deadbeef" });
    expect(result.kind).toBe(PreflightOutcome.REJECTED_HASH_MISMATCH);
  });

  it("blocks a manifest exceeding declared build capacity with an explicit per-dimension delta, not a generic 'no space'", () => {
    const oversized = candidateFixture({ flashImageBudgetBytes: 5_000_000 });
    const result = preflightOtaCandidate(oversized, coreContextFixture(), { trustVerifier: trustAll });

    expect(result.kind).toBe(PreflightOutcome.REJECTED_BUDGET_EXCEEDED);
    expect(result.budgetDeltas).toBeDefined();
    const flashDelta = result.budgetDeltas!.find((d) => d.dimension === "flashImage")!;
    expect(flashDelta.marginBytes).toBeLessThan(0);
    expect(flashDelta.requiredBytes).toBe(5_000_000);
    expect(result.reason).toContain("flashImage");
  });

  it("succeeds when the candidate is trusted, compatible and fits — READY", () => {
    const result = preflightOtaCandidate(candidateFixture(), coreContextFixture(), { trustVerifier: trustAll });
    expect(result.kind).toBe(PreflightOutcome.READY);
  });

  it("rejects a core-variant mismatch before checking anything else downstream", () => {
    const result = preflightOtaCandidate(candidateFixture({ coreVariant: "core-b" }), coreContextFixture(), { trustVerifier: trustAll });
    expect(result.kind).toBe(PreflightOutcome.REJECTED_CORE_VARIANT);
  });

  it("rejects a resource-profile mismatch", () => {
    const result = preflightOtaCandidate(candidateFixture({ resourceProfile: 2 }), coreContextFixture(), { trustVerifier: trustAll });
    expect(result.kind).toBe(PreflightOutcome.REJECTED_RESOURCE_PROFILE);
  });

  it("refuses to arm while the running image is an unconfirmed TRIAL_BOOT", () => {
    const result = preflightOtaCandidate(candidateFixture(), coreContextFixture({ updateState: UpdateState.TRIAL_BOOT }), { trustVerifier: trustAll });
    expect(result.kind).toBe(PreflightOutcome.REJECTED_COORDINATOR_BUSY);
  });

  it("refuses to arm while another update is already RECEIVING", () => {
    const result = preflightOtaCandidate(candidateFixture(), coreContextFixture({ updateState: UpdateState.RECEIVING }), { trustVerifier: trustAll });
    expect(result.kind).toBe(PreflightOutcome.REJECTED_COORDINATOR_BUSY);
  });

  it("flags a candidate whose version sorts before the running version as a possible downgrade", () => {
    const result = preflightOtaCandidate(candidateFixture({ fwVersion: "0.9.0" }), coreContextFixture({ currentFwVersion: "1.0.0" }), { trustVerifier: trustAll });
    expect(result.kind).toBe(PreflightOutcome.REJECTED_POSSIBLE_DOWNGRADE);
  });

  it("rejects when minProtocolVersion exceeds the Core's real protocol version", () => {
    const result = preflightOtaCandidate(candidateFixture({ minProtocolVersion: 99 }), coreContextFixture(), { trustVerifier: trustAll });
    expect(result.kind).toBe(PreflightOutcome.REJECTED_PROTOCOL_TOO_OLD);
  });

  it("rejects when minConfigVersion exceeds the Core's real Config wire version", () => {
    const result = preflightOtaCandidate(candidateFixture({ minConfigVersion: 99 }), coreContextFixture(), { trustVerifier: trustAll });
    expect(result.kind).toBe(PreflightOutcome.REJECTED_CONFIG_VERSION_TOO_OLD);
  });

  it("rejects when the candidate no longer provides a type the live Config uses and declares REJECT_REMOVAL", () => {
    const candidate = candidateFixture({ providedTypeIds: new Set(["some.other.type"]) });
    const core = coreContextFixture({ usedTypeIds: new Set(["block.kalman"]) });
    const result = preflightOtaCandidate(candidate, core, { trustVerifier: trustAll });
    expect(result.kind).toBe(PreflightOutcome.REJECTED_CONFIG_TYPE_REMOVED);
  });

  it("never checks current pool usage (.used/.peak) for the budget decision — only declared build-capacity fields", () => {
    const resources = resourcesFixture({ flashImageBudgetBytes: 700_000, modules: { capacity: 1, used: 1, peak: 1 } });
    const result = preflightOtaCandidate(candidateFixture({ flashImageBudgetBytes: 700_000 }), coreContextFixture({ resources }), { trustVerifier: trustAll });
    expect(result.kind).toBe(PreflightOutcome.READY);
  });
});
