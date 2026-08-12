import { describe, expect, it } from "vitest";
import { domainError, DomainErrorCode } from "../errors.js";

describe("domainError", () => {
  it("defaults severity to error", () => {
    const e = domainError({
      code: DomainErrorCode.INVALID_ID,
      path: ["project"],
      target: "abc",
      remediation: "fix it",
    });
    expect(e.severity).toBe("error");
  });

  it("accepts an explicit severity and a cause", () => {
    const cause = new Error("underlying");
    const e = domainError({
      code: "custom.code",
      severity: "warning",
      path: ["project", "coreBindings", "0"],
      target: "core-1",
      remediation: "review the binding",
      cause,
    });
    expect(e).toEqual({
      code: "custom.code",
      severity: "warning",
      path: ["project", "coreBindings", "0"],
      target: "core-1",
      remediation: "review the binding",
      cause,
    });
  });
});
