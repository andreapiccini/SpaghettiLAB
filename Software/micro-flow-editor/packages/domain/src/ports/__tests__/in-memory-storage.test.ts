import { describe, expect, it } from "vitest";
import { InMemoryStorage } from "../fakes/in-memory-storage.js";

describe("InMemoryStorage", () => {
  it("returns null for a key that was never set", async () => {
    const storage = new InMemoryStorage();
    expect(await storage.get("missing")).toBeNull();
  });

  it("round-trips a value through set/get/remove", async () => {
    const storage = new InMemoryStorage();
    await storage.set("project:1", '{"name":"demo"}');
    expect(await storage.get("project:1")).toBe('{"name":"demo"}');
    await storage.remove("project:1");
    expect(await storage.get("project:1")).toBeNull();
  });

  it("filters keys by prefix", async () => {
    const storage = new InMemoryStorage();
    await storage.set("project:1", "a");
    await storage.set("project:2", "b");
    await storage.set("settings:theme", "c");
    expect(await storage.keys("project:")).toEqual(["project:1", "project:2"]);
  });
});
