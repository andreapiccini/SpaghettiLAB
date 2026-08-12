import { describe, expect, it } from "vitest";
import { canonicalJson, contentHash } from "../hash.js";

describe("canonicalJson", () => {
  it("produces the same string regardless of object key order", () => {
    const a = canonicalJson({ b: 2, a: 1 });
    const b = canonicalJson({ a: 1, b: 2 });
    expect(a).toBe(b);
  });

  it("sorts keys recursively, including inside array elements", () => {
    const a = canonicalJson({ list: [{ b: 2, a: 1 }] });
    const b = canonicalJson({ list: [{ a: 1, b: 2 }] });
    expect(a).toBe(b);
  });

  it("does not reorder array element order itself (caller's responsibility)", () => {
    const a = canonicalJson([1, 2, 3]);
    const b = canonicalJson([3, 2, 1]);
    expect(a).not.toBe(b);
  });
});

describe("contentHash", () => {
  it("is deterministic for the same canonical content", () => {
    expect(contentHash({ a: 1, b: 2 })).toBe(contentHash({ b: 2, a: 1 }));
  });

  it("differs for different content", () => {
    expect(contentHash({ a: 1 })).not.toBe(contentHash({ a: 2 }));
  });

  it("returns a fixed-length lowercase hex string", () => {
    const hash = contentHash({ anything: "goes" });
    expect(hash).toMatch(/^[0-9a-f]{8}$/);
  });
});
