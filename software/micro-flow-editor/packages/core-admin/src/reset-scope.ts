import { checkPermission, type DomainError, type PermissionSet } from "@spaghettilab/domain";
import { FactoryResetScope, requestFactoryReset, type FactoryResetWireClient } from "@spaghettilab/core-status";
import { checkDestructiveConfirmation, type DestructiveConfirmation } from "./confirmation.js";

export { FactoryResetScope };

const SCOPE_LABELS: readonly { readonly bit: number; readonly label: string }[] = [
  { bit: FactoryResetScope.CONFIG, label: "CONFIG" },
  { bit: FactoryResetScope.NETWORK, label: "NETWORK" },
  { bit: FactoryResetScope.CREDENTIALS, label: "CREDENTIALS" },
  { bit: FactoryResetScope.BLE_BONDS, label: "BLE_BONDS" },
];

/** Human-readable label for a `FACTORY_RESET` scope bitmask, e.g. `"CONFIG+NETWORK"` — the visible target a caller must show before asking for confirmation (S094 § Verifiche). */
export function describeResetScope(scope: number): string {
  if (scope === FactoryResetScope.ALL) return "ALL";
  const labels = SCOPE_LABELS.filter((s) => (scope & s.bit) !== 0).map((s) => s.label);
  return labels.length > 0 ? labels.join("+") : "NONE";
}

export type ResetScopeOutcome =
  | { readonly kind: "SUCCESS" }
  | { readonly kind: "PERMISSION_DENIED"; readonly issue: DomainError }
  | { readonly kind: "CONFIRMATION_MISMATCH"; readonly issue: DomainError }
  | { readonly kind: "REMOTE_ERROR"; readonly issue: DomainError };

/**
 * Adds S094's destructive-confirmation gate on top of
 * `@spaghettilab/core-status`'s `requestFactoryReset()`, which already
 * enforces the `core.admin.factory-reset` permission. `confirmation.target`
 * must equal `describeResetScope(scope)`, so a caller cannot confirm a
 * different scope than the one actually about to be wiped. Permission is
 * checked first here too (same ordering as `openNetworkMaintenance`/
 * `acquireLease` in this package), so a missing grant is reported before a
 * confirmation mismatch would be — `requestFactoryReset()` re-checks the
 * same permission before its own wire call, harmless duplication rather than
 * a second source of truth.
 */
export async function requestFactoryResetWithConfirmation(
  client: FactoryResetWireClient,
  granted: PermissionSet,
  scope: number,
  confirmation: DestructiveConfirmation,
): Promise<ResetScopeOutcome> {
  const permission = checkPermission(granted, "core.admin.factory-reset");
  if (!permission.ok) return { kind: "PERMISSION_DENIED", issue: permission.error };

  const confirmed = checkDestructiveConfirmation(confirmation);
  if (!confirmed.ok) return { kind: "CONFIRMATION_MISMATCH", issue: confirmed.error };

  const result = await requestFactoryReset(client, granted, scope);
  if (result.kind === "SUCCESS") return { kind: "SUCCESS" };
  if (result.kind === "PERMISSION_DENIED") return { kind: "PERMISSION_DENIED", issue: result.issue };
  return { kind: "REMOTE_ERROR", issue: result.issue };
}
