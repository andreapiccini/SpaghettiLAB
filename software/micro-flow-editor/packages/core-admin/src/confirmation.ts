import { domainError, err, ok, type DomainError, type Result } from "@spaghettilab/domain";
import { CoreAdminErrorCode } from "./errors.js";

/**
 * A caller must re-state the exact target it is about to mutate before a
 * destructive admin operation runs (S094 § Verifiche: "ogni operazione
 * distruttiva richiede conferma esplicita con target visibile prima di
 * eseguire"). This is a domain-level check, not a UI dialog: it exists so no
 * code path can call `requestFactoryReset`/`openNetworkMaintenance` here
 * without having first shown the caller the real target and gotten it typed
 * back — the same "type the resource name to confirm" pattern used for any
 * irreversible action, kept generic across every destructive admin
 * operation in this package instead of being reimplemented per operation.
 */
export type DestructiveConfirmation = {
  /** The real target about to be mutated — e.g. "core-042" or a human-readable factory-reset scope list. */
  readonly target: string;
  /** What the caller typed/re-selected back, after being shown `target`. */
  readonly confirmedTarget: string;
};

export function checkDestructiveConfirmation(confirmation: DestructiveConfirmation): Result<void, DomainError> {
  if (confirmation.confirmedTarget !== confirmation.target) {
    return err(
      domainError({
        code: CoreAdminErrorCode.CONFIRMATION_MISMATCH,
        path: ["core-admin", "confirmation"],
        target: confirmation.target,
        remediation: `Confirmation must exactly match the displayed target ("${confirmation.target}") before this destructive operation can run.`,
      }),
    );
  }
  return ok(undefined);
}
