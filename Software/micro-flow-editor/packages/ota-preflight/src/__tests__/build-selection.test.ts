import { describe, expect, it } from "vitest";
import { selectBuildVariant } from "../build-selection.js";
import { candidateFixture, coreContextFixture } from "./fixtures.js";

const trustAll = () => true;

describe("selectBuildVariant — S102 § Implementazione point 3", () => {
  it("prefers the all-supported build when it provides everything required and fits", () => {
    const allSupported = candidateFixture({ isAllSupportedBuild: true, packs: [{ packId: "pack.kalman", version: 1 }, { packId: "pack.modbus", version: 1 }] });
    const composed = candidateFixture({ isAllSupportedBuild: false, packs: [{ packId: "pack.kalman", version: 1 }] });

    const result = selectBuildVariant(new Set(["pack.kalman"]), [composed, allSupported], coreContextFixture(), { trustVerifier: trustAll });

    expect(result.kind).toBe("SELECTED");
    if (result.kind === "SELECTED") expect(result.candidate.isAllSupportedBuild).toBe(true);
  });

  it("falls back to a composed image when all-supported does not fit", () => {
    const allSupportedTooBig = candidateFixture({ isAllSupportedBuild: true, flashImageBudgetBytes: 50_000_000, packs: [{ packId: "pack.kalman", version: 1 }] });
    const composedFits = candidateFixture({ isAllSupportedBuild: false, flashImageBudgetBytes: 700_000, packs: [{ packId: "pack.kalman", version: 1 }] });

    const result = selectBuildVariant(new Set(["pack.kalman"]), [allSupportedTooBig, composedFits], coreContextFixture(), { trustVerifier: trustAll });

    expect(result.kind).toBe("SELECTED");
    if (result.kind === "SELECTED") expect(result.candidate.isAllSupportedBuild).toBe(false);
  });

  it("only considers candidates whose pack list actually provides every required pack", () => {
    const missingPack = candidateFixture({ packs: [{ packId: "pack.other", version: 1 }] });
    const result = selectBuildVariant(new Set(["pack.kalman"]), [missingPack], coreContextFixture(), { trustVerifier: trustAll });
    expect(result.kind).toBe("NO_CANDIDATE_FITS");
  });

  it("reports every attempted candidate with its own preflight reason when nothing fits", () => {
    const oversized = candidateFixture({ flashImageBudgetBytes: 50_000_000, packs: [{ packId: "pack.kalman", version: 1 }] });
    const result = selectBuildVariant(new Set(["pack.kalman"]), [oversized], coreContextFixture(), { trustVerifier: trustAll });
    expect(result.kind).toBe("NO_CANDIDATE_FITS");
    if (result.kind === "NO_CANDIDATE_FITS") {
      expect(result.attempts).toHaveLength(1);
      expect(result.attempts[0]!.preflight.kind).toBe("REJECTED_BUDGET_EXCEEDED");
    }
  });

  it("never compiles anything — only chooses among caller-supplied, already-signed candidates", () => {
    const candidate = candidateFixture({ packs: [{ packId: "pack.kalman", version: 1 }] });
    const result = selectBuildVariant(new Set(["pack.kalman"]), [candidate], coreContextFixture(), { trustVerifier: trustAll });
    expect(result.kind).toBe("SELECTED");
    if (result.kind === "SELECTED") expect(result.candidate).toBe(candidate);
  });
});
