import type { AuditEntry, AuditLog } from "../audit.js";

/** In-memory `AuditLog` for tests: keeps every recorded entry, in order, for assertions. */
export class InMemoryAuditLog implements AuditLog {
  readonly entries: AuditEntry[] = [];

  async record(entry: AuditEntry): Promise<void> {
    this.entries.push(entry);
  }
}
