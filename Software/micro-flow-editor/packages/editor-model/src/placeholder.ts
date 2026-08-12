import type { EditorModel } from "./editor-model.js";
import type { NodeTypeDescriptor } from "./node-type.js";

/**
 * Stands in for a node type the current `EditorModel` doesn't know —
 * `rawData` preserves whatever the caller already had (a saved node's
 * properties, an imported project's data) untouched, and `remediation`
 * points at what would resolve it. Never a deletion (S042 point 4: "gestisci
 * tipi mancanti ... come placeholder diagnostico che conserva dati e offre
 * remediation, senza cancellare nodi").
 */
export type PlaceholderDiagnostic = {
  readonly kind: "placeholder";
  readonly typeId: string;
  readonly rawData: unknown;
  readonly remediation: string;
};

export function isPlaceholderDiagnostic(value: NodeTypeDescriptor | PlaceholderDiagnostic): value is PlaceholderDiagnostic {
  return "kind" in value && value.kind === "placeholder";
}

/**
 * Resolves a node's type against the current `EditorModel`. A miss never
 * throws or drops the node — it returns a `PlaceholderDiagnostic` carrying
 * the original data and remediation instead, so the caller can render the
 * node in a "type not recognized" state without losing anything.
 */
export function resolveNodeType(
  typeId: string,
  model: EditorModel,
  rawData: unknown,
): NodeTypeDescriptor | PlaceholderDiagnostic {
  const found = model.nodeTypes.find((nodeType) => nodeType.typeId === typeId);
  if (found) return found;
  return {
    kind: "placeholder",
    typeId,
    rawData,
    remediation: `type "${typeId}" is not in the current catalog — install the Capability Pack or Device Profile that provides it, then refresh the catalog`,
  };
}
