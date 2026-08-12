import { domainError, err, ok, type DomainError, type Result } from "@spaghettilab/domain";
import { EditorModelErrorCode } from "./errors.js";
import type { FieldKind } from "./field-kind.js";

/**
 * What the catalog declares about one property field — the source a form
 * field is generated from (S042 point 2). Nothing here is invented per node
 * type: every value comes from the field's own descriptor, never a
 * hardcoded assumption about a specific device.
 */
export type FieldDescriptor = {
  readonly fieldId: number;
  readonly kind: FieldKind;
  readonly required: boolean;
  readonly default?: unknown;
  /** Numeric kinds only (`int`/`uint`/`fixed-point`). */
  readonly unit?: string;
  /** `fixed-point` only — e.g. 256 for Q8.8. */
  readonly fixedPointScale?: number;
  /** `enum` only. */
  readonly enumValues?: readonly { readonly value: number; readonly label: string }[];
  /** `reference` only — which reference group this field points into. */
  readonly referenceGroup?: string;
  /** `int`/`uint` only — true when the value can exceed `Number.MAX_SAFE_INTEGER` and must use S021's lossless bigint<->JSON string rule rather than a plain JS number. */
  readonly losslessInteger?: boolean;
};

export type FormFieldModel = {
  readonly fieldId: number;
  readonly kind: FieldKind;
  readonly required: boolean;
  readonly hasDefault: boolean;
  readonly default?: unknown;
  readonly unit?: string;
  readonly fixedPointScale?: number;
  readonly enumOptions?: readonly { readonly value: number; readonly label: string }[];
  readonly referenceGroup?: string;
  readonly requiresLosslessEncoding: boolean;
};

function invalid(fieldId: number, detail: string): DomainError {
  return domainError({
    code: EditorModelErrorCode.INVALID_FIELD_DESCRIPTOR,
    path: ["fieldDescriptor", String(fieldId)],
    target: String(fieldId),
    remediation: detail,
  });
}

/**
 * Builds one typed form field from its descriptor, validating the
 * kind-specific invariants a form renderer needs to trust (S042 point 2:
 * "distingui required/default, integer lossless, bytes, text, enum,
 * reference e unità fixed-point").
 */
export function buildFormField(descriptor: FieldDescriptor): Result<FormFieldModel, DomainError> {
  if (descriptor.kind === "enum" && (!descriptor.enumValues || descriptor.enumValues.length === 0)) {
    return err(invalid(descriptor.fieldId, "an enum field must declare at least one enumValues option"));
  }
  if (descriptor.kind === "reference" && !descriptor.referenceGroup) {
    return err(invalid(descriptor.fieldId, "a reference field must declare referenceGroup"));
  }
  if (descriptor.kind === "fixed-point" && !descriptor.fixedPointScale) {
    return err(invalid(descriptor.fieldId, "a fixed-point field must declare fixedPointScale"));
  }
  if ((descriptor.kind === "int" || descriptor.kind === "uint") && descriptor.fixedPointScale !== undefined) {
    return err(invalid(descriptor.fieldId, `fixedPointScale is only valid on "fixed-point" fields, not "${descriptor.kind}"`));
  }

  return ok({
    fieldId: descriptor.fieldId,
    kind: descriptor.kind,
    required: descriptor.required,
    hasDefault: descriptor.default !== undefined,
    default: descriptor.default,
    unit: descriptor.unit,
    fixedPointScale: descriptor.fixedPointScale,
    enumOptions: descriptor.enumValues,
    referenceGroup: descriptor.referenceGroup,
    requiresLosslessEncoding: (descriptor.kind === "int" || descriptor.kind === "uint") && descriptor.losslessInteger === true,
  });
}

/**
 * Builds a form model from a full property schema, collecting every
 * validation failure instead of stopping at the first (same pattern as
 * `@spaghettilab/domain`'s `validateProjectV1`) — a caller can report every
 * problem in one pass.
 */
export function buildFormModel(schema: readonly FieldDescriptor[]): Result<readonly FormFieldModel[], readonly DomainError[]> {
  const fields: FormFieldModel[] = [];
  const errors: DomainError[] = [];
  for (const descriptor of schema) {
    const result = buildFormField(descriptor);
    if (result.ok) fields.push(result.value);
    else errors.push(result.error);
  }
  if (errors.length > 0) return err(errors);
  return ok(fields);
}
