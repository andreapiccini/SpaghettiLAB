import { describe, expect, it } from "vitest";
import { InMemoryCredentialStore } from "../fakes/in-memory-credential-store.js";

describe("InMemoryCredentialStore", () => {
  it("returns null for a reference that was never set", async () => {
    const store = new InMemoryCredentialStore();
    expect(await store.get("conn:mqtt-1")).toBeNull();
  });

  it("round-trips a secret through set/get/remove, addressed only by reference", async () => {
    const store = new InMemoryCredentialStore();
    await store.set("conn:mqtt-1", "super-secret-token");
    expect(await store.get("conn:mqtt-1")).toBe("super-secret-token");
    await store.remove("conn:mqtt-1");
    expect(await store.get("conn:mqtt-1")).toBeNull();
  });
});
