import { describe, expect, it } from "vitest";
import { projectId, moduleId, type ModuleId, type ProjectId } from "../ids.js";
import { DomainErrorCode } from "../errors.js";
import { FakeUuidGenerator } from "../ports/fakes/fake-uuid.js";

describe("branded IDs", () => {
  it("accepts a well-formed UUID", () => {
    const uuid = new FakeUuidGenerator("project").generate();
    const result = projectId(uuid);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toBe(uuid);
    }
  });

  it("rejects a malformed ID with a structured, inspectable error", () => {
    const result = projectId("not-a-uuid");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe(DomainErrorCode.INVALID_ID);
      expect(result.error.path).toEqual(["ProjectId"]);
      expect(result.error.target).toBe("not-a-uuid");
      expect(result.error.remediation).toBeTruthy();
    }
  });

  it("rejects an empty string", () => {
    expect(projectId("").ok).toBe(false);
  });

  it("two different branded ID kinds are not mutually assignable", () => {
    const uuid = new FakeUuidGenerator("x").generate();
    const project = projectId(uuid);
    const module = moduleId(uuid);
    expect(project.ok).toBe(true);
    expect(module.ok).toBe(true);

    if (project.ok && module.ok) {
      // Compile-time proof: `tsc -b` fails the whole build if branding is
      // ever removed and this line stops being a real type error.
      // @ts-expect-error a ProjectId is not assignable to ModuleId, even
      // though both wrap the exact same runtime string.
      const wrongType: ModuleId = project.value;
      void wrongType;

      // @ts-expect-error same rejection in the opposite direction.
      const alsoWrongType: ProjectId = module.value;
      void alsoWrongType;
    }
  });
});
