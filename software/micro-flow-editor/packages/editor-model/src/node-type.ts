import type { FieldDescriptor } from "./form-model.js";
import type { HandleDescriptor } from "./handle.js";

export type NodeTypeSource = "module-driver" | "device-profile";

/**
 * One node type available in the editor — never a concrete device
 * hardcoded in this package (S042 § Fine task). `handles`/`propertySchema`
 * are empty for every node type built from today's catalog: the Protocol V1
 * wire format has no per-driver handle/property data yet (see
 * `editor-model.ts`'s doc comment and the same honest gap already recorded
 * in `@spaghettilab/catalog-model`'s README). The shape is ready for when it
 * does.
 */
export type NodeTypeDescriptor = {
  readonly typeId: string;
  readonly source: NodeTypeSource;
  readonly handles: readonly HandleDescriptor[];
  readonly propertySchema: readonly FieldDescriptor[];
  readonly requiredCapabilities: readonly string[];
};
