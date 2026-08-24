import { describe, expect, it } from "vitest";
import { LinkValidity, markLinkRevalidated, revalidateLink } from "../staleness.js";
import type { SystemAutomationLink } from "../link.js";
import { CORE_A, CORE_B } from "./fixtures.js";

function linkFixture(overrides: Partial<SystemAutomationLink> = {}): SystemAutomationLink {
  return {
    id: "link-1",
    source: { kind: "record-field", coreBinding: CORE_A, sourceKey: 1, schemaId: "s", schemaVersion: 1, fieldId: 0 },
    target: { kind: "command", coreBinding: CORE_B, moduleKey: 1, commandId: 1 },
    validatedFingerprints: new Map([
      [CORE_A, "fp-a-1"],
      [CORE_B, "fp-b-1"],
    ]),
    ...overrides,
  };
}

describe("revalidateLink — S111 § Verifiche (catalog change makes a link stale until revalidated)", () => {
  it("is VALID when every involved Core's fingerprint still matches", () => {
    const link = linkFixture();
    const current = new Map([
      [CORE_A, "fp-a-1"],
      [CORE_B, "fp-b-1"],
    ]);
    expect(revalidateLink(link, current).kind).toBe(LinkValidity.VALID);
  });

  it("is STALE when one involved Core's fingerprint changed, naming that Core", () => {
    const link = linkFixture();
    const current = new Map([
      [CORE_A, "fp-a-2"],
      [CORE_B, "fp-b-1"],
    ]);
    const result = revalidateLink(link, current);
    expect(result.kind).toBe(LinkValidity.STALE);
    expect(result.staleCoreBindings).toEqual([CORE_A]);
  });

  it("is STALE when a Core's current fingerprint is simply unknown to the caller", () => {
    const link = linkFixture();
    const current = new Map([[CORE_A, "fp-a-1"]]);
    expect(revalidateLink(link, current).kind).toBe(LinkValidity.STALE);
  });
});

describe("markLinkRevalidated", () => {
  it("updates only the involved CoreBindings' fingerprints, making a stale link valid again", () => {
    const link = linkFixture();
    const current = new Map([
      [CORE_A, "fp-a-2"],
      [CORE_B, "fp-b-1"],
    ]);
    expect(revalidateLink(link, current).kind).toBe(LinkValidity.STALE);
    const refreshed = markLinkRevalidated(link, current);
    expect(revalidateLink(refreshed, current).kind).toBe(LinkValidity.VALID);
  });
});
