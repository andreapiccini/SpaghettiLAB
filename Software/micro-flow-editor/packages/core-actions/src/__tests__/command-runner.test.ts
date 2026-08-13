import { describe, expect, it, vi } from "vitest";
import { CommandOutcomeKind, runCommand, type CommandWireClient } from "../command-runner.js";

describe("runCommand — S092 § Verifiche", () => {
  it("never modifies Config or project — it calls only moduleCommand, nothing else", async () => {
    const moduleCommand = vi.fn().mockResolvedValue(undefined);
    const client: CommandWireClient = { moduleCommand };
    const result = await runCommand(client, new Set(["core.command.execute"]), { moduleKey: 7, commandId: 3 });
    expect(result.kind).toBe(CommandOutcomeKind.SUCCESS);
    expect(moduleCommand).toHaveBeenCalledWith({ key: 7, commandId: 3 });
    expect(moduleCommand).toHaveBeenCalledTimes(1);
  });

  it("is rejected with PERMISSION_DENIED without ever calling the wire", async () => {
    const moduleCommand = vi.fn();
    const client: CommandWireClient = { moduleCommand };
    const result = await runCommand(client, new Set(), { moduleKey: 7, commandId: 3 });
    expect(result.kind).toBe(CommandOutcomeKind.PERMISSION_DENIED);
    expect(moduleCommand).not.toHaveBeenCalled();
  });

  it("refuses a command that needs arguments the wire cannot carry, rather than invoking it incompletely", async () => {
    const moduleCommand = vi.fn();
    const client: CommandWireClient = { moduleCommand };
    const result = await runCommand(client, new Set(["core.command.execute"]), { moduleKey: 7, commandId: 3, requiresArguments: true });
    expect(result.kind).toBe(CommandOutcomeKind.UNSUPPORTED_ARGUMENTS);
    expect(moduleCommand).not.toHaveBeenCalled();
  });

  it("distinguishes QUEUE_FULL, TIMEOUT, and PERMISSION_DENIED as separate outcomes, not one generic error", async () => {
    const queueFullClient: CommandWireClient = { moduleCommand: vi.fn().mockRejectedValue({ code: "PROTOCOL_ERROR", status: 8 }) };
    const timeoutClient: CommandWireClient = { moduleCommand: vi.fn().mockRejectedValue({ code: "TIMEOUT" }) };
    const deniedClient: CommandWireClient = { moduleCommand: vi.fn().mockRejectedValue({ code: "PROTOCOL_ERROR", status: 3 }) };

    const granted = new Set(["core.command.execute"] as const);
    const queueFull = await runCommand(queueFullClient, granted, { moduleKey: 1, commandId: 1 });
    const timeout = await runCommand(timeoutClient, granted, { moduleKey: 1, commandId: 1 });
    const denied = await runCommand(deniedClient, granted, { moduleKey: 1, commandId: 1 });

    expect(queueFull.kind).toBe(CommandOutcomeKind.QUEUE_FULL);
    expect(timeout.kind).toBe(CommandOutcomeKind.TIMEOUT);
    expect(denied.kind).toBe(CommandOutcomeKind.PERMISSION_DENIED);
    expect(new Set([queueFull.kind, timeout.kind, denied.kind]).size).toBe(3);
  });
});
