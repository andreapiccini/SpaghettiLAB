import type { CatalogCache } from "@spaghettilab/core-session";
import { PostflightOutcome, type PostflightResult } from "./postflight.js";

/**
 * "un fingerprint refresh dopo OTA invalida la cache del catalogo
 * coerentemente con S030" (S103 § Verifiche) — reuses
 * `@spaghettilab/core-session`'s existing `CatalogCache.invalidateDevice()`
 * (S030 point 4) rather than reimplementing cache invalidation. Called for
 * every postflight outcome except `WRONG_DEVICE` (nothing useful to say
 * about a different Core's cache) — a rollback still changed what the
 * device reports, so its cache is invalidated too, not only a confirmed
 * install.
 */
export function invalidateCatalogAfterOta(cache: CatalogCache, deviceId: Uint8Array, postflight: PostflightResult): void {
  if (postflight.kind === PostflightOutcome.WRONG_DEVICE) return;
  cache.invalidateDevice(deviceId);
}
