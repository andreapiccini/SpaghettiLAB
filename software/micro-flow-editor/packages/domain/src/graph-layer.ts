/**
 * The three distinct models from REACT_FLOW_ARCHITECTURE.md § Tre grafi
 * distinti. They can be shown together in the UI, but must never share
 * ownership or serialization — this tag is what `Graph` (see `graph.ts`) uses
 * to reject a node/edge from the wrong layer, at construction time, not just
 * by convention.
 */
export type GraphLayer =
  | "physical-composition"
  | "device-processing"
  | "system-automation";

export const GraphLayer = {
  /** Backbone → Power → Connector/Bay IN → Core → Bay OUT/Connector. */
  PHYSICAL_COMPOSITION: "physical-composition",
  /** Module/Device Profile → schedule/event → Block → Block → record/Rule/command. */
  DEVICE_PROCESSING: "device-processing",
  /** Core A / field → Node-RED → Core B / command. */
  SYSTEM_AUTOMATION: "system-automation",
} as const satisfies Record<string, GraphLayer>;
