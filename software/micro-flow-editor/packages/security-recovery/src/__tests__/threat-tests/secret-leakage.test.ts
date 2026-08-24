import { describe, expect, it } from "vitest";
import { FakeClock, findSuspiciousSecretLikeKeys, recordSensitiveOperation } from "@spaghettilab/domain";
import { InMemoryAuditLog } from "@spaghettilab/domain";
import { recordOtaAudit, redactSignedUrl } from "@spaghettilab/ota-lifecycle";

describe("secret leakage threat test — S124 § Verifiche", () => {
  it("findSuspiciousSecretLikeKeys catches password/token/secret/apiKey/privateKey-shaped keys at any depth", () => {
    const found = findSuspiciousSecretLikeKeys({
      config: { wifi: { password: "hunter2" } },
      auth: { apiKey: "abc", nested: { privateKey: "xyz" } },
      plain: "not a secret",
    });
    expect(found).toEqual(expect.arrayContaining(["config.wifi.password", "auth.apiKey", "auth.nested.privateKey"]));
  });

  it("recordSensitiveOperation scrubs every secret-like key from detail before it ever reaches the audit log, including on failure", async () => {
    const log = new InMemoryAuditLog();
    const clock = new FakeClock();

    await recordSensitiveOperation(log, clock, "core.connect", "core-1", "failure", {
      reason: "auth rejected",
      token: "should-never-appear",
      nested: { apiKey: "should-never-appear-either" },
    });

    const serialized = JSON.stringify(log.entries);
    expect(serialized).not.toContain("should-never-appear");
    expect(serialized).not.toContain("should-never-appear-either");
  });

  it("recordOtaAudit strips a signed artifact URL's query string (where a signing token typically lives) before it ever reaches the audit log", async () => {
    const log = new InMemoryAuditLog();
    const clock = new FakeClock();

    await recordOtaAudit(log, clock, "core-1", "success", { artifactUrl: "https://cdn.test/pack.bin?token=SUPER_SECRET_TOKEN&expires=123" });

    const serialized = JSON.stringify(log.entries);
    expect(serialized).not.toContain("SUPER_SECRET_TOKEN");
  });

  it("redactSignedUrl never leaks a query string even for an adversarially malformed URL", () => {
    expect(redactSignedUrl("https://cdn.test/pack.bin?token=SECRET#fragment-also-hidden")).not.toContain("SECRET");
    expect(redactSignedUrl("not-a-url?token=SECRET")).not.toContain("SECRET");
  });
});
