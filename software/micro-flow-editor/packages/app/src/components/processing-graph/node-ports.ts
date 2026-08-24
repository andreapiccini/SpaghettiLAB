import type { CSSProperties } from "react";
import type { DeviceProcessingNodeData } from "@spaghettilab/device-processing-graph-model";

/**
 * Port layout for a processing-graph card. The canvas shape (which sides are
 * closed/rounded) and which handles render both come from this — add a future
 * kind here and the node picks up the n8n-style shell without a one-off branch
 * in ProcessingNode.
 *
 * The card shell is sharp on three corners; only bottom-left is rounded.
 */
export type NodePortLayout = {
  readonly hasInput: boolean;
  readonly hasOutput: boolean;
};

export function portsForKind(kind: DeviceProcessingNodeData["kind"]): NodePortLayout {
  switch (kind) {
    case "schedule":
    case "event-source":
      return { hasInput: false, hasOutput: true };
    case "block":
      return { hasInput: true, hasOutput: true };
    case "rule":
      return { hasInput: false, hasOutput: false };
  }
}

const CLOSED = 28;
const OPEN = 12;
/** Sharp corners; only bottom-left is rounded. */
const MARK = 2;

export function nodeShellRadius(ports: NodePortLayout): string {
  const round = ports.hasInput ? OPEN : CLOSED;
  return `${MARK}px ${MARK}px ${MARK}px ${round}px`;
}

export const SOURCE_HANDLE_STYLE: CSSProperties = {
  width: 14,
  height: 14,
  borderRadius: 9999,
  background: "var(--color-surface)",
  border: "2px solid var(--color-brand-blue)",
};

export const TARGET_HANDLE_STYLE: CSSProperties = {
  width: 10,
  height: 14,
  borderRadius: 2,
  background: "var(--color-surface)",
  border: "2px solid var(--color-brand-blue)",
};
