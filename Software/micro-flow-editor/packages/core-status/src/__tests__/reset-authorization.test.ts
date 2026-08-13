import { describe, expect, it, vi } from "vitest";
import { FactoryResetScope, requestFactoryReset, type FactoryResetWireClient } from "../reset-authorization.js";

describe("requestFactoryReset — S093 § Verifiche (diagnostic reset requires explicit authorization)", () => {
  it("refuses before calling the wire at all when core.admin.factory-reset is not granted", async () => {
    const factoryReset = vi.fn();
    const client: FactoryResetWireClient = { factoryReset };
    const result = await requestFactoryReset(client, new Set(), FactoryResetScope.CONFIG);
    expect(result.kind).toBe("PERMISSION_DENIED");
    expect(factoryReset).not.toHaveBeenCalled();
  });

  it("proceeds once core.admin.factory-reset is granted, for any scope combination", async () => {
    const factoryReset = vi.fn().mockResolvedValue(undefined);
    const client: FactoryResetWireClient = { factoryReset };
    const result = await requestFactoryReset(client, new Set(["core.admin.factory-reset"]), FactoryResetScope.ALL);
    expect(result.kind).toBe("SUCCESS");
    expect(factoryReset).toHaveBeenCalledWith({ scope: FactoryResetScope.ALL });
  });

  it("reports a remote error distinctly when the wire call itself fails", async () => {
    const client: FactoryResetWireClient = { factoryReset: vi.fn().mockRejectedValue(new Error("wire down")) };
    const result = await requestFactoryReset(client, new Set(["core.admin.factory-reset"]), FactoryResetScope.NETWORK);
    expect(result.kind).toBe("REMOTE_ERROR");
  });
});
