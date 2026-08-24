import { describe, expect, it } from "vitest";
import { MigrationRegistry, migrateProjectToLatest } from "../project-migrations.js";
import { DomainErrorCode } from "../errors.js";

describe("MigrationRegistry", () => {
  it("applies a single registered migration step", () => {
    const registry = new MigrationRegistry();
    registry.register({
      fromVersion: 0,
      toVersion: 1,
      migrate: (raw) => ({ ...raw, name: raw.name ?? "Untitled" }),
    });

    const result = registry.migrateToVersion({ schemaVersion: 0 }, 1);
    expect(result).toEqual({ ok: true, value: { schemaVersion: 1, name: "Untitled" } });
  });

  it("chains multiple migration steps in order", () => {
    const registry = new MigrationRegistry();
    registry.register({
      fromVersion: 0,
      toVersion: 1,
      migrate: (raw) => ({ ...raw, addedAtV1: true }),
    });
    registry.register({
      fromVersion: 1,
      toVersion: 2,
      migrate: (raw) => ({ ...raw, addedAtV2: true }),
    });

    const result = registry.migrateToVersion({ schemaVersion: 0 }, 2);
    expect(result).toEqual({
      ok: true,
      value: { schemaVersion: 2, addedAtV1: true, addedAtV2: true },
    });
  });

  it("fails with a structured error when a step is missing", () => {
    const registry = new MigrationRegistry();
    const result = registry.migrateToVersion({ schemaVersion: 0 }, 1);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe(DomainErrorCode.MIGRATION_NOT_FOUND);
    }
  });

  it("is a no-op when already at the target version", () => {
    const registry = new MigrationRegistry();
    const result = registry.migrateToVersion({ schemaVersion: 1, name: "x" }, 1);
    expect(result).toEqual({ ok: true, value: { schemaVersion: 1, name: "x" } });
  });
});

describe("migrateProjectToLatest", () => {
  it("is a no-op for data already at the current schema version (no real migrations registered yet)", () => {
    const result = migrateProjectToLatest({ schemaVersion: 1, name: "already current" });
    expect(result).toEqual({ ok: true, value: { schemaVersion: 1, name: "already current" } });
  });
});
