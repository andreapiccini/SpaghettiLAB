import { describe, expect, it } from "vitest";
import { FakeUuidGenerator } from "../fakes/fake-uuid.js";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

describe("FakeUuidGenerator", () => {
  it("produces valid-shaped, distinct, sequential UUIDs", () => {
    const uuid = new FakeUuidGenerator("test");
    const a = uuid.generate();
    const b = uuid.generate();
    expect(a).toMatch(UUID_PATTERN);
    expect(b).toMatch(UUID_PATTERN);
    expect(a).not.toBe(b);
  });

  it("two generators with the same seed reproduce the same sequence", () => {
    const a = new FakeUuidGenerator("same-seed");
    const b = new FakeUuidGenerator("same-seed");
    expect(a.generate()).toBe(b.generate());
  });

  it("two generators with different seeds never collide", () => {
    const a = new FakeUuidGenerator("seed-a");
    const b = new FakeUuidGenerator("seed-b");
    expect(a.generate()).not.toBe(b.generate());
  });
});
