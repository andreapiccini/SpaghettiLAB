/**
 * Error codes owned by this package — `@spaghettilab/domain`'s `DomainErrorCode`
 * is explicitly "not meant to become a global enum" (see its own comment), so
 * store-level failures (concurrency, corruption) get their own namespace here.
 */
export const ProjectStoreErrorCode = {
  CONCURRENT_WRITE_CONFLICT: "project-store.save.concurrent_write_conflict",
  NO_RECOVERABLE_REVISION: "project-store.load.no_recoverable_revision",
} as const;
