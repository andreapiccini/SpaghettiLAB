import { describe, expect, it } from "vitest";
import { nodeShellRadius, portsForKind } from "./node-ports.js";

describe("portsForKind", () => {
  it("gives triggers an output only", () => {
    expect(portsForKind("schedule")).toEqual({ hasInput: false, hasOutput: true });
    expect(portsForKind("event-source")).toEqual({ hasInput: false, hasOutput: true });
  });

  it("gives blocks both ports", () => {
    expect(portsForKind("block")).toEqual({ hasInput: true, hasOutput: true });
  });

  it("gives rules neither port", () => {
    expect(portsForKind("rule")).toEqual({ hasInput: false, hasOutput: false });
  });
});

describe("nodeShellRadius", () => {
  it("rounds the closed left side of an output-only node", () => {
    expect(nodeShellRadius({ hasInput: false, hasOutput: true })).toBe("20px 8px 8px 20px");
  });

  it("rounds the closed right side of an input-only node", () => {
    expect(nodeShellRadius({ hasInput: true, hasOutput: false })).toBe("8px 20px 20px 8px");
  });

  it("rounds both sides when the node has both ports or none", () => {
    expect(nodeShellRadius({ hasInput: true, hasOutput: true })).toBe("8px 8px 8px 8px");
    expect(nodeShellRadius({ hasInput: false, hasOutput: false })).toBe("20px 20px 20px 20px");
  });
});
