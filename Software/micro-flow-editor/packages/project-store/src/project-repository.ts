import {
  domainError,
  DomainErrorCode,
  err,
  exportProjectV1,
  importProjectV1,
  type DomainError,
  type ProjectId,
  type ProjectV1,
  type Result,
  type Storage,
} from "@spaghettilab/domain";

const KEY_PREFIX = "project:";

function keyFor(projectId: ProjectId): string {
  return `${KEY_PREFIX}${projectId}`;
}

/**
 * The only place `Storage` (S011) meets `ProjectV1` (S014) — orchestration,
 * not domain logic. Serialization/validation stay in `@spaghettilab/domain`
 * (`exportProjectV1`/`importProjectV1`); this class is just "where" a
 * project's JSON lives, addressed by ID.
 */
export class ProjectRepository {
  constructor(private readonly storage: Storage) {}

  async save(project: ProjectV1): Promise<void> {
    await this.storage.set(keyFor(project.projectId), exportProjectV1(project));
  }

  async load(projectId: ProjectId): Promise<Result<ProjectV1, DomainError[]>> {
    const raw = await this.storage.get(keyFor(projectId));
    if (raw === null) {
      return err([
        domainError({
          code: DomainErrorCode.DANGLING_REFERENCE,
          path: ["projectStore", "load"],
          target: projectId,
          remediation: `No project with ID "${projectId}" is saved in this storage.`,
        }),
      ]);
    }
    return importProjectV1(raw);
  }

  async remove(projectId: ProjectId): Promise<void> {
    await this.storage.remove(keyFor(projectId));
  }

  /** IDs of every project currently saved in this storage, in no particular order. */
  async listProjectIds(): Promise<string[]> {
    const keys = await this.storage.keys(KEY_PREFIX);
    return keys.map((key) => key.slice(KEY_PREFIX.length));
  }
}
