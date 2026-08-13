import { describe, expect, it } from "vitest";
import { checkDestructiveConfirmation } from "../confirmation.js";

describe("checkDestructiveConfirmation — S094 § Verifiche (explicit confirmation with visible target)", () => {
  it("passes when the confirmed target exactly matches the real target", () => {
    const result = checkDestructiveConfirmation({ target: "core-042", confirmedTarget: "core-042" });
    expect(result.ok).toBe(true);
  });

  it("fails when the confirmed target does not match, even if similar", () => {
    const result = checkDestructiveConfirmation({ target: "core-042", confirmedTarget: "core-43" });
    expect(result.ok).toBe(false);
  });

  it("fails when no confirmation was given at all", () => {
    const result = checkDestructiveConfirmation({ target: "core-042", confirmedTarget: "" });
    expect(result.ok).toBe(false);
  });
});
