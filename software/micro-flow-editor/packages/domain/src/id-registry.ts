import { domainError, DomainErrorCode, type DomainError } from "./errors.js";
import { err, ok, type Result } from "./result.js";

/**
 * Tracks which IDs of one branded type currently exist, so callers can reject
 * a duplicate at registration time and a dangling reference at resolve time —
 * the runtime half of S012's "duplicati e riferimenti dangling sono
 * rifiutati" requirement (the type-level half is `Branded<T, Brand>` in
 * `ids.ts`). Generic over the ID type so every entity kind (Project, Module,
 * Rule, ...) gets its own registry instance instead of sharing one namespace.
 */
export class IdRegistry<Id extends string> {
  private readonly ids = new Set<string>();

  constructor(private readonly entityName: string) {}

  register(id: Id): Result<Id, DomainError> {
    if (this.ids.has(id)) {
      return err(
        domainError({
          code: DomainErrorCode.DUPLICATE_ID,
          path: [this.entityName],
          target: id,
          remediation: `"${id}" is already registered as a ${this.entityName}; generate a new ID instead of reusing one.`,
        }),
      );
    }
    this.ids.add(id);
    return ok(id);
  }

  has(id: Id): boolean {
    return this.ids.has(id);
  }

  /** Fails with a structured, inspectable error instead of returning `undefined`. */
  resolve(id: Id): Result<Id, DomainError> {
    if (!this.ids.has(id)) {
      return err(
        domainError({
          code: DomainErrorCode.DANGLING_REFERENCE,
          path: [this.entityName],
          target: id,
          remediation: `"${id}" does not refer to a known ${this.entityName}; register it before referencing it, or fix the stale reference.`,
        }),
      );
    }
    return ok(id);
  }

  unregister(id: Id): void {
    this.ids.delete(id);
  }

  get size(): number {
    return this.ids.size;
  }
}
