import { DeviceProfileOpcode } from "@spaghettilab/device-profile-authoring-model";
import type { DeviceProfileSummary, GetResourcesResponse } from "@spaghettilab/protocol-sdk";
import type { DeviceProfilePackage } from "./package.js";

/** The six outcomes S062 point 3 asks for — a closed set, not a free-form string. */
export const InstallResolution = {
  READY: "READY",
  PROFILE_INSTALL_REQUIRED: "PROFILE_INSTALL_REQUIRED",
  FIRMWARE_UPDATE_REQUIRED: "FIRMWARE_UPDATE_REQUIRED",
  HARDWARE_INCOMPATIBLE: "HARDWARE_INCOMPATIBLE",
  RESOURCE_INCOMPATIBLE: "RESOURCE_INCOMPATIBLE",
  VERSION_CONFLICT: "VERSION_CONFLICT",
} as const;

export type InstallResolutionKind = (typeof InstallResolution)[keyof typeof InstallResolution];

export type InstallResolutionResult = {
  readonly kind: InstallResolutionKind;
  /** Only set for `FIRMWARE_UPDATE_REQUIRED` — opcodes the package depends on that this Core's known vocabulary doesn't have. */
  readonly missingOpcodes?: readonly number[];
  /** Best-effort, caller-supplied suggestions for which Capability Pack would provide a missing opcode — never invented when the caller doesn't supply a mapping (the wire has no opcode-to-pack index). */
  readonly suggestedCapabilityPacks?: readonly string[];
};

export type CoreInstallContext = {
  readonly installedProfiles: readonly DeviceProfileSummary[];
  /** Defaults to every opcode this package's own closed vocabulary (`DeviceProfileOpcode`) knows — correct as long as the Core runs opcode vocabulary version 1, the only version that exists today. Override for forward-compatibility testing against a hypothetical newer/older vocabulary. */
  readonly knownOpcodes?: ReadonlySet<number>;
  /** `PortCapability` bitmask actually available on the target Port/Bay — resolved by the caller (e.g. from `@spaghettilab/physical-composition-model`'s topology data), never assumed here. Omit to skip the hardware-compatibility check entirely. */
  readonly availableCapabilities?: number;
  /** From `GET_RESOURCES` — used only for its `profiles` pool (installed-profile slot capacity). Omit to skip the resource check. */
  readonly resources?: GetResourcesResponse;
};

export type ResolveProfileInstallOptions = {
  readonly capabilityPackForOpcode?: (opcode: number) => string | undefined;
  /**
   * Whether `pkg`'s content matches an already-installed profile with the
   * same id+version. Caller-supplied because this package never produces
   * the real wire CBOR (see the package README) — it cannot compute the
   * firmware's own SHA-256 over installed bytes to compare against
   * `DeviceProfileSummary.hash` itself. Omitting this makes any same
   * id+version match resolve to `VERSION_CONFLICT` rather than a guessed
   * `READY` — the conservative default, never a false positive.
   */
  readonly matchesInstalled?: (installed: DeviceProfileSummary) => boolean;
};

const DEFAULT_KNOWN_OPCODES = new Set<number>(Object.values(DeviceProfileOpcode));

/**
 * Decides what must happen before `pkg` can run on a Core, from local data
 * only — never a live `VALIDATE_DEVICE_PROFILE`/`INSTALL_DEVICE_PROFILE`
 * call (S062 point 1: "prima di qualunque azione remota"). Checks run in a
 * fixed priority order — firmware/hardware blockers first, then identity,
 * then resource capacity — so exactly one outcome is ever returned.
 */
export function resolveProfileInstall(
  pkg: DeviceProfilePackage,
  context: CoreInstallContext,
  options?: ResolveProfileInstallOptions,
): InstallResolutionResult {
  const known = context.knownOpcodes ?? DEFAULT_KNOWN_OPCODES;
  const missingOpcodes = pkg.opcodeDependencies.filter((op) => !known.has(op));
  if (missingOpcodes.length > 0) {
    const suggestedCapabilityPacks = options?.capabilityPackForOpcode
      ? [...new Set(missingOpcodes.map(options.capabilityPackForOpcode).filter((x): x is string => x !== undefined))]
      : [];
    return { kind: InstallResolution.FIRMWARE_UPDATE_REQUIRED, missingOpcodes, suggestedCapabilityPacks };
  }

  if (context.availableCapabilities !== undefined) {
    const missingCapabilityBits = pkg.requiredCapabilities & ~context.availableCapabilities;
    if (missingCapabilityBits !== 0) {
      return { kind: InstallResolution.HARDWARE_INCOMPATIBLE };
    }
  }

  const sameIdVersion = context.installedProfiles.filter((p) => p.profileId === pkg.profileId && p.version === pkg.version);
  if (sameIdVersion.length > 0) {
    const matched = options?.matchesInstalled ? sameIdVersion.find(options.matchesInstalled) : undefined;
    if (matched) {
      return { kind: InstallResolution.READY };
    }
    return { kind: InstallResolution.VERSION_CONFLICT };
  }

  if (context.resources && context.resources.profiles.used >= context.resources.profiles.capacity) {
    return { kind: InstallResolution.RESOURCE_INCOMPATIBLE };
  }

  return { kind: InstallResolution.PROFILE_INSTALL_REQUIRED };
}
