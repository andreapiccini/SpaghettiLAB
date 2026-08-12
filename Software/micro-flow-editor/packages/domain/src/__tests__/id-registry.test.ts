import { describe, expect, it } from "vitest";
import { IdRegistry } from "../id-registry.js";
import { DomainErrorCode } from "../errors.js";

describe("IdRegistry", () => {
  it("registers a new ID and resolves it afterwards", () => {
    const registry = new IdRegistry<string>("Module");
    const result = registry.register("module-1");
    expect(result).toEqual({ ok: true, value: "module-1" });
    expect(registry.has("module-1")).toBe(true);
    expect(registry.resolve("module-1")).toEqual({ ok: true, value: "module-1" });
  });

  it("rejects registering the same ID twice", () => {
    const registry = new IdRegistry<string>("Module");
    registry.register("module-1");
    const result = registry.register("module-1");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe(DomainErrorCode.DUPLICATE_ID);
      expect(result.error.target).toBe("module-1");
    }
    // The registry still only counts it once — a rejected duplicate isn't
    // silently added anyway.
    expect(registry.size).toBe(1);
  });

  it("rejects resolving an ID that was never registered (dangling reference)", () => {
    const registry = new IdRegistry<string>("Rule");
    const result = registry.resolve("rule-missing");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe(DomainErrorCode.DANGLING_REFERENCE);
      expect(result.error.path).toEqual(["Rule"]);
      expect(result.error.target).toBe("rule-missing");
    }
  });

  it("unregister makes a previously valid ID dangling again", () => {
    const registry = new IdRegistry<string>("Block");
    registry.register("block-1");
    registry.unregister("block-1");
    expect(registry.has("block-1")).toBe(false);
    expect(registry.resolve("block-1").ok).toBe(false);
  });
});
