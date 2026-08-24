import { bytesToHex } from "@spaghettilab/core-session";
import { checkDestructiveConfirmation, type DestructiveConfirmation } from "@spaghettilab/core-admin";
import { removeProfile, type DeviceProfileWireClient } from "@spaghettilab/device-profile-install";
import { domainError, err, ok, type CredentialStore, type DomainError, type Result } from "@spaghettilab/domain";
import { SecurityRecoveryErrorCode } from "./errors.js";

/**
 * S124 § Verifiche: "ogni reset o rimozione mostra device ID, scope e
 * conseguenze prima della conferma". Every function below builds its
 * `DestructiveConfirmation.target` from those three pieces — a caller
 * displays exactly this string to the operator before asking them to type
 * it back, so the confirmation dialog and the confirmed value are
 * structurally the same text, never two independently-maintained copies
 * that could drift.
 */
function describeTarget(deviceId: Uint8Array, scope: string, consequence: string): string {
  return `device ${bytesToHex(deviceId)} — ${scope} — ${consequence}`;
}

function mismatch(target: string): DomainError {
  return domainError({
    code: SecurityRecoveryErrorCode.CONFIRMATION_MISMATCH,
    path: ["security-recovery", "destructive-confirmation"],
    target,
    remediation: `Confirmation must exactly match the displayed target ("${target}").`,
  });
}

/** `@spaghettilab/domain`'s `CredentialStore.remove()` (S121) has no confirmation gate of its own — this is that gate. */
export async function confirmCredentialRemoval(store: CredentialStore, deviceId: Uint8Array, reference: string, confirmation: DestructiveConfirmation): Promise<Result<void, DomainError>> {
  const target = describeTarget(deviceId, `credential "${reference}"`, "any Core or service still relying on this credential loses access immediately, with no automatic recovery");
  const confirmed = checkDestructiveConfirmation({ target, confirmedTarget: confirmation.confirmedTarget });
  if (!confirmed.ok) return err(mismatch(target));
  await store.remove(reference);
  return ok(undefined);
}

/**
 * Adds the confirmation layer `@spaghettilab/device-profile-install`'s
 * `removeProfile()` doesn't have on its own — that function already refuses
 * outright when `isReferencedLocally` is true (S063), a hard block, not a
 * confirmation; this wraps the call for the case it *does* allow, so an
 * operator still sees device ID/profile/consequence before it fires.
 */
export async function confirmProfileRemoval(
  client: DeviceProfileWireClient,
  deviceId: Uint8Array,
  profileId: string,
  version: number,
  isReferencedLocally: boolean,
  confirmation: DestructiveConfirmation,
): Promise<Result<void, DomainError>> {
  const target = describeTarget(deviceId, `Device Profile "${profileId}@${version}"`, "every Module using this profile stops sampling once it is removed");
  const confirmed = checkDestructiveConfirmation({ target, confirmedTarget: confirmation.confirmedTarget });
  if (!confirmed.ok) return err(mismatch(target));
  return removeProfile(client, profileId, version, { isReferencedLocally });
}

/**
 * `@spaghettilab/ota-preflight`'s `preflightOtaCandidate()` already flags a
 * lower candidate version as `REJECTED_POSSIBLE_DOWNGRADE` (S102) — a
 * heuristic warning, not an unconditional block (the real enforcement is
 * MCUboot's, post-transfer). This is the explicit, confirmed override an
 * operator uses to proceed anyway, never a silent bypass of that warning.
 */
export function confirmFirmwareDowngrade(deviceId: Uint8Array, candidateVersion: string, runningVersion: string, confirmation: DestructiveConfirmation): Result<void, DomainError> {
  const target = describeTarget(deviceId, `downgrade from "${runningVersion}" to "${candidateVersion}"`, "MCUboot's anti-downgrade gate will still reject this candidate at swap time unless the running image's security counter allows it — this override only lets the transfer proceed, it cannot force the swap");
  const confirmed = checkDestructiveConfirmation({ target, confirmedTarget: confirmation.confirmedTarget });
  if (!confirmed.ok) return err(mismatch(target));
  return ok(undefined);
}

/** Gates deleting a System Automation Link's compiled Node-RED nodes (`@spaghettilab/node-red-deploy`'s `ownedNodeIds()`) before the next deploy's `reconcileFlows()` drops them. */
export function confirmNodeRedResourceDeletion(projectId: string, nodeIds: readonly string[], confirmation: DestructiveConfirmation): Result<void, DomainError> {
  const target = `project ${projectId} — ${nodeIds.length} Node-RED node(s) [${nodeIds.join(", ")}] — any in-flight message on these nodes is dropped, not queued`;
  const confirmed = checkDestructiveConfirmation({ target, confirmedTarget: confirmation.confirmedTarget });
  if (!confirmed.ok) return err(mismatch(target));
  return ok(undefined);
}
