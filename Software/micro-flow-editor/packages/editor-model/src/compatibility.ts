import { domainError, err, ok, type DomainError, type Result } from "@spaghettilab/domain";
import { EditorModelErrorCode } from "./errors.js";
import type { HandleDescriptor } from "./handle.js";

function failure(code: string, source: HandleDescriptor, target: HandleDescriptor, remediation: string): DomainError {
  return domainError({
    code,
    path: ["edge", source.handleId, target.handleId],
    target: target.handleId,
    remediation,
  });
}

/**
 * Checks whether an edge from `source` to `target` is allowed — schema
 * (value type), unit, semantic/reference group, direction, an opt-in Flow
 * constraint, and capability (S042 point 3). Never mutates or creates
 * anything; a caller uses the result to decide whether to actually add the
 * edge (see `createEdgeIfCompatible`). `installedCapabilities` is optional:
 * when omitted, the capability check is skipped rather than guessed —
 * resolving what's actually installed on a Core is S030/S041's job, not
 * this pure function's.
 */
export function checkHandleCompatibility(
  source: HandleDescriptor,
  target: HandleDescriptor,
  installedCapabilities?: ReadonlySet<string>,
): Result<void, DomainError> {
  if (source.direction !== "output" || target.direction !== "input") {
    return err(
      failure(
        EditorModelErrorCode.DIRECTION_MISMATCH,
        source,
        target,
        "an edge must connect an output handle to an input handle",
      ),
    );
  }
  if (source.valueType !== target.valueType) {
    return err(
      failure(
        EditorModelErrorCode.TYPE_MISMATCH,
        source,
        target,
        `expected a "${source.valueType}" handle, target is "${target.valueType}"`,
      ),
    );
  }
  if (source.unit !== target.unit) {
    return err(
      failure(
        EditorModelErrorCode.UNIT_MISMATCH,
        source,
        target,
        `unit mismatch: "${source.unit ?? "none"}" -> "${target.unit ?? "none"}" — add an explicit transformation instead of connecting directly`,
      ),
    );
  }
  if (source.valueType === "reference" && source.referenceGroup !== target.referenceGroup) {
    return err(
      failure(
        EditorModelErrorCode.REFERENCE_GROUP_MISMATCH,
        source,
        target,
        `reference group mismatch: "${source.referenceGroup ?? "none"}" -> "${target.referenceGroup ?? "none"}"`,
      ),
    );
  }
  if (source.semanticGroup && target.semanticGroup && source.semanticGroup !== target.semanticGroup) {
    return err(
      failure(
        EditorModelErrorCode.SEMANTIC_GROUP_MISMATCH,
        source,
        target,
        `semantic group mismatch: "${source.semanticGroup}" -> "${target.semanticGroup}"`,
      ),
    );
  }
  if (source.requireSameFlow || target.requireSameFlow) {
    if (source.flowId === undefined || target.flowId === undefined || source.flowId !== target.flowId) {
      return err(
        failure(
          EditorModelErrorCode.FLOW_MISMATCH,
          source,
          target,
          "this handle requires both ends of the edge to be on the same Flow",
        ),
      );
    }
  }
  if (installedCapabilities && target.requiredCapabilities && target.requiredCapabilities.length > 0) {
    const missing = target.requiredCapabilities.filter((c) => !installedCapabilities.has(c));
    if (missing.length > 0) {
      return err(
        failure(
          EditorModelErrorCode.MISSING_CAPABILITY,
          source,
          target,
          `install: ${missing.join(", ")}`,
        ),
      );
    }
  }
  return ok(undefined);
}

export type EdgeDescriptor = {
  readonly sourceHandleId: string;
  readonly targetHandleId: string;
};

/** Returns the edge only if compatible — never a half-created edge on failure. */
export function createEdgeIfCompatible(
  source: HandleDescriptor,
  target: HandleDescriptor,
  installedCapabilities?: ReadonlySet<string>,
): Result<EdgeDescriptor, DomainError> {
  const check = checkHandleCompatibility(source, target, installedCapabilities);
  if (!check.ok) return check;
  return ok({ sourceHandleId: source.handleId, targetHandleId: target.handleId });
}
