import type { MarketplacePackManifest } from "./manifest.js";

/**
 * No real PKI/signing implementation exists in this codebase yet — this
 * package never invents one. A caller supplies how a manifest's
 * `PackSignature` is actually checked (e.g. WebCrypto `verify()` against a
 * pinned public key set, or a server-side check this app merely trusts for
 * a local-index provider). Omitting a verifier makes every pack
 * `"UNVERIFIABLE"`, never a guessed `"TRUSTED"` — the conservative default.
 *
 * Generic (default `MarketplacePackManifest`, unchanged for every existing
 * caller) so S104's `profile-resolver.ts` can reuse the exact same
 * TRUSTED/UNTRUSTED/UNVERIFIABLE gate for a `DeviceProfilePackage` — S104
 * point 5: "stesso gancio TrustVerifier di S101", never a second trust
 * concept invented for the new kind.
 */
export type TrustVerifier<T = MarketplacePackManifest> = (manifest: T) => boolean;

export const PackTrust = {
  TRUSTED: "TRUSTED",
  UNTRUSTED: "UNTRUSTED",
  UNVERIFIABLE: "UNVERIFIABLE",
} as const;

export type PackTrustKind = (typeof PackTrust)[keyof typeof PackTrust];

export function checkPackTrust<T = MarketplacePackManifest>(manifest: T, verifier?: TrustVerifier<T>): PackTrustKind {
  if (!verifier) return PackTrust.UNVERIFIABLE;
  return verifier(manifest) ? PackTrust.TRUSTED : PackTrust.UNTRUSTED;
}
