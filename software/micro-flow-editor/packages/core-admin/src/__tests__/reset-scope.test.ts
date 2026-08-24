import { describe, expect, it, vi } from "vitest";
import { describeResetScope, FactoryResetScope, requestFactoryResetWithConfirmation } from "../reset-scope.js";
import type { FactoryResetWireClient } from "@spaghettilab/core-status";

describe("describeResetScope", () => {
  it("labels a single-bit scope", () => {
    expect(describeResetScope(FactoryResetScope.CONFIG)).toBe("CONFIG");
  });
  it("labels a combined scope with +", () => {
    expect(describeResetScope(FactoryResetScope.CONFIG | FactoryResetScope.NETWORK)).toBe("CONFIG+NETWORK");
  });
  it("labels the full scope as ALL", () => {
    expect(describeResetScope(FactoryResetScope.ALL)).toBe("ALL");
  });
});

describe("requestFactoryResetWithConfirmation — S094 § Verifiche", () => {
  it("refuses before calling the wire when core.admin.factory-reset is not granted, even with a matching confirmation", async () => {
    const factoryReset = vi.fn();
    const client: FactoryResetWireClient = { factoryReset };
    const target = describeResetScope(FactoryResetScope.CONFIG);
    const result = await requestFactoryResetWithConfirmation(client, new Set(), FactoryResetScope.CONFIG, { target, confirmedTarget: target });
    expect(result.kind).toBe("PERMISSION_DENIED");
    expect(factoryReset).not.toHaveBeenCalled();
  });

  it("refuses before calling the wire when the confirmation doesn't match the real scope, even with permission granted", async () => {
    const factoryReset = vi.fn();
    const client: FactoryResetWireClient = { factoryReset };
    const result = await requestFactoryResetWithConfirmation(client, new Set(["core.admin.factory-reset"]), FactoryResetScope.ALL, {
      target: describeResetScope(FactoryResetScope.ALL),
      confirmedTarget: describeResetScope(FactoryResetScope.CONFIG),
    });
    expect(result.kind).toBe("CONFIRMATION_MISMATCH");
    expect(factoryReset).not.toHaveBeenCalled();
  });

  it("proceeds once permission is granted and the confirmation matches the real scope label", async () => {
    const factoryReset = vi.fn().mockResolvedValue(undefined);
    const client: FactoryResetWireClient = { factoryReset };
    const target = describeResetScope(FactoryResetScope.ALL);
    const result = await requestFactoryResetWithConfirmation(client, new Set(["core.admin.factory-reset"]), FactoryResetScope.ALL, {
      target,
      confirmedTarget: target,
    });
    expect(result.kind).toBe("SUCCESS");
    expect(factoryReset).toHaveBeenCalledWith({ scope: FactoryResetScope.ALL });
  });
});
