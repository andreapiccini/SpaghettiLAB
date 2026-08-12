/**
 * `REACT_FLOW_ARCHITECTURE.md` § Stato di una sessione Core:
 * `DISCONNECTED → CONNECTING → AUTHENTICATING → SYNCHRONIZING → READY`, with
 * `READY`'s own sub-states for validate/apply/update/reboot/trial/error.
 */
export type SessionState =
  | "DISCONNECTED"
  | "CONNECTING"
  | "AUTHENTICATING"
  | "SYNCHRONIZING"
  | "READY"
  | "VALIDATING"
  | "APPLYING"
  | "UPDATING"
  | "REBOOTING"
  | "TRIAL"
  | "CONFLICT"
  | "ERROR"
  | "ROLLED_BACK";

/**
 * `READY` does not mean project and device agree — this is the separate
 * relationship `REACT_FLOW_ARCHITECTURE.md` defines alongside session state.
 * `INCOMPATIBLE` takes priority over the others: it means the device's
 * catalog cannot satisfy what the project needs regardless of hash
 * comparisons.
 */
export type SyncRelationship = "IN_SYNC" | "PROJECT_DIRTY" | "DEVICE_CHANGED" | "DIVERGED" | "INCOMPATIBLE";
