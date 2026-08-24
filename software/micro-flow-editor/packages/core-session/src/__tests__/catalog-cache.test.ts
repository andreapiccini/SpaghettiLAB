import { describe, expect, it } from "vitest";
import { CatalogCache } from "../catalog-cache.js";
import type { GetCatalogResponse } from "@spaghettilab/protocol-sdk";

function catalog(fingerprintByte: number): GetCatalogResponse {
  return {
    protocolVersion: 1,
    configVersion: 5,
    fingerprint: new Uint8Array(32).fill(fingerprintByte),
    drivers: [],
    nextCursor: 0,
    driverCount: 0,
  };
}

const DEVICE_A = new Uint8Array([1, 1, 1, 1]);
const DEVICE_B = new Uint8Array([2, 2, 2, 2]);

describe("CatalogCache", () => {
  it("returns undefined for a device/fingerprint combination never cached", () => {
    const cache = new CatalogCache();
    expect(cache.get(DEVICE_A, catalog(1).fingerprint)).toBeUndefined();
  });

  it("caches and retrieves by device ID + fingerprint together", () => {
    const cache = new CatalogCache();
    const c = catalog(1);
    cache.set(DEVICE_A, c);
    expect(cache.get(DEVICE_A, c.fingerprint)).toBe(c);
  });

  it("does not share a cache entry between two devices with the identical fingerprint", () => {
    const cache = new CatalogCache();
    const shared = catalog(7);
    cache.set(DEVICE_A, shared);

    expect(cache.get(DEVICE_B, shared.fingerprint)).toBeUndefined();
    expect(cache.size).toBe(1);
  });

  it("invalidateDevice drops every cached fingerprint for that device only", () => {
    const cache = new CatalogCache();
    const first = catalog(1);
    const second = catalog(2);
    cache.set(DEVICE_A, first);
    cache.set(DEVICE_A, second);
    cache.set(DEVICE_B, catalog(1));

    cache.invalidateDevice(DEVICE_A);

    expect(cache.get(DEVICE_A, first.fingerprint)).toBeUndefined();
    expect(cache.get(DEVICE_A, second.fingerprint)).toBeUndefined();
    expect(cache.get(DEVICE_B, catalog(1).fingerprint)).toBeDefined();
  });

  it("clear drops every cached entry for every device — the logout case (S124)", () => {
    const cache = new CatalogCache();
    cache.set(DEVICE_A, catalog(1));
    cache.set(DEVICE_B, catalog(2));

    cache.clear();

    expect(cache.size).toBe(0);
    expect(cache.get(DEVICE_A, catalog(1).fingerprint)).toBeUndefined();
    expect(cache.get(DEVICE_B, catalog(2).fingerprint)).toBeUndefined();
  });
});
