import { domainError, DomainErrorCode, type DomainError } from "./errors.js";
import type { CoreBindingId } from "./ids.js";
import type { CoreBindingRecord, ProjectV1 } from "./project.js";
import { err, ok, type Result } from "./result.js";

/**
 * A `ProjectCommand` is the *only* sanctioned way to change a `ProjectV1` —
 * S014's "ogni mutazione del dominio passa da un comando con undo/redo,
 * nessuna mutazione diretta non tracciata". It never mutates its input; it
 * returns a new `ProjectV1` (or a `DomainError` if the change is invalid),
 * which is what makes snapshot-based undo/redo in `CommandStack` correct
 * without needing a hand-written inverse for every command.
 */
export type ProjectCommand = {
  readonly kind: string;
  apply(project: ProjectV1): Result<ProjectV1, DomainError>;
};

export function renameProject(name: string): ProjectCommand {
  return {
    kind: "RenameProject",
    apply: (project) => ok({ ...project, name }),
  };
}

export function addCoreBinding(binding: CoreBindingRecord): ProjectCommand {
  return {
    kind: "AddCoreBinding",
    apply: (project) => {
      if (project.coreBindings.some((b) => b.bindingId === binding.bindingId)) {
        return err(
          domainError({
            code: DomainErrorCode.DUPLICATE_ID,
            path: ["coreBindings"],
            target: binding.bindingId,
            remediation: `A Core binding with ID "${binding.bindingId}" already exists in this project.`,
          }),
        );
      }
      return ok({ ...project, coreBindings: [...project.coreBindings, binding] });
    },
  };
}

export function removeCoreBinding(bindingId: CoreBindingId): ProjectCommand {
  return {
    kind: "RemoveCoreBinding",
    apply: (project) => {
      if (!project.coreBindings.some((b) => b.bindingId === bindingId)) {
        return err(
          domainError({
            code: DomainErrorCode.DANGLING_REFERENCE,
            path: ["coreBindings"],
            target: bindingId,
            remediation: `No Core binding with ID "${bindingId}" exists in this project.`,
          }),
        );
      }
      return ok({
        ...project,
        coreBindings: project.coreBindings.filter((b) => b.bindingId !== bindingId),
      });
    },
  };
}

/**
 * Snapshot-based undo/redo over `ProjectV1`. Each successful `execute` pushes
 * the *previous* whole-project state onto the undo stack — simple and
 * trivially correct (undo/redo reproduce an exact prior state by
 * construction, never an approximation from replaying inverse operations),
 * which is what S014's "undo/redo riproduce esattamente lo stato" asks for.
 * `ProjectV1` objects are small, immutable, and structurally shared where
 * unchanged, so this is cheap in practice, not just correct in principle.
 */
export class CommandStack {
  private readonly past: ProjectV1[] = [];
  private readonly future: ProjectV1[] = [];

  constructor(private state: ProjectV1) {}

  get current(): ProjectV1 {
    return this.state;
  }

  canUndo(): boolean {
    return this.past.length > 0;
  }

  canRedo(): boolean {
    return this.future.length > 0;
  }

  execute(command: ProjectCommand): Result<ProjectV1, DomainError> {
    const result = command.apply(this.state);
    if (!result.ok) {
      return result;
    }
    this.past.push(this.state);
    this.state = result.value;
    this.future.length = 0; // a new command invalidates the redo history
    return ok(this.state);
  }

  undo(): Result<ProjectV1, DomainError> {
    const previous = this.past.pop();
    if (previous === undefined) {
      return err(
        domainError({
          code: DomainErrorCode.NOTHING_TO_UNDO,
          path: ["commandStack"],
          target: "undo",
          remediation: "There is no earlier state to undo to.",
        }),
      );
    }
    this.future.push(this.state);
    this.state = previous;
    return ok(this.state);
  }

  redo(): Result<ProjectV1, DomainError> {
    const next = this.future.pop();
    if (next === undefined) {
      return err(
        domainError({
          code: DomainErrorCode.NOTHING_TO_REDO,
          path: ["commandStack"],
          target: "redo",
          remediation: "There is no later state to redo to.",
        }),
      );
    }
    this.past.push(this.state);
    this.state = next;
    return ok(this.state);
  }
}
