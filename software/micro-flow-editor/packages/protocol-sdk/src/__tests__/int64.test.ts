import { describe, expect, it } from "vitest";
import { int64FromJson, int64ToJson } from "../int64.js";
import { ProtocolCodecError } from "../cbor.js";

describe("int64ToJson / int64FromJson — lossless round trip", () => {
  it("round-trips values at and beyond the JS safe-integer range as decimal strings", () => {
    for (const value of [
      0n,
      1n,
      -1n,
      BigInt(Number.MAX_SAFE_INTEGER),
      BigInt(Number.MAX_SAFE_INTEGER) + 1n,
      18446744073709551615n, // uint64 max
      -9223372036854775808n, // int64 min
    ]) {
      const json = int64ToJson(value);
      expect(int64FromJson(json)).toBe(value);
    }
  });

  it("accepts a JS number only when it is a safe integer", () => {
    expect(int64FromJson(42)).toBe(42n);
    expect(int64FromJson(Number.MAX_SAFE_INTEGER)).toBe(BigInt(Number.MAX_SAFE_INTEGER));
  });

  it("rejects, never rounds, a JSON number outside the safe-integer range", () => {
    expect(() => int64FromJson(Number.MAX_SAFE_INTEGER + 2)).toThrow(ProtocolCodecError);
    expect(() => int64FromJson(1e20)).toThrow(ProtocolCodecError);
  });

  it("rejects a non-integer JSON number", () => {
    expect(() => int64FromJson(1.5)).toThrow(ProtocolCodecError);
  });

  it("rejects a malformed integer string", () => {
    expect(() => int64FromJson("12.5")).toThrow(ProtocolCodecError);
    expect(() => int64FromJson("not a number")).toThrow(ProtocolCodecError);
    expect(() => int64FromJson("")).toThrow(ProtocolCodecError);
  });

  it("rejects a non-string, non-number JSON value", () => {
    expect(() => int64FromJson(null)).toThrow(ProtocolCodecError);
    expect(() => int64FromJson({})).toThrow(ProtocolCodecError);
  });
});
