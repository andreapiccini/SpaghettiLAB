import { describe, expect, it } from "vitest";
import { createEmptyProject } from "../project.js";
import { projectId } from "../ids.js";
import { FakeUuidGenerator } from "../ports/fakes/fake-uuid.js";
import { DomainErrorCode } from "../errors.js";
import {
  exportProjectSelective,
  findSuspiciousSecretLikeKeys,
  MAX_PROJECT_IMPORT_BYTES,
  previewProjectImport,
  resolveProjectImportId,
  type ProjectImportPreview,
} from "../project-import-export.js";
import type { ProjectId, Result } from "../index.js";

function mustOk<T, E>(result: Result<T, E>): T {
  if (!result.ok) throw new Error(`expected ok, got err: ${JSON.stringify(result)}`);
  return result.value;
}

function fixtureId(suffix = "1"): ProjectId {
  return mustOk(projectId(`ffffffff-0000-4000-8000-00000000000${suffix}`));
}

describe("previewProjectImport — sandboxed, never executes untrusted content", () => {
  it("rejects a payload over the size limit before parsing", () => {
    const huge = JSON.stringify({ padding: "x".repeat(MAX_PROJECT_IMPORT_BYTES + 1) });
    const result = previewProjectImport(huge, []);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error[0]?.code).toBe(DomainErrorCode.IMPORT_TOO_LARGE);
  });

  it("previews a well-formed project without persisting it, flagging no duplicate", () => {
    const project = createEmptyProject(fixtureId(), "Imported");
    const json = JSON.stringify(project);

    const preview = mustOk(previewProjectImport(json, [fixtureId("2")]));
    expect(preview.isDuplicateId).toBe(false);
    expect(preview.project.name).toBe("Imported");
  });

  it("flags a project ID that collides with one already known to the caller", () => {
    const id = fixtureId();
    const project = createEmptyProject(id, "Imported");
    const json = JSON.stringify(project);

    const preview = mustOk(previewProjectImport(json, [id]));
    expect(preview.isDuplicateId).toBe(true);
  });

  it("rejects malformed JSON with a structured error, never throwing or executing it", () => {
    const result = previewProjectImport("not json at all {{{", []);
    expect(result.ok).toBe(false);
  });

  it("rejects a structurally invalid project (schema violation)", () => {
    const result = previewProjectImport(JSON.stringify({ not: "a project" }), []);
    expect(result.ok).toBe(false);
  });

  it("preserves an unrecognized top-level artifact through preview and export, never discarding it", () => {
    const project = createEmptyProject(fixtureId(), "Has future field");
    const rawWithExtra = { ...project, futureArtifactType: { kind: "not-yet-known", data: [1, 2, 3] } };

    const preview = mustOk(previewProjectImport(JSON.stringify(rawWithExtra), []));
    expect((preview.project as unknown as Record<string, unknown>).futureArtifactType).toEqual({
      kind: "not-yet-known",
      data: [1, 2, 3],
    });

    const exported = exportProjectSelective(preview.project);
    expect(JSON.parse(exported.json).futureArtifactType).toEqual({
      kind: "not-yet-known",
      data: [1, 2, 3],
    });
  });
});

describe("resolveProjectImportId", () => {
  const uuid = new FakeUuidGenerator("import-resolve");

  it("keeps the original ID when there is no duplicate, regardless of decision", () => {
    const project = createEmptyProject(fixtureId(), "Unique");
    const preview: ProjectImportPreview = { project, isDuplicateId: false };

    expect(resolveProjectImportId(preview, "rename", uuid).projectId).toBe(project.projectId);
    expect(resolveProjectImportId(preview, "keep", uuid).projectId).toBe(project.projectId);
  });

  it('assigns a fresh ID on "rename" when the ID is a duplicate, never silently overwriting', () => {
    const project = createEmptyProject(fixtureId(), "Duplicate");
    const preview: ProjectImportPreview = { project, isDuplicateId: true };

    const resolved = resolveProjectImportId(preview, "rename", uuid);
    expect(resolved.projectId).not.toBe(project.projectId);
    expect(resolved.name).toBe("Duplicate");
  });

  it('keeps the same ID on "keep" even when the ID is a duplicate — an explicit overwrite decision', () => {
    const project = createEmptyProject(fixtureId(), "Duplicate");
    const preview: ProjectImportPreview = { project, isDuplicateId: true };

    expect(resolveProjectImportId(preview, "keep", uuid).projectId).toBe(project.projectId);
  });
});

describe("findSuspiciousSecretLikeKeys", () => {
  it("finds nothing in a normal, secret-free object", () => {
    expect(findSuspiciousSecretLikeKeys({ name: "core-1", host: "10.0.0.5", credentialRef: "cred://x" })).toEqual(
      [],
    );
  });

  it("finds secret-like keys at any depth, reporting their dotted path", () => {
    const found = findSuspiciousSecretLikeKeys({
      mqtt: { username: "u", password: "hunter2" },
      nested: [{ apiKey: "abc" }],
    });
    expect(found.sort()).toEqual(["mqtt.password", "nested.0.apiKey"].sort());
  });
});

describe("exportProjectSelective", () => {
  it("finds no suspicious keys in a real (secret-free) project export", () => {
    const project = createEmptyProject(fixtureId(), "Clean");
    const exported = exportProjectSelective(project);
    expect(exported.suspiciousKeysFound).toEqual([]);
    expect(JSON.parse(exported.json).name).toBe("Clean");
  });
});
