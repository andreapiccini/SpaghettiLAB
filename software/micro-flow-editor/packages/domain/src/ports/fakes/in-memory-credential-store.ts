import type { CredentialStore } from "../credentials.js";

/** In-memory `CredentialStore` for tests — never a real secret backend. */
export class InMemoryCredentialStore implements CredentialStore {
  private readonly secrets = new Map<string, string>();

  async get(reference: string): Promise<string | null> {
    return this.secrets.has(reference) ? this.secrets.get(reference)! : null;
  }

  async set(reference: string, secret: string): Promise<void> {
    this.secrets.set(reference, secret);
  }

  async remove(reference: string): Promise<void> {
    this.secrets.delete(reference);
  }
}
