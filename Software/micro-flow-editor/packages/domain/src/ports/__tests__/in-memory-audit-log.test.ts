import { describe, expect, it } from "vitest";
import { InMemoryAuditLog } from "../fakes/in-memory-audit-log.js";

describe("InMemoryAuditLog", () => {
  it("keeps recorded entries in order and never drops the outcome", async () => {
    const audit = new InMemoryAuditLog();
    const first = {
      timestamp: new Date("2026-01-01T00:00:00.000Z"),
      operation: "core.connect",
      target: "core-1",
      outcome: "success" as const,
    };
    const second = {
      timestamp: new Date("2026-01-01T00:00:05.000Z"),
      operation: "config.apply",
      target: "core-1",
      outcome: "failure" as const,
      detail: { reason: "stale-generation" },
    };

    await audit.record(first);
    await audit.record(second);

    expect(audit.entries).toEqual([first, second]);
  });
});
