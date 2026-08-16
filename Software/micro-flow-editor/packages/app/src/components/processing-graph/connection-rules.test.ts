import { describe, expect, it } from "vitest";
import { isValidProcessingConnection } from "./connection-rules.js";

describe("isValidProcessingConnection", () => {
  it("rejects a block connecting its output to its own input", () => {
    expect(isValidProcessingConnection({ source: "a", target: "a" })).toBe(false);
  });

  it("rejects the reverse (input dragged onto the same block's output)", () => {
    expect(isValidProcessingConnection({ source: "blk", target: "blk" })).toBe(false);
  });

  it("allows a wire between two different blocks", () => {
    expect(isValidProcessingConnection({ source: "a", target: "b" })).toBe(true);
  });

  it("rejects an incomplete connection", () => {
    expect(isValidProcessingConnection({ source: "a", target: null })).toBe(false);
    expect(isValidProcessingConnection({ source: undefined, target: "b" })).toBe(false);
  });
});
