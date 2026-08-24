import type { Storage } from "@spaghettilab/domain";

/**
 * The real `Storage` port (S011) implementation for a browser runtime — the
 * app-layer adapter `@spaghettilab/domain`'s `InMemoryStorage` fake stands
 * in for during tests. Namespaced under `spaghettilab:` so this app never
 * collides with another `localStorage` user on the same origin.
 */
export class LocalStorageAdapter implements Storage {
  private key(key: string): string {
    return `spaghettilab:${key}`;
  }

  async get(key: string): Promise<string | null> {
    return window.localStorage.getItem(this.key(key));
  }

  async set(key: string, value: string): Promise<void> {
    window.localStorage.setItem(this.key(key), value);
  }

  async remove(key: string): Promise<void> {
    window.localStorage.removeItem(this.key(key));
  }

  async keys(prefix = ""): Promise<string[]> {
    const fullPrefix = this.key(prefix);
    const out: string[] = [];
    for (let i = 0; i < window.localStorage.length; i++) {
      const rawKey = window.localStorage.key(i);
      if (rawKey && rawKey.startsWith(fullPrefix)) {
        out.push(rawKey.slice("spaghettilab:".length));
      }
    }
    return out;
  }
}
