import { describe, expect, it } from "vitest";
import { FakeUuidGenerator } from "../fakes/fake-uuid.js";

describe("FakeUuidGenerator", () => {
  it("produces deterministic, distinct, sequential IDs", () => {
    const uuid = new FakeUuidGenerator("test");
    expect(uuid.generate()).toBe("test-1");
    expect(uuid.generate()).toBe("test-2");
    expect(uuid.generate()).toBe("test-3");
  });

  it("two independent generators reproduce the same sequence", () => {
    const a = new FakeUuidGenerator();
    const b = new FakeUuidGenerator();
    expect(a.generate()).toBe(b.generate());
  });
});
