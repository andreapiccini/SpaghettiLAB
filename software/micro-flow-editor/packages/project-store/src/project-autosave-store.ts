import {
  domainError,
  exportProjectV1,
  importProjectV1,
  migrateProjectToLatest,
  validateProjectV1,
  type Clock,
  type DomainError,
  type ProjectId,
  type ProjectV1,
  type Result,
  type Storage,
  err,
  ok,
} from "@spaghettilab/domain";
import { ProjectStoreErrorCode } from "./errors.js";

const DEFAULT_MAX_HISTORY = 10;

function revKey(projectId: ProjectId, revision: number): string {
  return `project:${projectId}:rev:${revision}`;
}

function metaKey(projectId: ProjectId): string {
  return `project:${projectId}:meta`;
}

function revPrefix(projectId: ProjectId): string {
  return `project:${projectId}:rev:`;
}

function migrationBackupKey(projectId: ProjectId, fromVersion: number): string {
  return `project:${projectId}:backup:pre-migration:${fromVersion}`;
}

export type ProjectHistoryEntry = {
  readonly revision: number;
  readonly updatedAt: string; // ISO 8601
};

/**
 * The single key that "moves" on every save — see `save()`. Everything else
 * this store writes (`rev:<n>` snapshots, migration backups) is immutable
 * once written, which is what makes a single `meta` write the whole commit.
 */
type ProjectMeta = {
  readonly head: ProjectHistoryEntry;
  /** Newest first, bounded to `maxHistory` — see `save()`. */
  readonly history: readonly ProjectHistoryEntry[];
};

function isProjectMeta(value: unknown): value is ProjectMeta {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.head === "object" &&
    v.head !== null &&
    typeof (v.head as ProjectHistoryEntry).revision === "number" &&
    Array.isArray(v.history)
  );
}

function conflict(target: string, expected: number, actual: number): DomainError {
  return domainError({
    code: ProjectStoreErrorCode.CONCURRENT_WRITE_CONFLICT,
    path: ["projectAutosaveStore", "save"],
    target,
    remediation: `Another tab/process already saved revision ${actual} while this one still had revision ${expected}. Reload the latest revision before saving again — never overwrite blindly.`,
  });
}

function noRecoverableRevision(projectId: ProjectId): DomainError {
  return domainError({
    code: ProjectStoreErrorCode.NO_RECOVERABLE_REVISION,
    path: ["projectAutosaveStore", "load"],
    target: projectId,
    remediation: "No valid revision (current or historical) could be read for this project.",
  });
}

export type LoadedProject = {
  readonly project: ProjectV1;
  readonly revision: number;
};

/**
 * Transactional autosave, bounded version history, pre-migration backup and
 * optimistic concurrency control over the plain `Storage` port (S121 § S122).
 *
 * Layout per project:
 * - `project:<id>:rev:<n>` — immutable snapshot content for revision `n`,
 *   written once, never overwritten. A crash mid-write of a new revision
 *   never touches an older one.
 * - `project:<id>:meta` — `{ head, history }`, the *only* key that moves.
 *   Written last, in a single `Storage.set()` call, after the new revision's
 *   content already exists: this is the sole commit point. A crash before
 *   this write leaves `meta` (and therefore every reader) pointing at the
 *   previous, still-intact revision — never a half-saved one.
 * - `project:<id>:backup:pre-migration:<fromVersion>` — the raw, pre-migration
 *   bytes, written before a migration is attempted so a failed/interrupted
 *   migration never loses the original.
 */
export class ProjectAutosaveStore {
  constructor(
    private readonly storage: Storage,
    private readonly clock: Clock,
    private readonly maxHistory: number = DEFAULT_MAX_HISTORY,
  ) {}

  /**
   * Current `meta`, reconstructed from immutable revision snapshots if the
   * `meta` key itself is missing or unreadable (e.g. the process crashed
   * exactly during that one write) — the crash-recovery path.
   */
  private async readMeta(projectId: ProjectId): Promise<ProjectMeta | null> {
    const raw = await this.storage.get(metaKey(projectId));
    if (raw !== null) {
      try {
        const parsed: unknown = JSON.parse(raw);
        if (isProjectMeta(parsed)) return parsed;
      } catch {
        // fall through to reconstruction below
      }
    }
    return this.reconstructMeta(projectId);
  }

  /** Rebuilds `meta` from whatever `rev:<n>` keys still exist, newest-valid-first. */
  private async reconstructMeta(projectId: ProjectId): Promise<ProjectMeta | null> {
    const keys = await this.storage.keys(revPrefix(projectId));
    const revisions = keys
      .map((key) => Number.parseInt(key.slice(revPrefix(projectId).length), 10))
      .filter((n) => Number.isInteger(n))
      .sort((a, b) => b - a);
    if (revisions.length === 0) return null;

    const history: ProjectHistoryEntry[] = [];
    for (const revision of revisions.slice(0, this.maxHistory)) {
      const content = await this.storage.get(revKey(projectId, revision));
      if (content === null) continue;
      const result = importProjectV1(content);
      if (!result.ok) continue; // corrupt/truncated snapshot — skip, don't crash recovery
      history.push({ revision, updatedAt: this.clock.now().toISOString() });
    }
    if (history.length === 0) return null;
    return { head: history[0]!, history };
  }

  /** Loads the current revision, backing up and migrating first if the stored schema is older. */
  async load(projectId: ProjectId): Promise<Result<LoadedProject, DomainError[]>> {
    const meta = await this.readMeta(projectId);
    if (meta === null) {
      return err([noRecoverableRevision(projectId)]);
    }

    const attempts = [meta.head, ...meta.history.filter((h) => h.revision !== meta.head.revision)];
    for (const entry of attempts) {
      const loaded = await this.loadRevision(projectId, entry.revision);
      if (loaded.ok) return loaded;
      // this revision is corrupt/unreadable — fall back to the next-older one,
      // never surface a single bad snapshot as total data loss when an older
      // good one still exists.
    }
    return err([noRecoverableRevision(projectId)]);
  }

  private async loadRevision(
    projectId: ProjectId,
    revision: number,
  ): Promise<Result<LoadedProject, DomainError[]>> {
    const raw = await this.storage.get(revKey(projectId, revision));
    if (raw === null) return err([noRecoverableRevision(projectId)]);

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch (cause) {
      return err([
        domainError({
          code: ProjectStoreErrorCode.NO_RECOVERABLE_REVISION,
          path: ["projectAutosaveStore", "load", String(revision)],
          target: projectId,
          remediation: "This revision's stored bytes are not valid JSON.",
          cause,
        }),
      ]);
    }

    const fromVersion = typeof (parsed as { schemaVersion?: unknown }).schemaVersion === "number"
      ? (parsed as { schemaVersion: number }).schemaVersion
      : undefined;

    const directValidation = validateProjectV1(parsed);
    if (directValidation.ok) {
      return ok({ project: directValidation.value, revision });
    }
    if (fromVersion === undefined) {
      return err(directValidation.error);
    }

    // Older schema: back up the raw bytes *before* attempting migration, so a
    // migration that fails or is interrupted never loses the original.
    await this.storage.set(migrationBackupKey(projectId, fromVersion), raw);

    const migrated = migrateProjectToLatest(parsed as Record<string, unknown>);
    if (!migrated.ok) {
      return err([migrated.error]);
    }
    const revalidated = validateProjectV1(migrated.value);
    if (!revalidated.ok) {
      return err(revalidated.error);
    }
    return ok({ project: revalidated.value, revision });
  }

  /**
   * Saves a new revision. `expectedRevision` must be the revision the caller
   * last read (`null` only for a brand-new project) — a mismatch means
   * another tab/process saved in between, and this call fails without
   * writing anything, instead of silently overwriting (S122 concurrency
   * control).
   */
  async save(
    projectId: ProjectId,
    project: ProjectV1,
    expectedRevision: number | null,
  ): Promise<Result<ProjectHistoryEntry, DomainError>> {
    const meta = await this.readMeta(projectId);
    const currentRevision = meta?.head.revision ?? null;

    if (currentRevision !== expectedRevision) {
      return err(
        conflict(projectId, expectedRevision ?? -1, currentRevision ?? -1),
      );
    }

    const nextRevision = currentRevision === null ? 0 : currentRevision + 1;
    const updatedAt = this.clock.now().toISOString();

    // 1. Write the new immutable snapshot. Not yet visible to any reader —
    //    `meta` still points at the previous revision.
    await this.storage.set(revKey(projectId, nextRevision), exportProjectV1(project));

    // 2. Commit: a single write flips `meta` to the new revision. This is
    //    the only step that can make the new revision "the" current one.
    const newHead: ProjectHistoryEntry = { revision: nextRevision, updatedAt };
    const newHistory = [newHead, ...(meta?.history ?? [])].slice(0, this.maxHistory);
    await this.storage.set(
      metaKey(projectId),
      JSON.stringify({ head: newHead, history: newHistory } satisfies ProjectMeta),
    );

    // 3. Best-effort cleanup of revisions that fell out of the bounded
    //    window. Safe to skip/fail: a leftover old revision is harmless and
    //    self-heals on the next save.
    const retained = new Set(newHistory.map((h) => h.revision));
    for (const old of meta?.history ?? []) {
      if (!retained.has(old.revision)) {
        await this.storage.remove(revKey(projectId, old.revision));
      }
    }

    return ok(newHead);
  }

  /** Bounded version history, newest first — for a "restore previous version" UI. */
  async history(projectId: ProjectId): Promise<readonly ProjectHistoryEntry[]> {
    const meta = await this.readMeta(projectId);
    return meta?.history ?? [];
  }
}
