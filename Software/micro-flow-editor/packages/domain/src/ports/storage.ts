/**
 * Abstract key/value persistence for authoring data (projects, workspace settings).
 * Values are strings (already-serialized) — the port does not know about JSON, CBOR,
 * or any particular encoding. Never used for credentials; see `credentials.ts`.
 */
export interface Storage {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
  remove(key: string): Promise<void>;
  keys(prefix?: string): Promise<string[]>;
}
