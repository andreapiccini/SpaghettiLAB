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
  it("rounds only the bottom-left of an output-only node", () => {
    expect(nodeShellRadius({ hasInput: false, hasOutput: true })).toBe("2px 2px 2px 28px");
  });

  it("rounds only the bottom-left of an input-only node", () => {
    expect(nodeShellRadius({ hasInput: true, hasOutput: false })).toBe("2px 2px 2px 12px");
  });

  it("keeps a single rounded bottom-left as the block mark", () => {
    expect(nodeShellRadius({ hasInput: true, hasOutput: true })).toBe("2px 2px 2px 12px");
    expect(nodeShellRadius({ hasInput: false, hasOutput: false })).toBe("2px 2px 2px 28px");
  });
});
