import type { NodeRedFlowNode } from "./flow-compiler.js";

export type GetFlowsResult = { readonly rev: string; readonly nodes: readonly NodeRedFlowNode[] };

export type SetFlowsOutcome = { readonly kind: "SUCCESS"; readonly rev: string } | { readonly kind: "CONFLICT" } | { readonly kind: "AUTH_FAILED" } | { readonly kind: "REMOTE_ERROR"; readonly detail: string };

/**
 * The Node-RED Admin API surface this package needs (`GET`/`POST /flows`) —
 * a port, same "caller/adapter supplies the real transport" stance as
 * `@spaghettilab/protocol-sdk`'s `ProtocolTransport`. `NodeRedAdminApiClient`
 * below is this package's own real `fetch`-based implementation; a test
 * fakes this interface directly instead.
 */
export interface NodeRedAdminApi {
  getFlows(): Promise<GetFlowsResult>;
  /** Compare-and-swap by `rev` — Node-RED's own optimistic-concurrency mechanism. Never force-overwrites: a stale `rev` must surface as `CONFLICT`, not retry-and-clobber. */
  setFlows(nodes: readonly NodeRedFlowNode[], rev: string): Promise<SetFlowsOutcome>;
}

export type NodeRedAdminApiOptions = {
  readonly baseUrl: string;
  /** Bearer token for `adminAuth` — S113 point 2's "adapter Node-RED Admin API con autenticazione". Omit only for a dev instance with `adminAuth` disabled. */
  readonly token?: string;
};

/** Real Admin API client — `GET /flows` with the `Node-RED-API-Version: v2` header (the only version that returns `{rev, flows}`; the legacy default returns a bare array with no revision to compare-and-swap against), `POST /flows` with `rev` in the body for CAS. */
export class NodeRedAdminApiClient implements NodeRedAdminApi {
  constructor(private readonly options: NodeRedAdminApiOptions) {}

  private headers(extra?: Record<string, string>): Record<string, string> {
    return {
      "Node-RED-API-Version": "v2",
      ...(this.options.token ? { Authorization: `Bearer ${this.options.token}` } : {}),
      ...extra,
    };
  }

  async getFlows(): Promise<GetFlowsResult> {
    const response = await fetch(`${this.options.baseUrl}/flows`, { headers: this.headers() });
    if (response.status === 401 || response.status === 403) {
      throw new Error("NodeRedAdminApiClient.getFlows: authentication failed");
    }
    if (!response.ok) {
      throw new Error(`NodeRedAdminApiClient.getFlows: unexpected status ${response.status}`);
    }
    const body = (await response.json()) as { rev: string; flows: NodeRedFlowNode[] };
    return { rev: body.rev, nodes: body.flows };
  }

  async setFlows(nodes: readonly NodeRedFlowNode[], rev: string): Promise<SetFlowsOutcome> {
    const response = await fetch(`${this.options.baseUrl}/flows`, {
      method: "POST",
      headers: this.headers({ "Content-Type": "application/json", "Node-RED-Deployment-Type": "full" }),
      body: JSON.stringify({ flows: nodes, rev }),
    });
    if (response.status === 401 || response.status === 403) return { kind: "AUTH_FAILED" };
    if (response.status === 409) return { kind: "CONFLICT" };
    if (!response.ok) return { kind: "REMOTE_ERROR", detail: `unexpected status ${response.status}` };
    const body = (await response.json()) as { rev: string };
    return { kind: "SUCCESS", rev: body.rev };
  }
}
