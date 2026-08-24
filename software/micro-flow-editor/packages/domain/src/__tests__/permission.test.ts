import { describe, expect, it } from "vitest";
import { DomainErrorCode } from "../errors.js";
import { checkPermission, PERMISSION_SCOPES, type PermissionScope } from "../permission.js";

describe("checkPermission", () => {
  it("allows a scope present in the granted set", () => {
    const granted = new Set<PermissionScope>(["core.connect"]);
    const result = checkPermission(granted, "core.connect");
    expect(result.ok).toBe(true);
  });

  it("denies a scope absent from the granted set, before any Core/Node-RED call would happen", () => {
    const granted = new Set<PermissionScope>(["core.connect"]);
    const result = checkPermission(granted, "core.admin.factory-reset");
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe(DomainErrorCode.PERMISSION_DENIED);
    expect(result.error.target).toBe("core.admin.factory-reset");
  });

  it("denies every scope against an empty grant set", () => {
    const granted = new Set<PermissionScope>();
    for (const scope of PERMISSION_SCOPES) {
      expect(checkPermission(granted, scope).ok).toBe(false);
    }
  });

  it("covers Core, Node-RED, project and admin operations distinctly, not one generic scope", () => {
    const areas = new Set(PERMISSION_SCOPES.map((scope) => scope.split(".")[0]));
    expect(areas).toEqual(new Set(["core", "nodered", "project"]));
  });
});
