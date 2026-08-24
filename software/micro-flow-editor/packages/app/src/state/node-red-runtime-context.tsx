import { NodeRedAdminApiClient } from "@spaghettilab/node-red-deploy";
import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { localStorageAdapter } from "../lib/repository.js";
import {
  DEFAULT_NODE_RED_BASE_URL,
  normalizeNodeRedBaseUrl,
  readNodeRedRuntimeFromLocalStorage,
  saveNodeRedRuntime,
  type NodeRedRuntimeTarget,
} from "../lib/node-red-runtime.js";

export type NodeRedReachability = "unknown" | "checking" | "reachable" | "unreachable";

type NodeRedRuntimeContextValue = {
  readonly target: NodeRedRuntimeTarget;
  /** Session-only Admin API token — never written to ProjectV1 or the runtime URL record. */
  readonly token: string;
  readonly reachability: NodeRedReachability;
  readonly lastError: string | null;
  setBaseUrl(baseUrl: string): void;
  setToken(token: string): void;
  /** Optional URL is saved first, then probed — avoids racing the last stored target. */
  probe(baseUrl?: string): Promise<void>;
};

const NodeRedRuntimeContext = createContext<NodeRedRuntimeContextValue | undefined>(undefined);

export function NodeRedRuntimeProvider({ children }: { readonly children: ReactNode }) {
  const [target, setTarget] = useState<NodeRedRuntimeTarget>(readNodeRedRuntimeFromLocalStorage);
  const [token, setTokenState] = useState("");
  const [reachability, setReachability] = useState<NodeRedReachability>("unknown");
  const [lastError, setLastError] = useState<string | null>(null);

  const setBaseUrl = useCallback((baseUrl: string) => {
    const normalized = normalizeNodeRedBaseUrl(baseUrl) ?? DEFAULT_NODE_RED_BASE_URL;
    const next = { baseUrl: normalized };
    setTarget(next);
    setReachability("unknown");
    void saveNodeRedRuntime(localStorageAdapter, next);
  }, []);

  const setToken = useCallback((next: string) => {
    setTokenState(next);
  }, []);

  const probe = useCallback(async (overrideUrl?: string) => {
    const baseUrl =
      overrideUrl !== undefined ? (normalizeNodeRedBaseUrl(overrideUrl) ?? DEFAULT_NODE_RED_BASE_URL) : target.baseUrl;
    if (overrideUrl !== undefined) {
      const next = { baseUrl };
      setTarget(next);
      setReachability("unknown");
      void saveNodeRedRuntime(localStorageAdapter, next);
    }
    setReachability("checking");
    setLastError(null);
    try {
      const adminApi = new NodeRedAdminApiClient({ baseUrl, token: token || undefined });
      await adminApi.getFlows();
      setReachability("reachable");
    } catch (cause) {
      setReachability("unreachable");
      setLastError(cause instanceof Error ? cause.message : String(cause));
    }
  }, [target.baseUrl, token]);

  return (
    <NodeRedRuntimeContext.Provider value={{ target, token, reachability, lastError, setBaseUrl, setToken, probe }}>
      {children}
    </NodeRedRuntimeContext.Provider>
  );
}

export function useNodeRedRuntime(): NodeRedRuntimeContextValue {
  const ctx = useContext(NodeRedRuntimeContext);
  if (!ctx) throw new Error("useNodeRedRuntime() called outside <NodeRedRuntimeProvider>");
  return ctx;
}
