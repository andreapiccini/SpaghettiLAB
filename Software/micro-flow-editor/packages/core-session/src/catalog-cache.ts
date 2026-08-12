import type { GetCatalogResponse } from "@spaghettilab/protocol-sdk";
import { bytesToHex as toHex } from "./hex.js";

/**
 * Catalog cache indexed by **device ID + fingerprint together** (S030 point
 * 4) — never fingerprint alone. Two Cores that happen to run the identical
 * catalog (same fingerprint) still get separate entries, because they are
 * different physical devices with independent Config/state; sharing a cache
 * entry between them would be exactly the bug S030's own verification rules
 * out ("due Core con stesso catalogo ma device ID distinti non condividono
 * Config/cache").
 */
export class CatalogCache {
  private readonly entries = new Map<string, GetCatalogResponse>();

  private key(deviceId: Uint8Array, fingerprint: Uint8Array): string {
    return `${toHex(deviceId)}:${toHex(fingerprint)}`;
  }

  get(deviceId: Uint8Array, fingerprint: Uint8Array): GetCatalogResponse | undefined {
    return this.entries.get(this.key(deviceId, fingerprint));
  }

  set(deviceId: Uint8Array, catalog: GetCatalogResponse): void {
    this.entries.set(this.key(deviceId, catalog.fingerprint), catalog);
  }

  /**
   * Drops every cached entry for this device, regardless of fingerprint —
   * "invalida tutto dopo OTA o fingerprint diverso" (S030 point 4): once the
   * device's catalog has changed, every prior assumption tied to that
   * device's old state is suspect, not just the one fingerprint that
   * happened to differ.
   */
  invalidateDevice(deviceId: Uint8Array): void {
    const prefix = `${toHex(deviceId)}:`;
    for (const key of this.entries.keys()) {
      if (key.startsWith(prefix)) this.entries.delete(key);
    }
  }

  get size(): number {
    return this.entries.size;
  }
}
