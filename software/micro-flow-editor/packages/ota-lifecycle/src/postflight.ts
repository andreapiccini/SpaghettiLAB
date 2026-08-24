import { bytesEqualHex } from "@spaghettilab/core-session";
import type { OtaCandidateManifest } from "@spaghettilab/ota-preflight";

/**
 * A comparable snapshot of Core identity/feature state — read fresh, over a
 * reconnected transport, both before arming an OTA and after a reboot is
 * observed. This package does no I/O: a caller builds this from real wire
 * reads (`GET_STATUS`'s `version`, `GET_RESOURCES`'s `featureSetHash`,
 * `GET_FEATURES`'s `packs`, `GET_CATALOG`'s `fingerprint`) plus a device ID
 * already known from the session layer (`@spaghettilab/core-session`) — S103
 * point 2's full list (device ID, firmware version, feature-set hash, pack
 * list, Config/profile preservation, catalog fingerprint, resource report)
 * is deliberately split across `deviceId`/`fwVersion`/`featureSetHash`/
 * `packIds`/`catalogFingerprint`/`resourceReport`, plus `configPreserved`/
 * `profilesPreserved` — two booleans a caller computes with
 * `@spaghettilab/config-deployment`'s diff tools and
 * `@spaghettilab/device-profile-install`'s catalog compare, not something
 * this package can derive from CBOR fields alone.
 */
export type PostflightSnapshot = {
  readonly deviceId: Uint8Array;
  readonly fwVersion: string;
  readonly featureSetHash: Uint8Array;
  readonly packIds: readonly string[];
  readonly catalogFingerprint: Uint8Array;
  /** From a post-reboot `GET_RESOURCES` — confirms the image that actually booted declares the budget the candidate promised, not just that *some* new image booted. */
  readonly resourceReport: { readonly flashImageBudgetBytes: number; readonly staticRamBudgetBytes: number };
  readonly configPreserved: boolean;
  readonly profilesPreserved: boolean;
};

export const PostflightOutcome = {
  CONFIRMED_INSTALLED: "CONFIRMED_INSTALLED",
  ROLLBACK_DETECTED: "ROLLBACK_DETECTED",
  WRONG_DEVICE: "WRONG_DEVICE",
  VERSION_MISMATCH: "VERSION_MISMATCH",
  FEATURE_SET_MISMATCH: "FEATURE_SET_MISMATCH",
  RESOURCE_REPORT_MISMATCH: "RESOURCE_REPORT_MISMATCH",
  CONFIG_NOT_PRESERVED: "CONFIG_NOT_PRESERVED",
  PROFILES_NOT_PRESERVED: "PROFILES_NOT_PRESERVED",
} as const;

export type PostflightOutcomeKind = (typeof PostflightOutcome)[keyof typeof PostflightOutcome];

export type PostflightResult = {
  readonly kind: PostflightOutcomeKind;
  readonly reason: string;
};

function bytesEqual(a: Uint8Array, b: Uint8Array): boolean {
  return a.length === b.length && a.every((byte, i) => byte === b[i]);
}

/**
 * "un fallimento OTA/rollback non produce mai uno stato 'installato' falso"
 * (S103 § Fine task) — this is the gate a caller must pass before *ever*
 * marking a deploy/audit record "installed". Checks run in a fixed order:
 * device identity first (a mismatch here means "wrong Core", everything
 * else is meaningless), then whether the running version still matches the
 * *pre*-OTA version (a `ROLLBACK_DETECTED` — MCUboot swapped back
 * automatically, this package never calls a "confirm" operation because
 * none is exposed to any transport), then whether it matches the candidate
 * (anything else is a real mismatch, not a rollback), then feature-set hash,
 * then Config/profile preservation. Config/profile preservation are checked
 * last only because they're least likely to be the actual root cause when
 * something upstream already failed — a caller can still inspect the
 * `before`/`after` snapshots directly for a fuller diagnosis.
 */
export function evaluatePostflight(before: PostflightSnapshot, after: PostflightSnapshot, candidate: OtaCandidateManifest): PostflightResult {
  if (!bytesEqual(before.deviceId, after.deviceId)) {
    return { kind: PostflightOutcome.WRONG_DEVICE, reason: "post-OTA device id does not match the Core this OTA was performed on — never mark installed" };
  }

  if (after.fwVersion === before.fwVersion) {
    return { kind: PostflightOutcome.ROLLBACK_DETECTED, reason: `running version "${after.fwVersion}" still matches the pre-OTA version — MCUboot rolled back automatically (trial image never confirmed)` };
  }

  if (after.fwVersion !== candidate.fwVersion) {
    return { kind: PostflightOutcome.VERSION_MISMATCH, reason: `running version "${after.fwVersion}" matches neither the pre-OTA version nor the candidate's declared "${candidate.fwVersion}"` };
  }

  if (!bytesEqualHex(after.featureSetHash, candidate.featureSetHash)) {
    return { kind: PostflightOutcome.FEATURE_SET_MISMATCH, reason: "running feature-set hash does not match the candidate's declared feature-set hash" };
  }

  if (after.resourceReport.flashImageBudgetBytes !== candidate.flashImageBudgetBytes || after.resourceReport.staticRamBudgetBytes !== candidate.staticRamBudgetBytes) {
    return { kind: PostflightOutcome.RESOURCE_REPORT_MISMATCH, reason: "post-reboot GET_RESOURCES budget fields do not match the candidate's declared budget — the booted image may not be the one that was transferred" };
  }

  if (!after.configPreserved) {
    return { kind: PostflightOutcome.CONFIG_NOT_PRESERVED, reason: "Config was not preserved across the OTA" };
  }

  if (!after.profilesPreserved) {
    return { kind: PostflightOutcome.PROFILES_NOT_PRESERVED, reason: "installed Device Profiles were not preserved across the OTA" };
  }

  return { kind: PostflightOutcome.CONFIRMED_INSTALLED, reason: "device identity, version, feature-set hash, Config and profiles all match expectations post-reboot" };
}
