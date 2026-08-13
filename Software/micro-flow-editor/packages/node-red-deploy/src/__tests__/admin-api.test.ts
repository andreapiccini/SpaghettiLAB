import { afterEach, describe, expect, it, vi } from "vitest";
import { NodeRedAdminApiClient } from "../admin-api.js";

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
});

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

describe("NodeRedAdminApiClient — real Admin API adapter (S113 point 2)", () => {
  it("getFlows sends the v2 API version header and returns {rev, nodes}", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(200, { rev: "rev-1", flows: [{ id: "a", type: "inject" }] }));
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const client = new NodeRedAdminApiClient({ baseUrl: "http://localhost:1880" });
    const result = await client.getFlows();

    expect(result).toEqual({ rev: "rev-1", nodes: [{ id: "a", type: "inject" }] });
    const [, init] = fetchMock.mock.calls[0]!;
    expect((init.headers as Record<string, string>)["Node-RED-API-Version"]).toBe("v2");
  });

  it("getFlows includes the bearer token when configured", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(200, { rev: "rev-1", flows: [] }));
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const client = new NodeRedAdminApiClient({ baseUrl: "http://localhost:1880", token: "secret-token" });
    await client.getFlows();

    const [, init] = fetchMock.mock.calls[0]!;
    expect((init.headers as Record<string, string>).Authorization).toBe("Bearer secret-token");
  });

  it("setFlows sends the rev for compare-and-swap and returns SUCCESS", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(200, { rev: "rev-2" }));
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const client = new NodeRedAdminApiClient({ baseUrl: "http://localhost:1880" });
    const result = await client.setFlows([{ id: "a", type: "inject" }], "rev-1");

    expect(result).toEqual({ kind: "SUCCESS", rev: "rev-2" });
    const [, init] = fetchMock.mock.calls[0]!;
    expect(JSON.parse(init.body as string).rev).toBe("rev-1");
  });

  it("setFlows classifies a 409 as CONFLICT, never retrying with a stale rev", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 409 }));
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const client = new NodeRedAdminApiClient({ baseUrl: "http://localhost:1880" });
    const result = await client.setFlows([], "rev-1");

    expect(result.kind).toBe("CONFLICT");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("setFlows classifies a 401/403 as AUTH_FAILED", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 401 }));
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const client = new NodeRedAdminApiClient({ baseUrl: "http://localhost:1880" });
    const result = await client.setFlows([], "rev-1");

    expect(result.kind).toBe("AUTH_FAILED");
  });
});
