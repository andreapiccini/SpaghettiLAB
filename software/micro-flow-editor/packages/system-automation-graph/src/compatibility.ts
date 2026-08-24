export const LinkCompatibility = {
  /** Same type, same unit (or neither side declares one) — no transformation needed. */
  COMPATIBLE: "COMPATIBLE",
  /** Types/units differ, but the caller declared an explicit transformation — allowed. */
  TRANSFORMED: "TRANSFORMED",
  /** Types/units differ and no transformation was declared — S111 § Verifiche: never converted implicitly. */
  INCOMPATIBLE: "INCOMPATIBLE",
  /** One or both endpoints aren't in the supplied `FieldRegistry` — cannot judge compatibility at all. */
  UNKNOWN: "UNKNOWN",
} as const;

export type LinkCompatibilityKind = (typeof LinkCompatibility)[keyof typeof LinkCompatibility];

export type LinkCompatibilityResult = {
  readonly kind: LinkCompatibilityKind;
  readonly reason: string;
};

/**
 * "Un link temperatura→display deve dichiarare trasformazione quando gli
 * schemi differiscono" (S111 § Implementazione point 2) — compares
 * `valueType` and `unit`. Any difference in either requires a non-empty
 * `transformation` string; without one, the link is `INCOMPATIBLE`, never
 * silently allowed through with an implicit conversion. `transformation`'s
 * content is opaque to this function (a caller-side registry/label like
 * `"celsius-to-fahrenheit"`) — this engine only enforces that *something*
 * was explicitly declared, not that it's the right something.
 */
export function checkFieldCompatibility(
  source: { readonly valueType?: string; readonly unit?: string },
  target: { readonly valueType?: string; readonly unit?: string },
  transformation?: string,
): LinkCompatibilityResult {
  const typeMatches = source.valueType === target.valueType;
  const unitMatches = source.unit === target.unit;

  if (typeMatches && unitMatches) {
    return { kind: LinkCompatibility.COMPATIBLE, reason: "source and target types/units match" };
  }

  if (transformation && transformation.trim().length > 0) {
    return { kind: LinkCompatibility.TRANSFORMED, reason: `explicit transformation "${transformation}" declared for mismatched ${!typeMatches ? "type" : "unit"}` };
  }

  return {
    kind: LinkCompatibility.INCOMPATIBLE,
    reason: `source (${source.valueType ?? "unknown"}${source.unit ? `/${source.unit}` : ""}) and target (${target.valueType ?? "unknown"}${target.unit ? `/${target.unit}` : ""}) differ and no transformation was declared`,
  };
}
