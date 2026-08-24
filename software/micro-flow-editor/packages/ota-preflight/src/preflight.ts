import type { GetResourcesResponse } from "@spaghettilab/protocol-sdk";
import type { OtaCandidateManifest } from "./candidate-manifest.js";
import { ConfigMigrationPolicy } from "./candidate-manifest.js";
import { compareResourceBudget, type BudgetDelta } from "./resource-budget-diff.js";
import { checkArmEligibility, UpdateState } from "./update-coordinator-state.js";

export const PreflightOutcome = {
  READY: "READY",
  REJECTED_UNTRUSTED: "REJECTED_UNTRUSTED",
  REJECTED_HASH_MISMATCH: "REJECTED_HASH_MISMATCH",
  REJECTED_CORE_VARIANT: "REJECTED_CORE_VARIANT",
  REJECTED_RESOURCE_PROFILE: "REJECTED_RESOURCE_PROFILE",
  REJECTED_COORDINATOR_BUSY: "REJECTED_COORDINATOR_BUSY",
  REJECTED_POSSIBLE_DOWNGRADE: "REJECTED_POSSIBLE_DOWNGRADE",
  REJECTED_BOOTLOADER_TOO_OLD: "REJECTED_BOOTLOADER_TOO_OLD",
  REJECTED_PROTOCOL_TOO_OLD: "REJECTED_PROTOCOL_TOO_OLD",
  REJECTED_CONFIG_VERSION_TOO_OLD: "REJECTED_CONFIG_VERSION_TOO_OLD",
  REJECTED_ABI_TOO_NEW: "REJECTED_ABI_TOO_NEW",
  REJECTED_CONFIG_TYPE_REMOVED: "REJECTED_CONFIG_TYPE_REMOVED",
  REJECTED_BUDGET_EXCEEDED: "REJECTED_BUDGET_EXCEEDED",
} as const;

export type PreflightOutcomeKind = (typeof PreflightOutcome)[keyof typeof PreflightOutcome];

export type PreflightResult = {
  readonly kind: PreflightOutcomeKind;
  /** Always present — S102 § Verifiche: a rejection is never a generic "non c'è spazio"/"incompatible", it names exactly what failed. */
  readonly reason: string;
  /** Only set for `REJECTED_BUDGET_EXCEEDED` — the explicit per-dimension delta, never a single summed number. */
  readonly budgetDeltas?: readonly BudgetDelta[];
};

export type CoreOtaContext = {
  readonly coreVariant: string;
  readonly resourceProfile: number;
  /** From `GET_CATALOG`'s `protocolVersion`/`configVersion` — the wire/Config schema versions this Core actually runs. */
  readonly protocolVersion: number;
  readonly configVersion: number;
  /** From `GetStatusResponse.version`. */
  readonly currentFwVersion: string;
  readonly updateState: UpdateState;
  readonly resources: GetResourcesResponse;
  /**
   * No wire field reports the installed bootloader's version — caller-supplied,
   * omit to skip this check entirely rather than compare against a guess.
   */
  readonly currentBootloaderVersion?: string;
  /**
   * Type ids the live Config actually uses — same caller-supplied,
   * conservative-when-absent pattern as `@spaghettilab/capability-marketplace`'s
   * `computeRequiredArtifacts`. Omitting it skips the Config-type-removal
   * check (never assumes nothing is used).
   */
  readonly usedTypeIds?: ReadonlySet<string>;
};

/**
 * Same "no real PKI implemented here" stance as
 * `@spaghettilab/capability-marketplace`'s `TrustVerifier` — a caller
 * supplies how `candidate.signature` is actually checked. Omitting it
 * rejects every candidate as untrusted, never a guessed pass.
 */
export type OtaTrustVerifier = (candidate: OtaCandidateManifest) => boolean;

export type PreflightOptions = {
  readonly trustVerifier?: OtaTrustVerifier;
  /** An independently-obtained hash to check the candidate's declared `hash` against (e.g. from a separate signed release index) — omit to skip. */
  readonly expectedHash?: string;
  readonly buildCapacityOverrides?: { readonly stackBytes?: number; readonly poolBytes?: number; readonly workspaceBytes?: number };
};

function ready(): PreflightResult {
  return { kind: PreflightOutcome.READY, reason: "candidate is compatible, trusted and fits the declared build capacity" };
}

function rejected(kind: PreflightOutcomeKind, reason: string): PreflightResult {
  return { kind, reason };
}

/**
 * Local, pre-transfer prediction of whether `candidate` can install safely —
 * never a live wire call, since no `VALIDATE_OTA_CANDIDATE`-style operation
 * exists (unlike `VALIDATE_CONFIG`/`VALIDATE_DEVICE_PROFILE`). The real,
 * authoritative check is firmware-side, in
 * `spaghetti_image_manifest_validate_candidate()`, which only runs *after*
 * the candidate has already been transferred
 * (`spaghetti_update_finish()`). This function exists so a caller almost
 * never discovers a rejection only after paying for the transfer — it
 * cannot make that transfer step unnecessary.
 *
 * Checks run in a fixed order — trust, hash, variant, resource profile,
 * coordinator/slot state, downgrade, bootloader, protocol/Config/ABI
 * version floors, Config type retention, then budget — stopping at the
 * first failure, each with an explicit `reason`.
 */
export function preflightOtaCandidate(candidate: OtaCandidateManifest, core: CoreOtaContext, options?: PreflightOptions): PreflightResult {
  const trusted = options?.trustVerifier?.(candidate) ?? false;
  if (!trusted) {
    return rejected(PreflightOutcome.REJECTED_UNTRUSTED, options?.trustVerifier ? "candidate signature did not verify" : "no trust verifier supplied — candidate is unverifiable, never assumed trusted");
  }

  if (options?.expectedHash !== undefined && options.expectedHash !== candidate.hash) {
    return rejected(PreflightOutcome.REJECTED_HASH_MISMATCH, `declared hash "${candidate.hash}" does not match the expected hash "${options.expectedHash}"`);
  }

  if (candidate.coreVariant !== core.coreVariant) {
    return rejected(PreflightOutcome.REJECTED_CORE_VARIANT, `candidate targets core variant "${candidate.coreVariant}", this Core is "${core.coreVariant}"`);
  }

  if (candidate.resourceProfile !== core.resourceProfile) {
    return rejected(PreflightOutcome.REJECTED_RESOURCE_PROFILE, `candidate targets resource profile ${candidate.resourceProfile}, this Core runs profile ${core.resourceProfile}`);
  }

  const arm = checkArmEligibility(core.updateState);
  if (!arm.canArm) {
    return rejected(PreflightOutcome.REJECTED_COORDINATOR_BUSY, arm.reason);
  }

  if (candidate.fwVersion < core.currentFwVersion) {
    return rejected(
      PreflightOutcome.REJECTED_POSSIBLE_DOWNGRADE,
      `candidate version "${candidate.fwVersion}" sorts before the running version "${core.currentFwVersion}" — MCUboot's CONFIG_MCUBOOT_BOOTLOADER_NO_DOWNGRADE will reject this at swap time regardless, this is only an earlier warning`,
    );
  }

  if (core.currentBootloaderVersion !== undefined && candidate.bootloaderMin > core.currentBootloaderVersion) {
    return rejected(PreflightOutcome.REJECTED_BOOTLOADER_TOO_OLD, `candidate requires bootloader >= "${candidate.bootloaderMin}", this Core reports "${core.currentBootloaderVersion}"`);
  }

  if (candidate.minProtocolVersion > core.protocolVersion) {
    return rejected(PreflightOutcome.REJECTED_PROTOCOL_TOO_OLD, `candidate requires protocol version >= ${candidate.minProtocolVersion}, this Core runs ${core.protocolVersion}`);
  }

  if (candidate.minConfigVersion > core.configVersion) {
    return rejected(PreflightOutcome.REJECTED_CONFIG_VERSION_TOO_OLD, `candidate requires Config version >= ${candidate.minConfigVersion}, this Core runs ${core.configVersion}`);
  }

  if (core.usedTypeIds && candidate.configMigrationPolicy === ConfigMigrationPolicy.REJECT_REMOVAL) {
    const removed = [...core.usedTypeIds].filter((typeId) => !candidate.providedTypeIds.has(typeId));
    if (removed.length > 0) {
      return rejected(
        PreflightOutcome.REJECTED_CONFIG_TYPE_REMOVED,
        `candidate no longer provides type(s) [${removed.join(", ")}] the live Config uses, and declares REJECT_REMOVAL (no explicit migration)`,
      );
    }
  }

  const budget = compareResourceBudget(candidate, core.resources, options?.buildCapacityOverrides);
  if (!budget.fits) {
    const failing = budget.deltas.filter((d) => d.marginBytes < 0);
    return { kind: PreflightOutcome.REJECTED_BUDGET_EXCEEDED, reason: `candidate exceeds declared build capacity in ${failing.map((d) => d.dimension).join(", ")}`, budgetDeltas: budget.deltas };
  }

  return ready();
}
