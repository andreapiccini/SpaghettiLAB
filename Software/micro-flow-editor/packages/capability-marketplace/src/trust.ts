import type { MarketplacePackManifest } from "./manifest.js";

/**
 * No real PKI/signing implementation exists in this codebase yet — this
 * package never invents one. A caller supplies how a manifest's
 * `PackSignature` is actually checked (e.g. WebCrypto `verify()` against a
 * pinned public key set, or a server-side check this app merely trusts for
 * a local-index provider). Omitting a verifier makes every pack
 * `"UNVERIFIABLE"`, never a guessed `"TRUSTED"` — the conservative default.
 */
export type TrustVerifier = (manifest: MarketplacePackManifest) => boolean;

export const PackTrust = {
  TRUSTED: "TRUSTED",
  UNTRUSTED: "UNTRUSTED",
  UNVERIFIABLE: "UNVERIFIABLE",
} as const;

export type PackTrustKind = (typeof PackTrust)[keyof typeof PackTrust];

export function checkPackTrust(manifest: MarketplacePackManifest, verifier?: TrustVerifier): PackTrustKind {
  if (!verifier) return PackTrust.UNVERIFIABLE;
  return verifier(manifest) ? PackTrust.TRUSTED : PackTrust.UNTRUSTED;
}
