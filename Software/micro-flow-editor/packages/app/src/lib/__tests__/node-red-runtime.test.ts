import { InMemoryStorage } from "@spaghettilab/domain";
import { describe, expect, it } from "vitest";
import {
  DEFAULT_NODE_RED_BASE_URL,
  loadNodeRedRuntime,
  NODE_RED_RUNTIME_STORAGE_KEY,
  normalizeNodeRedBaseUrl,
  parseNodeRedRuntime,
  saveNodeRedRuntime,
} from "../node-red-runtime.js";

describe("normalizeNodeRedBaseUrl", () => {
  it("accepts loopback, LAN and remote http(s) URLs", () => {
    expect(normalizeNodeRedBaseUrl("http://127.0.0.1:1880/")).toBe("http://127.0.0.1:1880");
    expect(normalizeNodeRedBaseUrl("http://192.168.1.20:1880")).toBe("http://192.168.1.20:1880");
    expect(normalizeNodeRedBaseUrl("https://nodered.example.com")).toBe("https://nodered.example.com");
  });

  it("rejects empty or non-http schemes", () => {
    expect(normalizeNodeRedBaseUrl("")).toBeUndefined();
    expect(normalizeNodeRedBaseUrl("ftp://x")).toBeUndefined();
    expect(normalizeNodeRedBaseUrl("not a url")).toBeUndefined();
  });
});

describe("parseNodeRedRuntime / storage", () => {
  it("defaults missing or corrupt values to loopback", () => {
    expect(parseNodeRedRuntime(null).baseUrl).toBe(DEFAULT_NODE_RED_BASE_URL);
    expect(parseNodeRedRuntime("{").baseUrl).toBe(DEFAULT_NODE_RED_BASE_URL);
    expect(parseNodeRedRuntime(JSON.stringify({ baseUrl: "ftp://x" })).baseUrl).toBe(DEFAULT_NODE_RED_BASE_URL);
  });

  it("round-trips a LAN URL without going through ProjectV1", async () => {
    const storage = new InMemoryStorage();
    await saveNodeRedRuntime(storage, { baseUrl: "http://10.0.0.8:1880/" });
    const stored = await storage.get(NODE_RED_RUNTIME_STORAGE_KEY);
    expect(stored).not.toMatch(/token|password|secret/i);
    expect(await loadNodeRedRuntime(storage)).toEqual({ baseUrl: "http://10.0.0.8:1880" });
  });
});
