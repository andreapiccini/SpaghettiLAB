import type { Storage } from "../storage.js";

/** In-memory `Storage` for tests: no browser `localStorage`/filesystem involved. */
export class InMemoryStorage implements Storage {
  private readonly data = new Map<string, string>();

  async get(key: string): Promise<string | null> {
    return this.data.has(key) ? this.data.get(key)! : null;
  }

  async set(key: string, value: string): Promise<void> {
    this.data.set(key, value);
  }

  async remove(key: string): Promise<void> {
    this.data.delete(key);
  }

  async keys(prefix?: string): Promise<string[]> {
    const all = [...this.data.keys()];
    return prefix ? all.filter((k) => k.startsWith(prefix)) : all;
  }
}
