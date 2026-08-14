import type { Storage } from "@spaghettilab/domain";

/**
 * Host-side Node-RED runtime target — not a `ProjectV1` field.
 * Local (`127.0.0.1`), LAN, or remote HTTPS are all valid; the secret (Admin
 * API token) never lives here.
 */
export const NODE_RED_RUNTIME_STORAGE_KEY = "node-red.runtime";
export const NODE_RED_RUNTIME_LOCAL_STORAGE_KEY = `spaghettilab:${NODE_RED_RUNTIME_STORAGE_KEY}`;
export const DEFAULT_NODE_RED_BASE_URL = "http://127.0.0.1:1880";

export type NodeRedRuntimeTarget = {
  readonly baseUrl: string;
};

export function normalizeNodeRedBaseUrl(raw: string): string | undefined {
  const trimmed = raw.trim().replace(/\/+$/, "");
  if (trimmed === "") return undefined;
  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return undefined;
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") return undefined;
  if (url.hostname === "") return undefined;
  return `${url.protocol}//${url.host}${url.pathname === "/" ? "" : url.pathname.replace(/\/+$/, "")}`;
}

export function parseNodeRedRuntime(raw: string | null | undefined): NodeRedRuntimeTarget {
  if (!raw) return { baseUrl: DEFAULT_NODE_RED_BASE_URL };
  try {
    const parsed = JSON.parse(raw) as { baseUrl?: unknown };
    const baseUrl = typeof parsed.baseUrl === "string" ? normalizeNodeRedBaseUrl(parsed.baseUrl) : undefined;
    return { baseUrl: baseUrl ?? DEFAULT_NODE_RED_BASE_URL };
  } catch {
    const baseUrl = normalizeNodeRedBaseUrl(raw);
    return { baseUrl: baseUrl ?? DEFAULT_NODE_RED_BASE_URL };
  }
}

export async function loadNodeRedRuntime(storage: Storage): Promise<NodeRedRuntimeTarget> {
  return parseNodeRedRuntime(await storage.get(NODE_RED_RUNTIME_STORAGE_KEY));
}

export async function saveNodeRedRuntime(storage: Storage, target: NodeRedRuntimeTarget): Promise<void> {
  const baseUrl = normalizeNodeRedBaseUrl(target.baseUrl) ?? DEFAULT_NODE_RED_BASE_URL;
  await storage.set(NODE_RED_RUNTIME_STORAGE_KEY, JSON.stringify({ baseUrl }));
}

export function readNodeRedRuntimeFromLocalStorage(): NodeRedRuntimeTarget {
  try {
    if (typeof window === "undefined") return { baseUrl: DEFAULT_NODE_RED_BASE_URL };
    return parseNodeRedRuntime(window.localStorage.getItem(NODE_RED_RUNTIME_LOCAL_STORAGE_KEY));
  } catch {
    return { baseUrl: DEFAULT_NODE_RED_BASE_URL };
  }
}
