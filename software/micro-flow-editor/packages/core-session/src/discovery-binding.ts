import type { CoreBindingId, CoreBindingRecord } from "@spaghettilab/domain";

export type DiscoveredCandidate = {
  readonly expectedDeviceId: string;
  readonly connectionProfileId: string;
};

/**
 * Proposes a Core binding from a discovery candidate — "discovery di rete/BLE
 * può proporre binding ma non sostituire identità" (S030 point 1). If a
 * binding already exists for this device ID, that existing binding is
 * returned **unchanged**: discovery can never overwrite an established
 * identity, even if the candidate's `connectionProfileId` differs (that
 * would silently redirect an existing Core binding to a different
 * connection — a user must do that explicitly, this function never does).
 */
export function proposeBindingFromDiscovery(
  existingBindings: readonly CoreBindingRecord[],
  candidate: DiscoveredCandidate,
  newBindingId: CoreBindingId,
): CoreBindingRecord {
  const existing = existingBindings.find((b) => b.expectedDeviceId === candidate.expectedDeviceId);
  if (existing) {
    return existing;
  }
  return {
    bindingId: newBindingId,
    expectedDeviceId: candidate.expectedDeviceId,
    connectionProfileId: candidate.connectionProfileId,
  };
}
