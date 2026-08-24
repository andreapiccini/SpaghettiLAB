/**
 * Abstract secret storage, addressed by opaque reference — never by the secret value
 * itself. Projects and connection profiles store only the reference (see
 * REACT_FLOW_ARCHITECTURE.md § Sicurezza e credenziali); the actual token/password
 * never enters domain state, logs, or exported JSON.
 */
export interface CredentialStore {
  get(reference: string): Promise<string | null>;
  set(reference: string, secret: string): Promise<void>;
  remove(reference: string): Promise<void>;
}
