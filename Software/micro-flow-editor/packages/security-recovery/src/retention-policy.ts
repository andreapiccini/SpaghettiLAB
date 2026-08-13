import type { CatalogCache } from "@spaghettilab/core-session";

/**
 * S124 point 3: "definisci retention/cache purge/logout". A closed,
 * documented list of what local state exists and how long it lives — so
 * "what does logout actually clear" has one real answer instead of being
 * reverse-engineered from whatever code happens to run.
 */
export const RETENTION_POLICY = {
  /** `@spaghettilab/core-session`'s `CatalogCache` — cleared entirely on logout via its `clear()` (added for this task; previously only per-device `invalidateDevice()` existed). */
  catalogCache: "cleared on logout",
  /** `@spaghettilab/telemetry-buffer`'s `TelemetryBufferStore` — in-memory only, bounded per (Core, schema); cleared on logout the same way, via a caller-supplied clear callback (that package owns its own store shape). */
  telemetryBuffer: "cleared on logout",
  /** `@spaghettilab/domain`'s `CredentialStore` entries — survive logout by design (re-entering every credential each session would defeat the point of a credential store); only an explicit `confirmCredentialRemoval()` clears one. */
  credentials: "persist across logout — explicit removal only",
  /** `@spaghettilab/domain`'s `AuditLog` — append-only, never purged by logout or by this package; retention is an operator/deployment decision outside this app's scope. */
  auditLog: "never purged by this app",
} as const;

/**
 * Everything logout actually clears, matching `RETENTION_POLICY` exactly:
 * every known `CatalogCache` in full (not per-device — a new session must
 * not inherit any of a previous session's cached reads) and every
 * caller-supplied telemetry-store clear callback. `credentialStore`/
 * `auditLog` are deliberately absent from this function's parameters —
 * there is no code path here that could touch either.
 */
export function purgeOnLogout(catalogCaches: readonly CatalogCache[], telemetryStoreClears: readonly (() => void)[]): void {
  for (const cache of catalogCaches) {
    cache.clear();
  }
  for (const clear of telemetryStoreClears) {
    clear();
  }
}
