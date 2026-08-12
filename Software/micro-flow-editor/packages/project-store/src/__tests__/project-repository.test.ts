import { describe, expect, it } from "vitest";
import {
  createEmptyProject,
  InMemoryStorage,
  projectId,
  type ProjectId,
  type Result,
} from "@spaghettilab/domain";
import { ProjectRepository } from "../project-repository.js";

function mustOk<T, E>(result: Result<T, E>): T {
  if (!result.ok) throw new Error("expected an ok Result in test fixture setup");
  return result.value;
}

function fixtureId(): ProjectId {
  return mustOk(projectId("dddddddd-0000-4000-8000-000000000001"));
}

describe("ProjectRepository", () => {
  it("load fails with a structured error for a project that was never saved", async () => {
    const repo = new ProjectRepository(new InMemoryStorage());
    const result = await repo.load(fixtureId());
    expect(result.ok).toBe(false);
  });

  it("round-trips a project through save -> load", async () => {
    const repo = new ProjectRepository(new InMemoryStorage());
    const project = createEmptyProject(fixtureId(), "Round-trip demo");

    await repo.save(project);
    const loaded = await repo.load(fixtureId());

    expect(loaded).toEqual({ ok: true, value: project });
  });

  it("remove makes a saved project unloadable again", async () => {
    const repo = new ProjectRepository(new InMemoryStorage());
    const project = createEmptyProject(fixtureId(), "To be removed");

    await repo.save(project);
    await repo.remove(fixtureId());
    const result = await repo.load(fixtureId());

    expect(result.ok).toBe(false);
  });

  it("listProjectIds returns every saved project and only projects", async () => {
    const storage = new InMemoryStorage();
    const repo = new ProjectRepository(storage);
    const a = mustOk(projectId("dddddddd-0000-4000-8000-0000000000aa"));
    const b = mustOk(projectId("dddddddd-0000-4000-8000-0000000000bb"));

    await repo.save(createEmptyProject(a, "A"));
    await repo.save(createEmptyProject(b, "B"));
    await storage.set("settings:theme", "dark"); // unrelated key, must not leak in

    const ids = await repo.listProjectIds();
    expect(ids.sort()).toEqual([a, b].sort());
  });
});
