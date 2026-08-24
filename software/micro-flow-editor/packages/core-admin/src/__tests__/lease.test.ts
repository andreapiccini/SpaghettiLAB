import { describe, expect, it, vi } from "vitest";
import { acquireLease, ConnectivityService, releaseLease, type LeaseWireClient } from "../lease.js";

describe("acquireLease/releaseLease — reversible, no destructive confirmation needed", () => {
  it("refuses to acquire before calling the wire when core.admin.lease is not granted", async () => {
    const acquireConnectivityLease = vi.fn();
    const client: LeaseWireClient = { acquireConnectivityLease, releaseConnectivityLease: vi.fn() };
    const result = await acquireLease(client, new Set(), ConnectivityService.WIFI, 30000);
    expect(result.kind).toBe("PERMISSION_DENIED");
    expect(acquireConnectivityLease).not.toHaveBeenCalled();
  });

  it("acquires once core.admin.lease is granted", async () => {
    const acquireConnectivityLease = vi.fn().mockResolvedValue(undefined);
    const client: LeaseWireClient = { acquireConnectivityLease, releaseConnectivityLease: vi.fn() };
    const result = await acquireLease(client, new Set(["core.admin.lease"]), ConnectivityService.WIFI | ConnectivityService.REMOTE_CONSOLE, 30000);
    expect(result.kind).toBe("SUCCESS");
    expect(acquireConnectivityLease).toHaveBeenCalledWith({ services: ConnectivityService.WIFI | ConnectivityService.REMOTE_CONSOLE, durationMs: 30000 });
  });

  it("refuses to release before calling the wire when core.admin.lease is not granted", async () => {
    const releaseConnectivityLease = vi.fn();
    const client: LeaseWireClient = { acquireConnectivityLease: vi.fn(), releaseConnectivityLease };
    const result = await releaseLease(client, new Set());
    expect(result.kind).toBe("PERMISSION_DENIED");
    expect(releaseConnectivityLease).not.toHaveBeenCalled();
  });

  it("releases once core.admin.lease is granted", async () => {
    const releaseConnectivityLease = vi.fn().mockResolvedValue(undefined);
    const client: LeaseWireClient = { acquireConnectivityLease: vi.fn(), releaseConnectivityLease };
    const result = await releaseLease(client, new Set(["core.admin.lease"]));
    expect(result.kind).toBe("SUCCESS");
  });
});
