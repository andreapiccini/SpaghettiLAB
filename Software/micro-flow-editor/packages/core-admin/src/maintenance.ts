import { checkPermission, domainError, type DomainError, type PermissionSet } from "@spaghettilab/domain";
import type { HandoverAckResponse } from "@spaghettilab/protocol-sdk";
import { checkDestructiveConfirmation, type DestructiveConfirmation } from "./confirmation.js";
import { CoreAdminErrorCode } from "./errors.js";

export type MaintenanceWireClient = {
  openNetworkMaintenance(): Promise<HandoverAckResponse>;
};

export type MaintenanceOutcome =
  | { readonly kind: "SUCCESS"; readonly handover: HandoverAckResponse }
  | { readonly kind: "PERMISSION_DENIED"; readonly issue: DomainError }
  | { readonly kind: "CONFIRMATION_MISMATCH"; readonly issue: DomainError }
  | { readonly kind: "REMOTE_ERROR"; readonly issue: DomainError };

/**
 * `OPEN_NETWORK_MAINTENANCE` stops MQTT for the whole workspace and, on
 * `RESOURCE_PROFILE_MINIMAL` builds, disconnects BLE
 * (`connectivity_ops.c`'s `run_wifi_handover`/`stop_mqtt_for_workspace`/
 * `maybe_request_minimal_disconnect`) — disruptive enough to the running
 * workspace that S094 § Verifiche's destructive-confirmation requirement
 * applies here even though the disruption is bounded/self-reversing (the
 * lease it acquires always expires). `confirmation.target` should be the
 * Core identity the caller is about to interrupt, shown to the operator
 * before this function is called.
 */
export async function openNetworkMaintenance(
  client: MaintenanceWireClient,
  granted: PermissionSet,
  confirmation: DestructiveConfirmation,
): Promise<MaintenanceOutcome> {
  const permission = checkPermission(granted, "core.admin.maintenance");
  if (!permission.ok) return { kind: "PERMISSION_DENIED", issue: permission.error };

  const confirmed = checkDestructiveConfirmation(confirmation);
  if (!confirmed.ok) return { kind: "CONFIRMATION_MISMATCH", issue: confirmed.error };

  try {
    const handover = await client.openNetworkMaintenance();
    return { kind: "SUCCESS", handover };
  } catch (cause) {
    return {
      kind: "REMOTE_ERROR",
      issue: domainError({
        code: CoreAdminErrorCode.REMOTE_ERROR,
        path: ["core-admin", "openNetworkMaintenance"],
        target: confirmation.target,
        remediation: "The wire call failed — check the Core connection and retry.",
        cause,
      }),
    };
  }
}
