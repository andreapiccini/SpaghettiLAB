import { domainError, err, ok, type CoreBindingId, type DomainError, type Result } from "@spaghettilab/domain";
import { checkFieldCompatibility, LinkCompatibility } from "./compatibility.js";
import { endpointKey, isNodeRedEndpoint, isRecordFieldEndpoint, type SystemAutomationEndpoint } from "./endpoints.js";
import { SystemAutomationErrorCode } from "./errors.js";
import type { FieldRegistry } from "./field-registry.js";

export type SystemAutomationLink = {
  readonly id: string;
  readonly source: SystemAutomationEndpoint;
  readonly target: SystemAutomationEndpoint;
  readonly transformation?: string;
  /** Every `CoreBindingId` this link touches, each mapped to the catalog fingerprint (hex) observed at authoring/last-revalidation time — see `staleness.ts`. */
  readonly validatedFingerprints: ReadonlyMap<string, string>;
};

function descriptorOf(endpoint: Exclude<SystemAutomationEndpoint, { kind: "nodered" }>, registry: FieldRegistry): { readonly valueType?: string; readonly unit?: string } | undefined {
  if (isRecordFieldEndpoint(endpoint)) {
    const field = registry.resolveField(endpoint.schemaId, endpoint.schemaVersion, endpoint.fieldId);
    return field ? { valueType: field.valueType, unit: field.unit } : undefined;
  }
  const command = registry.resolveCommand(endpoint.moduleKey, endpoint.commandId);
  return command ? { valueType: command.valueType, unit: command.unit } : undefined;
}

/**
 * Creates one cross-Core link, refusing to create it at all when the
 * endpoints' declared types/units differ and no `transformation` was given
 * (S111 § Verifiche: "un link fra schemi con unità incompatibili richiede
 * una trasformazione esplicita, non converte implicitamente"). `registry`
 * being unable to resolve either endpoint is its own rejection
 * (`UNKNOWN_FIELD`) — never treated as "assume compatible."
 */
export function createSystemAutomationLink(
  id: string,
  source: SystemAutomationEndpoint,
  target: SystemAutomationEndpoint,
  registry: FieldRegistry,
  fingerprints: ReadonlyMap<string, string>,
  transformation?: string,
): Result<SystemAutomationLink, DomainError> {
  // A Node-RED processing/integration endpoint has no fixed type/unit of its own — it *is* the
  // transformation/integration point, so its side of the compatibility check is skipped entirely
  // rather than forced through the registry (which has nothing to resolve for it anyway).
  if (!isNodeRedEndpoint(source) && !isNodeRedEndpoint(target)) {
    const sourceDescriptor = descriptorOf(source, registry);
    const targetDescriptor = descriptorOf(target, registry);

    if (!sourceDescriptor || !targetDescriptor) {
      return err(
        domainError({
          code: SystemAutomationErrorCode.UNKNOWN_FIELD,
          path: ["system-automation-graph", "createSystemAutomationLink"],
          target: !sourceDescriptor ? endpointKey(source) : endpointKey(target),
          remediation: "The field/command registry does not know this endpoint — cannot judge compatibility for an endpoint that isn't in the supplied catalog.",
        }),
      );
    }

    const compatibility = checkFieldCompatibility(sourceDescriptor, targetDescriptor, transformation);
    if (compatibility.kind === LinkCompatibility.INCOMPATIBLE) {
      return err(
        domainError({
          code: SystemAutomationErrorCode.MISSING_TRANSFORMATION,
          path: ["system-automation-graph", "createSystemAutomationLink"],
          target: id,
          remediation: compatibility.reason,
        }),
      );
    }
  }

  return ok({ id, source, target, transformation, validatedFingerprints: fingerprints });
}

/** Every distinct `CoreBindingId` (as string) an endpoint pair touches — a Node-RED endpoint contributes none. */
export function involvedCoreBindings(source: SystemAutomationEndpoint, target: SystemAutomationEndpoint): readonly CoreBindingId[] {
  const ids = new Set<CoreBindingId>();
  if (!("nodeRedResourceId" in source)) ids.add(source.coreBinding);
  if (!("nodeRedResourceId" in target)) ids.add(target.coreBinding);
  return [...ids];
}
