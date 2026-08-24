import { domainError, DomainErrorCode, type DomainError } from "./errors.js";
import { err, ok, type Result } from "./result.js";
import { PROJECT_SCHEMA_VERSION } from "./project.js";

export type ProjectMigration = {
  readonly fromVersion: number;
  readonly toVersion: number;
  migrate(raw: Record<string, unknown>): Record<string, unknown>;
};

/**
 * Extensibility point for future schema bumps. `ProjectV1` is the first
 * version, so the registry the app actually uses (`defaultProjectMigrations`)
 * starts empty — there is nothing to migrate from yet. The mechanism itself
 * is still exercised in tests with a synthetic migration, so it's proven to
 * work before the day a real one is needed.
 */
export class MigrationRegistry {
  private readonly migrations = new Map<number, ProjectMigration>();

  register(migration: ProjectMigration): void {
    this.migrations.set(migration.fromVersion, migration);
  }

  /** Applies registered migrations in sequence until `targetVersion`, or fails if a step is missing. */
  migrateToVersion(
    raw: Record<string, unknown>,
    targetVersion: number,
  ): Result<Record<string, unknown>, DomainError> {
    let current = raw;
    let version = typeof raw.schemaVersion === "number" ? raw.schemaVersion : 0;

    while (version < targetVersion) {
      const step = this.migrations.get(version);
      if (!step) {
        return err(
          domainError({
            code: DomainErrorCode.MIGRATION_NOT_FOUND,
            path: ["schemaVersion"],
            target: String(version),
            remediation: `No migration is registered from schema version ${version} to ${version + 1}.`,
          }),
        );
      }
      current = { ...step.migrate(current), schemaVersion: step.toVersion };
      version = step.toVersion;
    }
    return ok(current);
  }
}

export const defaultProjectMigrations = new MigrationRegistry();

export function migrateProjectToLatest(
  raw: Record<string, unknown>,
): Result<Record<string, unknown>, DomainError> {
  return defaultProjectMigrations.migrateToVersion(raw, PROJECT_SCHEMA_VERSION);
}
