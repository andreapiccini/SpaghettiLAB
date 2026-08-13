import { describe, expect, it } from "vitest";
import { checkCredentialProvisioningAvailability } from "../credential-provisioning.js";

describe("checkCredentialProvisioningAvailability — S094 § Verifiche (local permission gate even for an unavailable operation)", () => {
  it("reports permission denied first when core.admin.credential-provisioning is not granted", () => {
    const result = checkCredentialProvisioningAvailability(new Set());
    expect(result.kind).toBe("PERMISSION_DENIED");
  });

  it("reports UNAVAILABLE_OVER_PROTOCOL_V1 once granted, since no wire operation exists for this at all", () => {
    const result = checkCredentialProvisioningAvailability(new Set(["core.admin.credential-provisioning"]));
    expect(result.kind).toBe("UNAVAILABLE_OVER_PROTOCOL_V1");
    if (result.kind === "UNAVAILABLE_OVER_PROTOCOL_V1") expect(result.remediation).toContain("Maintenance Link");
  });
});
