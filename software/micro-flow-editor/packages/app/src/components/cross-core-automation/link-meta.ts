import type { CrossCoreNodeData } from "./node-data.js";

/**
 * The part of a `SystemAutomationLink` that `GraphEdge` has no room to
 * persist (`transformation`/`validatedFingerprints`) — kept in React state
 * at the screen level, shared between the Grafo/Deploy/Diagnostica tabs.
 * See `GraphTab.tsx`'s doc comment for why this can't live in `ProjectV1`.
 */
export type LinkMeta = {
  readonly transformation?: string;
  readonly validatedFingerprints: ReadonlyMap<string, string>;
};

/**
 * Same shape as `@spaghettilab/system-automation-graph`'s `SystemAutomationLink`,
 * but `source`/`target` keep the app's richer `CrossCoreNodeData` (label +
 * valueType/unit) instead of widening to the package's bare
 * `SystemAutomationEndpoint` — every tab needs those extra authored fields
 * for display/compatibility, and `CrossCoreNodeData` is structurally a
 * `SystemAutomationEndpoint`, so this still satisfies any function expecting
 * `readonly SystemAutomationLink[]` without a cast.
 */
export type AppLink = {
  readonly id: string;
  readonly source: CrossCoreNodeData;
  readonly target: CrossCoreNodeData;
  readonly transformation?: string;
  readonly validatedFingerprints: ReadonlyMap<string, string>;
};
