import type { AuditEntry, AuditLog } from "@spaghettilab/domain";
import { localStorageAdapter } from "./repository.js";

const KEY = "audit-log";
const MAX_ENTRIES = 500;

type StoredEntry = { readonly timestamp: string; readonly operation: string; readonly target: string; readonly outcome: "success" | "failure"; readonly detail?: Record<string, unknown> };

/**
 * `@spaghettilab/domain`'s `AuditLog` port has no production adapter
 * anywhere in this repo yet — only `InMemoryAuditLog` (a test fake, lost on
 * reload). This is the real browser implementation, same `LocalStorageAdapter`
 * namespace as everything else, append-only and bounded (oldest entries
 * dropped past `MAX_ENTRIES`, same "bounded, never unbounded growth" pattern
 * as `TelemetryBufferStore`).
 */
export class LocalStorageAuditLog implements AuditLog {
  async record(entry: AuditEntry): Promise<void> {
    const entries = await this.readAll();
    const stored: StoredEntry = { timestamp: entry.timestamp.toISOString(), operation: entry.operation, target: entry.target, outcome: entry.outcome, detail: entry.detail };
    const next = [stored, ...entries].slice(0, MAX_ENTRIES);
    await localStorageAdapter.set(KEY, JSON.stringify(next));
  }

  async readAll(): Promise<readonly StoredEntry[]> {
    const raw = await localStorageAdapter.get(KEY);
    if (!raw) return [];
    try {
      return JSON.parse(raw) as StoredEntry[];
    } catch {
      return [];
    }
  }
}

export type { StoredEntry as StoredAuditEntry };
