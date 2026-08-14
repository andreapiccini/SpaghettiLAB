import type { AuthoringMetadata, CoreBindingRecord, GraphState } from "@spaghettilab/domain";
import type { Node } from "@xyflow/react";
import { coreColor } from "./core-palette.js";
import type { CrossCoreNodeData } from "./node-data.js";

export type CrossCoreRfNodeData = {
  readonly domainData: CrossCoreNodeData;
  readonly colorVar: string;
};

/** Mirrors `physical-composition/to-nodes.ts`'s pattern — merges persisted `GraphState` with `AuthoringMetadata` positions, resolving each node's Core color from `coreBindings` order (`ux/screens/S110-cross-core-automation/visual.md` § Palette Core). */
export function toCrossCoreNodes(graphState: GraphState<"system-automation">, authoringMetadata: Readonly<Record<string, AuthoringMetadata>>, bindings: readonly CoreBindingRecord[]): Node<CrossCoreRfNodeData>[] {
  return graphState.nodes.map((node) => {
    const meta = authoringMetadata[node.id];
    const data = node.data as CrossCoreNodeData;
    return {
      id: node.id,
      type: "crossCore",
      position: meta?.position ?? { x: 0, y: 0 },
      selected: meta?.selected ?? false,
      data: {
        domainData: data,
        colorVar: data.kind === "nodered" ? "var(--color-ink-faint)" : coreColor(bindings, data.coreBinding),
      },
    };
  });
}
