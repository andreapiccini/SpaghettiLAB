import type { HandleDescriptor } from "@spaghettilab/editor-model";
import type { GraphNode } from "@spaghettilab/domain";
import type { DeviceProcessingNodeData } from "./entities.js";

/**
 * Mirrors `struct spaghetti_block_port_descriptor { port_id, name,
 * accepted_types, required }` (`block_driver.h`) via `editor-model`'s own
 * `HandleDescriptor` (its `valueType`/`unit`/`referenceGroup` are exactly
 * `block_driver.h`'s `accepted_types` bitmask and `schema.h`'s
 * `field_descriptor.unit`/`reference_group`, projected through S042's
 * `FieldKind`) plus the one extra bit `HandleDescriptor` doesn't carry:
 * whether this input must be connected before compile (S071 point 3,
 * "input required").
 */
export type ProcessingPort = HandleDescriptor & { readonly required?: boolean };

export type ProcessingNodeDescriptor = {
  readonly inputs: readonly ProcessingPort[];
  readonly outputs: readonly ProcessingPort[];
};

/**
 * Block/Rule port data is not on the wire today (`GET_CATALOG` only returns
 * `{typeId, commandCount}` — see `@spaghettilab/catalog-model`'s README for
 * the same gap already documented for Module Driver catalog entries). This
 * package therefore never invents port/type data itself: a caller supplies
 * it (e.g. from a locally-authored Block/Rule Driver manifest once one
 * exists), the same "caller-supplied, not invented" pattern
 * `@spaghettilab/editor-model`'s `checkHandleCompatibility` uses for
 * `installedCapabilities`. Returning `undefined` for a node means its ports
 * are unknown — edges touching it skip type/unit checking rather than being
 * guessed compatible or incompatible.
 */
export type ResolveProcessingNodeDescriptor = (
  node: GraphNode<"device-processing", string, DeviceProcessingNodeData>,
) => ProcessingNodeDescriptor | undefined;
