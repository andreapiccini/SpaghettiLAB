import { describe, expect, it, vi } from "vitest";
import type { CommandWireClient } from "@spaghettilab/core-actions";
import { runCommandTarget } from "../command-target.js";

describe("runCommandTarget — S112 § Verifiche (same S024 fixture shape / no parallel implementation)", () => {
  it("calls the real core-actions runCommand — succeeds when permission is granted", async () => {
    const moduleCommand = vi.fn().mockResolvedValue(undefined);
    const client: CommandWireClient = { moduleCommand };
    const outcome = await runCommandTarget(client, new Set(["core.command.execute"]), { moduleKey: 1, commandId: 2 });
    expect(outcome.kind).toBe("SUCCESS");
    expect(moduleCommand).toHaveBeenCalledWith({ key: 1, commandId: 2 });
  });

  it("refuses before calling the wire when permission is not granted — same as the app's own command runner", async () => {
    const moduleCommand = vi.fn();
    const client: CommandWireClient = { moduleCommand };
    const outcome = await runCommandTarget(client, new Set(), { moduleKey: 1, commandId: 2 });
    expect(outcome.kind).toBe("PERMISSION_DENIED");
    expect(moduleCommand).not.toHaveBeenCalled();
  });
});
