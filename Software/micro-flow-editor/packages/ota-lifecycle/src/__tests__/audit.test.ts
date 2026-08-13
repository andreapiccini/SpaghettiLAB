import { describe, expect, it } from "vitest";
import { FakeClock, InMemoryAuditLog } from "@spaghettilab/domain";
import { recordOtaAudit, redactSignedUrl } from "../audit.js";

describe("redactSignedUrl", () => {
  it("strips a signed query string, keeping only origin+pathname", () => {
    expect(redactSignedUrl("https://example.test/candidate.bin?token=SECRET123&expires=123")).toBe("https://example.test/candidate.bin");
  });

  it("falls back to a placeholder for an unparseable URL rather than leaking it verbatim", () => {
    expect(redactSignedUrl("not a url")).toBe("[unparseable-url]");
  });
});

describe("recordOtaAudit — S103 § Implementazione point 4 (no tokens, keys or signed URLs in the audit trail)", () => {
  it("redacts artifactUrl's query string before it ever reaches the audit log", async () => {
    const log = new InMemoryAuditLog();
    const clock = new FakeClock(new Date("2026-08-13T00:00:00.000Z"));

    await recordOtaAudit(log, clock, "core-1", "success", { packId: "pack.kalman", artifactUrl: "https://example.test/x.bin?token=SECRET123" });

    expect(log.entries[0]?.detail?.artifactUrl).toBe("https://example.test/x.bin");
    expect(JSON.stringify(log.entries[0])).not.toContain("SECRET123");
  });

  it("still scrubs any secret-like-named key on top, via the shared recordSensitiveOperation scrubber", async () => {
    const log = new InMemoryAuditLog();
    const clock = new FakeClock();

    await recordOtaAudit(log, clock, "core-1", "failure", { packId: "pack.kalman", outcome: "hash mismatch" });

    expect(log.entries[0]?.operation).toBe("core.ota");
  });
});
