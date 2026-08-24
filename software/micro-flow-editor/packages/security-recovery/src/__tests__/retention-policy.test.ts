import { describe, expect, it, vi } from "vitest";
import { CatalogCache } from "@spaghettilab/core-session";
import { purgeOnLogout, RETENTION_POLICY } from "../retention-policy.js";

describe("purgeOnLogout — S124 point 3", () => {
  it("clears every given CatalogCache in full", () => {
    const cache = new CatalogCache();
    cache.set(new Uint8Array([1]), { fingerprint: new Uint8Array([9]), drivers: [], nextCursor: 0, driverCount: 0, protocolVersion: 1, configVersion: 4 });
    purgeOnLogout([cache], []);
    expect(cache.size).toBe(0);
  });

  it("calls every telemetry-store clear callback", () => {
    const clearA = vi.fn();
    const clearB = vi.fn();
    purgeOnLogout([], [clearA, clearB]);
    expect(clearA).toHaveBeenCalled();
    expect(clearB).toHaveBeenCalled();
  });
});

describe("RETENTION_POLICY", () => {
  it("documents credentials and audit log as surviving logout — never silently purged", () => {
    expect(RETENTION_POLICY.credentials).toContain("persist");
    expect(RETENTION_POLICY.auditLog).toContain("never purged");
  });
});
