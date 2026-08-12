/**
 * The one shape every domain failure takes. No domain service ever returns a
 * bare string — a caller (test, adapter, or future UI) must always be able to
 * read the code, where it happened, and how to recover, without parsing text.
 */
export type DomainErrorSeverity = "error" | "warning";

export type DomainError = {
  /** Stable, machine-matchable identifier — never a free-form message. */
  code: string;
  severity: DomainErrorSeverity;
  /** Where in the domain model the failure occurred, e.g. ["project", "coreBindings", "0"]. */
  path: string[];
  /** What the failure is about, e.g. an entity ID or field name. */
  target: string;
  /** A human-actionable next step, not a restatement of the problem. */
  remediation: string;
  /** The underlying cause, if any — never swallowed. */
  cause?: unknown;
};

export type DomainErrorInput = Omit<DomainError, "severity"> & {
  severity?: DomainErrorSeverity;
};

/** Builds a `DomainError`, defaulting severity to `"error"`. */
export function domainError(input: DomainErrorInput): DomainError {
  return { severity: "error", ...input };
}

// Error codes used by this package. Later packages define their own codes in
// their own module — this is not meant to become a global enum.
export const DomainErrorCode = {
  // S012
  INVALID_ID: "domain.id.invalid",
  DUPLICATE_ID: "domain.id.duplicate",
  DANGLING_REFERENCE: "domain.id.dangling_reference",
  // S014
  INVALID_SCHEMA: "domain.schema.invalid",
  MIGRATION_NOT_FOUND: "domain.schema.migration_not_found",
  NOTHING_TO_UNDO: "domain.command.nothing_to_undo",
  NOTHING_TO_REDO: "domain.command.nothing_to_redo",
  // S121
  PERMISSION_DENIED: "domain.permission.denied",
} as const;
