import { describe, expect, it } from "vitest";
import { versionSatisfies } from "../manifest.js";
import { checkPackTrust, PackTrust } from "../trust.js";
import { manifestFixture } from "./fixtures.js";

describe("versionSatisfies", () => {
  it("respects an inclusive minVersion with no upper bound", () => {
    expect(versionSatisfies({ packId: "p", minVersion: 2 }, 1)).toBe(false);
    expect(versionSatisfies({ packId: "p", minVersion: 2 }, 2)).toBe(true);
    expect(versionSatisfies({ packId: "p", minVersion: 2 }, 99)).toBe(true);
  });

  it("respects an inclusive maxVersion when given", () => {
    expect(versionSatisfies({ packId: "p", minVersion: 1, maxVersion: 3 }, 3)).toBe(true);
    expect(versionSatisfies({ packId: "p", minVersion: 1, maxVersion: 3 }, 4)).toBe(false);
  });
});

describe("checkPackTrust", () => {
  it("is UNVERIFIABLE when no verifier is supplied — never a guessed TRUSTED", () => {
    expect(checkPackTrust(manifestFixture())).toBe(PackTrust.UNVERIFIABLE);
  });

  it("reflects the caller-supplied verifier's result", () => {
    expect(checkPackTrust(manifestFixture(), () => true)).toBe(PackTrust.TRUSTED);
    expect(checkPackTrust(manifestFixture(), () => false)).toBe(PackTrust.UNTRUSTED);
  });
});
