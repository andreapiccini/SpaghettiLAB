import { describe, expect, it } from "vitest";
import {
  createEmptyProject,
  FakeClock,
  InMemoryStorage,
  projectId,
  type ProjectId,
  type Result,
  type Storage,
} from "@spaghettilab/domain";
import { ProjectAutosaveStore } from "../project-autosave-store.js";
import { ProjectStoreErrorCode } from "../errors.js";

function mustOk<T, E>(result: Result<T, E>): T {
  if (!result.ok) throw new Error(`expected ok, got err: ${JSON.stringify(result)}`);
  return result.value;
}

function fixtureId(): ProjectId {
  return mustOk(projectId("eeeeeeee-0000-4000-8000-000000000001"));
}

/** Throws instead of delegating once `crashAfterSets` successful `set()` calls have happened — simulates a process crash mid-save. */
class CrashAfterNSetsStorage implements Storage {
  private setCount = 0;
  constructor(
    private readonly inner: Storage,
    private readonly crashAfterSets: number,
  ) {}

  get(key: string): Promise<string | null> {
    return this.inner.get(key);
  }

  async set(key: string, value: string): Promise<void> {
    this.setCount++;
    if (this.setCount > this.crashAfterSets) {
      throw new Error("simulated crash mid-save");
    }
    await this.inner.set(key, value);
  }

  remove(key: string): Promise<void> {
    return this.inner.remove(key);
  }

  keys(prefix?: string): Promise<string[]> {
    return this.inner.keys(prefix);
  }
}

describe("ProjectAutosaveStore — save/load round-trip and history", () => {
  it("saves a brand-new project at revision 0 and loads it back", async () => {
    const storage = new InMemoryStorage();
    const store = new ProjectAutosaveStore(storage, new FakeClock());
    const id = fixtureId();
    const project = createEmptyProject(id, "First save");

    const saved = mustOk(await store.save(id, project, null));
    expect(saved.revision).toBe(0);

    const loaded = mustOk(await store.load(id));
    expect(loaded.revision).toBe(0);
    expect(loaded.project).toEqual(project);
  });

  it("keeps history bounded to maxHistory and prunes older revisions from storage", async () => {
    const storage = new InMemoryStorage();
    const store = new ProjectAutosaveStore(storage, new FakeClock(), 3);
    const id = fixtureId();

    let expected: number | null = null;
    for (let i = 0; i < 6; i++) {
      const project = createEmptyProject(id, `Save ${i}`);
      const saved = mustOk(await store.save(id, project, expected));
      expected = saved.revision;
    }

    const history = await store.history(id);
    expect(history).toHaveLength(3);
    expect(history.map((h) => h.revision)).toEqual([5, 4, 3]);

    const remainingKeys = await storage.keys(`project:${id}:rev:`);
    expect(remainingKeys.sort()).toEqual(
      [3, 4, 5].map((n) => `project:${id}:rev:${n}`).sort(),
    );
  });
});

describe("ProjectAutosaveStore — concurrency control", () => {
  it("rejects a save against a stale expectedRevision instead of overwriting a concurrent save", async () => {
    const storage = new InMemoryStorage();
    const clock = new FakeClock();
    const id = fixtureId();

    // Two "tabs" both start from the same store, both read revision 0.
    const storeA = new ProjectAutosaveStore(storage, clock);
    const storeB = new ProjectAutosaveStore(storage, clock);
    mustOk(await storeA.save(id, createEmptyProject(id, "initial"), null));

    const savedByA = mustOk(
      await storeA.save(id, createEmptyProject(id, "tab A's edit"), 0),
    );
    expect(savedByA.revision).toBe(1);

    const resultFromB = await storeB.save(id, createEmptyProject(id, "tab B's edit"), 0);
    expect(resultFromB.ok).toBe(false);
    if (resultFromB.ok) return;
    expect(resultFromB.error.code).toBe(ProjectStoreErrorCode.CONCURRENT_WRITE_CONFLICT);

    // Tab A's save must still be the one that stuck — tab B never overwrote it.
    const loaded = mustOk(await storeA.load(id));
    expect(loaded.project.name).toBe("tab A's edit");
    expect(loaded.revision).toBe(1);
  });

  it("rejects creating a project at expectedRevision null when one already exists", async () => {
    const storage = new InMemoryStorage();
    const clock = new FakeClock();
    const id = fixtureId();
    const store = new ProjectAutosaveStore(storage, clock);

    mustOk(await store.save(id, createEmptyProject(id, "first"), null));
    const result = await store.save(id, createEmptyProject(id, "second, wrongly treated as new"), null);

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe(ProjectStoreErrorCode.CONCURRENT_WRITE_CONFLICT);
  });
});

describe("ProjectAutosaveStore — transactional autosave", () => {
  it("an interrupted save never leaves the readable state at a half-committed revision", async () => {
    const inner = new InMemoryStorage();
    const clock = new FakeClock();
    const id = fixtureId();

    const goodStore = new ProjectAutosaveStore(inner, clock);
    mustOk(await goodStore.save(id, createEmptyProject(id, "last good revision"), null));

    // The next save's snapshot write succeeds, but the commit (meta) write throws.
    const crashingStorage = new CrashAfterNSetsStorage(inner, 1);
    const crashingStore = new ProjectAutosaveStore(crashingStorage, clock);
    await expect(
      crashingStore.save(id, createEmptyProject(id, "never committed"), 0),
    ).rejects.toThrow("simulated crash mid-save");

    // A fresh store over the same underlying (non-crashing) storage must still
    // see the last good revision — not the half-written one, not an error.
    const recoveredStore = new ProjectAutosaveStore(inner, clock);
    const loaded = mustOk(await recoveredStore.load(id));
    expect(loaded.project.name).toBe("last good revision");
    expect(loaded.revision).toBe(0);
  });

  it("recovers when the meta pointer itself is lost but a committed revision remains", async () => {
    const storage = new InMemoryStorage();
    const clock = new FakeClock();
    const id = fixtureId();
    const store = new ProjectAutosaveStore(storage, clock);

    mustOk(await store.save(id, createEmptyProject(id, "recoverable"), null));
    await storage.set(`project:${id}:meta`, "not valid json{{{");

    const recovered = mustOk(await store.load(id));
    expect(recovered.project.name).toBe("recoverable");
  });
});

describe("ProjectAutosaveStore — backup before migration", () => {
  it("preserves the original raw bytes before attempting a migration, even when the migration itself fails", async () => {
    const storage = new InMemoryStorage();
    const clock = new FakeClock();
    const id = fixtureId();
    const store = new ProjectAutosaveStore(storage, clock);

    // Hand-craft a stored revision at an older, unmigratable schema version —
    // simulating data left behind before schema version 1 existed.
    const rawOldProject = JSON.stringify({ schemaVersion: 0, projectId: id, name: "pre-v1" });
    await storage.set(`project:${id}:rev:0`, rawOldProject);
    await storage.set(
      `project:${id}:meta`,
      JSON.stringify({
        head: { revision: 0, updatedAt: clock.now().toISOString() },
        history: [{ revision: 0, updatedAt: clock.now().toISOString() }],
      }),
    );

    const result = await store.load(id);
    // No migration is registered from schema 0 in this test's registry, so
    // the migration itself fails — but that must not lose the original.
    expect(result.ok).toBe(false);

    const backup = await storage.get(`project:${id}:backup:pre-migration:0`);
    expect(backup).toBe(rawOldProject);
  });
});
