import { describe, expect, it } from "vitest";
import { CatalogCache } from "@spaghettilab/core-session";
import { invalidateCatalogAfterOta } from "../catalog-invalidation.js";
import { PostflightOutcome, type PostflightResult } from "../postflight.js";

describe("invalidateCatalogAfterOta — S103 § Verifiche (fingerprint refresh invalidates the cache, per S030)", () => {
  const deviceId = new Uint8Array([1, 2, 3]);

  it("invalidates the device's cache on a confirmed install", () => {
    const cache = new CatalogCache();
    cache.set(deviceId, { fingerprint: new Uint8Array([9]), drivers: [], nextCursor: 0, driverCount: 0, protocolVersion: 1, configVersion: 4 });
    invalidateCatalogAfterOta(cache, deviceId, { kind: PostflightOutcome.CONFIRMED_INSTALLED, reason: "ok" });
    expect(cache.get(deviceId, new Uint8Array([9]))).toBeUndefined();
  });

  it("invalidates the device's cache on a detected rollback too — the device still changed state", () => {
    const cache = new CatalogCache();
    cache.set(deviceId, { fingerprint: new Uint8Array([9]), drivers: [], nextCursor: 0, driverCount: 0, protocolVersion: 1, configVersion: 4 });
    invalidateCatalogAfterOta(cache, deviceId, { kind: PostflightOutcome.ROLLBACK_DETECTED, reason: "rolled back" });
    expect(cache.get(deviceId, new Uint8Array([9]))).toBeUndefined();
  });

  it("does not touch the cache for a WRONG_DEVICE outcome", () => {
    const cache = new CatalogCache();
    cache.set(deviceId, { fingerprint: new Uint8Array([9]), drivers: [], nextCursor: 0, driverCount: 0, protocolVersion: 1, configVersion: 4 });
    const outcome: PostflightResult = { kind: PostflightOutcome.WRONG_DEVICE, reason: "wrong device" };
    invalidateCatalogAfterOta(cache, deviceId, outcome);
    expect(cache.get(deviceId, new Uint8Array([9]))).toBeDefined();
  });
});
