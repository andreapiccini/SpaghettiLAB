import { resolveProfileInstall, type CoreInstallContext, type DeviceProfilePackage, type InstallResolutionResult, type ResolveProfileInstallOptions } from "@spaghettilab/device-profile-package";
import type { MarketplaceCatalog } from "./marketplace-catalog.js";
import { checkPackTrust, PackTrust, type TrustVerifier } from "./trust.js";

export type ProfileResolutionResult =
  | { readonly kind: "RESOLVED"; readonly manifest: DeviceProfilePackage; readonly install: InstallResolutionResult }
  | { readonly kind: "NOT_FOUND"; readonly reason: string }
  | { readonly kind: "UNTRUSTED"; readonly manifest: DeviceProfilePackage; readonly reason: string };

/** Highest version first — same deterministic-candidate-ordering rule as `dependency-resolver.ts`'s `sortCandidates`. */
function sortProfileCandidates(candidates: readonly DeviceProfilePackage[]): readonly DeviceProfilePackage[] {
  return [...candidates].sort((a, b) => b.version - a.version);
}

/**
 * Resolves one Device Profile requirement against the marketplace catalog's
 * `profiles` list (S104 point 4). Deliberately **not** folded into
 * `resolveDependencies()` (S101's firmware-pack resolver, which never
 * arms/refuses OTA on its own either) — S104 requires reusing S062's own
 * six outcomes verbatim (`resolveProfileInstall`), the exact same logic
 * Device Profile Studio already runs, never a second resolver that could
 * disagree with it.
 *
 * A profile is never installed by triggering an OTA — `RESOLVED`'s
 * `install` may still be `FIRMWARE_UPDATE_REQUIRED` (the profile package
 * itself was found, but the Core's opcode vocabulary doesn't cover what it
 * needs yet); that is a *declared* dependency the caller shows, never an
 * implicit OTA this function starts by itself (S104's own "Non far scattare
 * S102/S103 per install-device-profile").
 *
 * `capabilityPackForOpcode` (via `options`) is passed straight through to
 * `resolveProfileInstall` — this package still has no real opcode→pack
 * index to build one from (`MarketplacePackManifest.providedTypes` never
 * declared opcodes; confirmed, not merely unbuilt), so a caller wanting
 * "which pack fixes this" supplies the mapping itself, same as S062 always
 * required.
 *
 * `trustVerifier` reuses `trust.ts`'s TRUSTED/UNTRUSTED/UNVERIFIABLE gate
 * (S104 point 5): an untrusted-or-unverifiable profile resolves to
 * `UNTRUSTED` here and is never handed to `resolveProfileInstall` at all —
 * same "never even considered for install" treatment `dependency-resolver.ts`
 * already gives an untrusted firmware pack.
 */
export function resolveProfileRequirement(
  profileId: string,
  catalog: MarketplaceCatalog,
  context: CoreInstallContext,
  options?: ResolveProfileInstallOptions & { readonly trustVerifier?: TrustVerifier<DeviceProfilePackage> },
): ProfileResolutionResult {
  const candidates = sortProfileCandidates(catalog.profiles.filter((p) => p.profileId === profileId));
  if (candidates.length === 0) {
    return { kind: "NOT_FOUND", reason: `no marketplace entry provides device profile "${profileId}"` };
  }
  const manifest = candidates[0]!;
  const trust = checkPackTrust(manifest, options?.trustVerifier);
  if (trust !== PackTrust.TRUSTED) {
    return { kind: "UNTRUSTED", manifest, reason: `device profile signature is ${trust}, not trusted` };
  }
  const install = resolveProfileInstall(manifest, context, options);
  return { kind: "RESOLVED", manifest, install };
}
