import { describe, expect, it } from "vitest";
import { FakeClock } from "../fakes/fake-clock.js";

describe("FakeClock", () => {
  it("starts at the given instant and never drifts on its own", () => {
    const start = new Date("2026-03-01T10:00:00.000Z");
    const clock = new FakeClock(start);
    expect(clock.now()).toEqual(start);
    expect(clock.now()).toEqual(start);
  });

  it("advances only when told to", () => {
    const clock = new FakeClock(new Date("2026-03-01T10:00:00.000Z"));
    clock.advance(60_000);
    expect(clock.now()).toEqual(new Date("2026-03-01T10:01:00.000Z"));
  });
});
