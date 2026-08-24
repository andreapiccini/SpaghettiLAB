import { describe, expect, it } from "vitest";
import { computeBackoffDelayMs } from "../reconnect-policy.js";

describe("computeBackoffDelayMs", () => {
  it("doubles with each attempt", () => {
    expect(computeBackoffDelayMs(0, 500)).toBe(500);
    expect(computeBackoffDelayMs(1, 500)).toBe(1000);
    expect(computeBackoffDelayMs(2, 500)).toBe(2000);
    expect(computeBackoffDelayMs(3, 500)).toBe(4000);
  });

  it("caps at maxMs", () => {
    expect(computeBackoffDelayMs(10, 500, 30_000)).toBe(30_000);
  });

  it("rejects a negative attempt count", () => {
    expect(() => computeBackoffDelayMs(-1)).toThrow();
  });
});
