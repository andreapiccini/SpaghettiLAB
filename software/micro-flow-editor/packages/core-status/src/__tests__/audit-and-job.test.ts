import { describe, expect, it } from "vitest";
import { describeAuditLog } from "../audit-view.js";
import { describeJobStatus } from "../job-status.js";

describe("describeAuditLog", () => {
  it("maps a known operation id to its real Operation enum name", () => {
    const view = describeAuditLog({
      entries: [{ sequence: 1, principalId: 2, operationId: 3, internalResult: 0n, uptimeMs: 1000n }],
      nextCursor: 2,
    });
    expect(view.entries[0]!.operation).toBe("APPLY_CONFIG");
    expect(view.entries[0]!.internalResultRaw).toBe(0n);
  });

  it("falls back to UNKNOWN(n) for an unrecognized operation id", () => {
    const view = describeAuditLog({ entries: [{ sequence: 1, principalId: 2, operationId: 999, internalResult: 0n, uptimeMs: 0n }], nextCursor: 2 });
    expect(view.entries[0]!.operation).toBe("UNKNOWN(999)");
  });
});

describe("describeJobStatus", () => {
  it("labels state and operation with real names", () => {
    const view = describeJobStatus({ jobId: 1, state: 3, progress: 100, protocolStatus: 0, operation: 5 });
    expect(view.state).toBe("COMPLETED");
    expect(view.operation).toBe("SCAN_DISCOVERY");
  });

  it("falls back to UNKNOWN(n) for an unrecognized job state", () => {
    const view = describeJobStatus({ jobId: 1, state: 42, progress: 0, protocolStatus: 0, operation: 5 });
    expect(view.state).toBe("UNKNOWN(42)");
  });
});
