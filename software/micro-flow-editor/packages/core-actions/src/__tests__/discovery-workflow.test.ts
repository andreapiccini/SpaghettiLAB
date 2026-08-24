import { describe, expect, it, vi } from "vitest";
import { interpretJobStatus, JobProgressOutcomeKind, requestScan, ScanOutcomeKind, type ScanWireClient } from "../discovery-workflow.js";

describe("requestScan — S092 § Verifiche (invasive scan policy)", () => {
  it("starts a non-invasive scan without requiring any special grant", async () => {
    const scanDiscovery = vi.fn().mockResolvedValue({ jobId: 42 });
    const client: ScanWireClient = { scanDiscovery };
    const result = await requestScan(client, new Set(), { portId: 1, invasive: false });
    expect(result.kind).toBe(ScanOutcomeKind.STARTED);
    expect(result.jobId).toBe(42);
    expect(scanDiscovery).toHaveBeenCalledWith({ portId: 1, allowStateChanging: false });
  });

  it("requires explicit authorization for an invasive scan before calling the wire at all", async () => {
    const scanDiscovery = vi.fn();
    const client: ScanWireClient = { scanDiscovery };
    const result = await requestScan(client, new Set(), { portId: 1, invasive: true });
    expect(result.kind).toBe(ScanOutcomeKind.PERMISSION_DENIED);
    expect(scanDiscovery).not.toHaveBeenCalled();
  });

  it("proceeds with an invasive scan once the policy grant is present", async () => {
    const scanDiscovery = vi.fn().mockResolvedValue({ jobId: 7 });
    const client: ScanWireClient = { scanDiscovery };
    const result = await requestScan(client, new Set(["core.discovery.invasive-scan"]), { portId: 1, invasive: true });
    expect(result.kind).toBe(ScanOutcomeKind.STARTED);
    expect(scanDiscovery).toHaveBeenCalledWith({ portId: 1, allowStateChanging: true });
  });

  it("classifies a queue-full rejection distinctly from a generic error", async () => {
    const client: ScanWireClient = { scanDiscovery: vi.fn().mockRejectedValue({ code: "PROTOCOL_ERROR", status: 8 }) };
    const result = await requestScan(client, new Set(), { portId: 1, invasive: false });
    expect(result.kind).toBe(ScanOutcomeKind.QUEUE_FULL);
  });
});

describe("interpretJobStatus — permission denied / queue full / job timeout are distinct outcomes", () => {
  it("maps every JobState to a distinct kind, EXPIRED to TIMEOUT specifically", () => {
    expect(interpretJobStatus({ jobId: 1, state: 1, progress: 0 }).kind).toBe(JobProgressOutcomeKind.PENDING);
    expect(interpretJobStatus({ jobId: 1, state: 2, progress: 40 }).kind).toBe(JobProgressOutcomeKind.RUNNING);
    expect(interpretJobStatus({ jobId: 1, state: 3, progress: 100 }).kind).toBe(JobProgressOutcomeKind.COMPLETED);
    expect(interpretJobStatus({ jobId: 1, state: 4, progress: 50 }).kind).toBe(JobProgressOutcomeKind.FAILED);
    expect(interpretJobStatus({ jobId: 1, state: 5, progress: 20 }).kind).toBe(JobProgressOutcomeKind.CANCELLED);
    expect(interpretJobStatus({ jobId: 1, state: 6, progress: 10 }).kind).toBe(JobProgressOutcomeKind.TIMEOUT);
  });

  it("treats an unissued/reclaimed slot (FREE) as UNKNOWN, never a fabricated terminal state", () => {
    expect(interpretJobStatus({ jobId: 1, state: 0, progress: 0 }).kind).toBe(JobProgressOutcomeKind.UNKNOWN);
  });
});
