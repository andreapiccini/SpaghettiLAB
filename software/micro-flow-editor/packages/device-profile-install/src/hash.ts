/**
 * `struct spaghetti_device_profile.hash` (`device_profile.h`) is "SHA-256 of
 * installed bytes" — the real algorithm, unlike
 * `@spaghettilab/device-profile-package`'s `contentHash` (an FNV-1a
 * fingerprint over JSON, explicitly documented there as *not* this hash).
 * Now that `encodeDeviceProfileCbor` produces the real wire bytes, this
 * package can finally compute the real SHA-256 too — via the standard Web
 * Crypto `SubtleCrypto` API (available in every modern browser and in
 * Node without any import, unlike `node:crypto`), keeping this package
 * runtime-agnostic the same way `@spaghettilab/domain`'s `hash.ts` stays
 * dependency-free.
 */
export async function sha256(bytes: Uint8Array): Promise<Uint8Array> {
  const digest = await crypto.subtle.digest("SHA-256", bytes.slice().buffer as ArrayBuffer);
  return new Uint8Array(digest);
}

export function bytesEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i += 1) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}
