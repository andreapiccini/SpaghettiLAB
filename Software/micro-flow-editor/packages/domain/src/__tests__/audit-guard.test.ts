import { describe, expect, it } from "vitest";
import { FakeClock } from "../ports/fakes/fake-clock.js";
import { InMemoryAuditLog } from "../ports/fakes/in-memory-audit-log.js";
import { AUDIT_OPERATIONS, recordSensitiveOperation } from "../audit-guard.js";

describe("recordSensitiveOperation", () => {
  it("records operation/target/outcome/timestamp as given", async () => {
    const log = new InMemoryAuditLog();
    const clock = new FakeClock(new Date("2026-03-01T00:00:00.000Z"));

    await recordSensitiveOperation(log, clock, "core.connect", "core-1", "success");

    expect(log.entries).toEqual([
      {
        timestamp: clock.now(),
        operation: "core.connect",
        target: "core-1",
        outcome: "success",
        detail: undefined,
      },
    ]);
  });

  it("scrubs secret-like keys from detail before they ever reach the log", async () => {
    const log = new InMemoryAuditLog();
    const clock = new FakeClock();

    await recordSensitiveOperation(log, clock, "core.command.sensitive", "core-1", "success", {
      command: "set-wifi",
      password: "hunter2",
      nested: { apiKey: "abc123" },
    });

    expect(log.entries[0]?.detail).toEqual({
      command: "set-wifi",
      password: "[REDACTED]",
      nested: { apiKey: "[REDACTED]" },
    });
  });

  it("scrubs secret-like keys even when the outcome is a failure", async () => {
    const log = new InMemoryAuditLog();
    const clock = new FakeClock();

    await recordSensitiveOperation(log, clock, "core.connect", "core-1", "failure", {
      reason: "auth rejected",
      token: "should-never-be-logged",
    });

    expect(log.entries[0]?.outcome).toBe("failure");
    expect(log.entries[0]?.detail).toEqual({
      reason: "auth rejected",
      token: "[REDACTED]",
    });
  });

  it("covers connect, validate/apply, sensitive command, profile install/remove, OTA, reset and Node-RED deploy", () => {
    expect(new Set(AUDIT_OPERATIONS)).toEqual(
      new Set([
        "core.connect",
        "config.validate-apply",
        "core.command.sensitive",
        "profile.install",
        "profile.remove",
        "core.ota",
        "core.reset",
        "nodered.deploy",
      ]),
    );
  });
});
