/**
 * Append-only local audit trail for sensitive operations (connect, validate/apply,
 * sensitive command, profile install/remove, OTA, reset, Node-RED deploy — see
 * REACT_FLOW_ARCHITECTURE.md § Sicurezza e credenziali). Entries never carry secret
 * payloads — only operation, target, and outcome.
 */
export type AuditEntry = {
  timestamp: Date;
  operation: string;
  target: string;
  outcome: "success" | "failure";
  detail?: Record<string, unknown>;
};

export interface AuditLog {
  record(entry: AuditEntry): Promise<void>;
}
