import { describe, expect, it, vi } from "vitest";
import { openNetworkMaintenance, type MaintenanceWireClient } from "../maintenance.js";

const handover = { address: "192.0.2.1", port: 4433, leaseExpiresAtMs: 1000n, reachedStateRaw: 2 };

describe("openNetworkMaintenance — S094 § Verifiche (destructive confirmation + local permission gate)", () => {
  it("refuses before calling the wire when core.admin.maintenance is not granted", async () => {
    const openNetworkMaintenanceFn = vi.fn();
    const client: MaintenanceWireClient = { openNetworkMaintenance: openNetworkMaintenanceFn };
    const result = await openNetworkMaintenance(client, new Set(), { target: "core-042", confirmedTarget: "core-042" });
    expect(result.kind).toBe("PERMISSION_DENIED");
    expect(openNetworkMaintenanceFn).not.toHaveBeenCalled();
  });

  it("refuses before calling the wire when the confirmation target does not match, even with permission granted", async () => {
    const openNetworkMaintenanceFn = vi.fn();
    const client: MaintenanceWireClient = { openNetworkMaintenance: openNetworkMaintenanceFn };
    const result = await openNetworkMaintenance(client, new Set(["core.admin.maintenance"]), { target: "core-042", confirmedTarget: "core-99" });
    expect(result.kind).toBe("CONFIRMATION_MISMATCH");
    expect(openNetworkMaintenanceFn).not.toHaveBeenCalled();
  });

  it("proceeds once both permission and matching confirmation are present", async () => {
    const openNetworkMaintenanceFn = vi.fn().mockResolvedValue(handover);
    const client: MaintenanceWireClient = { openNetworkMaintenance: openNetworkMaintenanceFn };
    const result = await openNetworkMaintenance(client, new Set(["core.admin.maintenance"]), { target: "core-042", confirmedTarget: "core-042" });
    expect(result.kind).toBe("SUCCESS");
    if (result.kind === "SUCCESS") expect(result.handover).toEqual(handover);
  });
});
