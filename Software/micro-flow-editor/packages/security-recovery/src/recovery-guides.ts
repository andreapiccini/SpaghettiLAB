/**
 * Guided recovery for the six scenarios S124 point 2 names: Core replaced,
 * device ID mismatch, Config corrupt/absent, catalog incompatible, OTA
 * rollback, Node-RED unreachable. Every plan is an ordered list of explicit
 * steps a human (or a calling UI) carries out one at a time — this module
 * never performs a step itself, and no step is ever destructive by default
 * (S124 § Verifiche: "nessuna azione distruttiva implicita"). A step that
 * *would* be destructive (e.g. clearing a stale binding) is phrased as its
 * own explicit action, gated by `destructive-confirmation.ts` when the
 * caller actually invokes it — this module only describes what to do, never
 * does it.
 */

export type RecoveryStep = {
  readonly step: string;
  readonly destructive: boolean;
};

export type RecoveryPlan = {
  readonly scenario: string;
  readonly steps: readonly RecoveryStep[];
};

const step = (step: string, destructive = false): RecoveryStep => ({ step, destructive });

/** A Core's reported device id no longer matches `CoreBindingRecord.expectedDeviceId` — physically replaced hardware, not a software fault. */
export function coreReplacedRecoveryPlan(bindingName: string, expectedDeviceId: string, observedDeviceId: string): RecoveryPlan {
  return {
    scenario: "core-replaced",
    steps: [
      step(`Confirm this is expected: binding "${bindingName}" expected device ${expectedDeviceId}, observed ${observedDeviceId}.`),
      step("If replaced deliberately, update the CoreBinding's expectedDeviceId to the new device — this does not touch Config or Project data."),
      step("Re-run catalog/GET_CAPABILITIES read against the new device to confirm compatibility before any deploy.", false),
      step("Only after compatibility is confirmed, redeploy Config to the new device explicitly.", true),
    ],
  };
}

/** Same underlying signal as `coreReplacedRecoveryPlan`, but the caller hasn't yet decided whether it's a legitimate replacement or an error (wrong Core, spoofed identity, cabling swap). */
export function deviceIdMismatchRecoveryPlan(bindingName: string, expectedDeviceId: string, observedDeviceId: string): RecoveryPlan {
  return {
    scenario: "device-id-mismatch",
    steps: [
      step(`Do not deploy or send commands to binding "${bindingName}" until this is resolved — expected ${expectedDeviceId}, observed ${observedDeviceId}.`),
      step("Verify physical/network identity out of band (serial number, port, MAC) before trusting either device id."),
      step("If the mismatch is a genuine replacement, follow coreReplacedRecoveryPlan() next."),
      step("If unexplained, treat the connection as untrusted and disconnect until identity is confirmed.", false),
    ],
  };
}

/** `GET_CONFIG` failed, returned malformed CBOR, or the device reports no Config at all. */
export function configCorruptOrAbsentRecoveryPlan(): RecoveryPlan {
  return {
    scenario: "config-corrupt-or-absent",
    steps: [
      step("Read GET_STATUS/GET_CAPABILITIES to confirm the Core is otherwise healthy before assuming Config itself is the fault."),
      step("If the Project has a last-known-good Config, run VALIDATE_CONFIG against it locally before proposing a deploy."),
      step("Deploy the validated Config via the normal compare-and-swap path (@spaghettilab/config-deployment) — never a raw/unvalidated write.", true),
      step("If no last-known-good Config exists, the Core remains in its safe unprovisioned mode (SPAGHETTI_CORE_MODE_UNPROVISIONED) until a new Config is authored — this is the firmware's own safe default, not a fault to work around."),
    ],
  };
}

/** The device's catalog (Module Drivers / Capability Packs) doesn't satisfy what the Project's Config or required artifacts need. */
export function catalogIncompatibleRecoveryPlan(): RecoveryPlan {
  return {
    scenario: "catalog-incompatible",
    steps: [
      step("Re-read GET_CATALOG/GET_FEATURES to rule out a stale cached view before concluding real incompatibility (@spaghettilab/core-session's CatalogCache.invalidateDevice() first)."),
      step("Resolve the missing artifacts via @spaghettilab/capability-marketplace's resolveDependencies() — never assume a Capability Pack is unavailable without checking the marketplace catalog."),
      step("If a resolution exists, run the OTA preflight/build-selection path (S102) before any transfer."),
      step("If no resolution exists, the incompatible Config/artifact must be edited or removed from the Project — do not force-deploy against a Core that cannot run it.", true),
    ],
  };
}

/** Mirrors `@spaghettilab/ota-lifecycle`'s `PostflightOutcome.ROLLBACK_DETECTED` (S103) — the trial image never confirmed and MCUboot swapped back automatically. */
export function otaRollbackRecoveryPlan(candidateVersion: string, runningVersion: string): RecoveryPlan {
  return {
    scenario: "ota-rollback",
    steps: [
      step(`Confirm the rollback: running version is "${runningVersion}", the OTA candidate was "${candidateVersion}" — MCUboot already reverted, no further Core-side action needed.`),
      step("Config and installed Device Profiles survive a rollback by construction — verify via GET_CONFIG/LIST_DEVICE_PROFILES, do not assume, but do not re-provision reflexively either."),
      step("Investigate why the trial image never confirmed (health supervisor logs, GET_AUDIT_LOG) before re-attempting the same candidate."),
      step("Only re-attempt OTA once the root cause is understood — repeating the same candidate blindly just repeats the rollback.", false),
    ],
  };
}

/** The Admin API is unreachable — network partition, Node-RED down, or auth failure — not a Core problem at all. */
export function nodeRedUnreachableRecoveryPlan(): RecoveryPlan {
  return {
    scenario: "nodered-unreachable",
    steps: [
      step("Confirm Core-to-Core automation is degraded, not stopped: @spaghettilab/node-red-nodes' connection/record-source/command-target nodes keep running independently inside Node-RED even while the Admin API (deploy path) is unreachable — this only blocks new deploys, not already-running flows."),
      step("Do not redeploy blindly once connectivity returns — read the live flow's rev first and classify via classifyNodeRedSync() before deciding to deploy."),
      step("If Node-RED itself restarted, its in-memory flow state is gone but the persisted flow file is not — confirm via GET /flows before assuming anything was lost."),
      step("Only after confirming IN_SYNC/DIVERGED, redeploy explicitly if warranted.", true),
    ],
  };
}
