import type { GetTopologyResponse } from "@spaghettilab/protocol-sdk";

export type PortEntry = { readonly portId: number };

/** `assurance` is the raw value the Core reported (`ENFORCED`/`UNVERIFIED` per `REACT_FLOW_ARCHITECTURE.md`) — never normalized/coerced (S041 § Verifiche). */
export type RailEntry = {
  readonly railId: number;
  readonly assurance: number;
  readonly maxTotalMicroamps: number;
};

export type FunctionBayEntry = {
  readonly bayId: number;
  readonly ordinal: number;
  readonly railMask: number;
  /** 0 if no Module is placed in this Bay. */
  readonly moduleKey: number;
  readonly admission: number;
  readonly rails: readonly RailEntry[];
};

export type FlowEntry = {
  readonly flowId: number;
  readonly portId: number;
  readonly direction: number;
  readonly signalCount: number;
  readonly bays: readonly FunctionBayEntry[];
};

export type TopologyIndex = {
  readonly flows: readonly FlowEntry[];
  /** Distinct Port IDs referenced by any Flow — the wire protocol has no separate Port-listing operation, this is the only Port data available (S041 § Obiettivo: "senza GPIO hardcoded" — there is no GPIO field anywhere to hardcode in the first place). */
  readonly ports: readonly PortEntry[];
  readonly complete: boolean;
};

/**
 * Normalizes raw `GET_TOPOLOGY` pages (S021/S030) into an immutable, order-
 * independent index. `admission`/`assurance` values are passed through
 * exactly as the Core reported them — this function has no logic that could
 * promote/demote either one, by construction.
 */
export function normalizeTopologyPages(pages: readonly GetTopologyResponse[], complete: boolean): TopologyIndex {
  const flowsById = new Map<number, FlowEntry>();
  const portIds = new Set<number>();

  for (const page of pages) {
    for (const flow of page.flows) {
      portIds.add(flow.portId);
      flowsById.set(flow.id, {
        flowId: flow.id,
        portId: flow.portId,
        direction: flow.direction,
        signalCount: flow.signalCount,
        bays: flow.bays.map((bay) => ({
          bayId: bay.id,
          ordinal: bay.ordinal,
          railMask: bay.railMask,
          moduleKey: bay.moduleKey,
          admission: bay.admission,
          rails: bay.rails.map((rail) => ({
            railId: rail.id,
            assurance: rail.assurance,
            maxTotalMicroamps: rail.maxTotalMicroamps,
          })),
        })),
      });
    }
  }

  const flows = [...flowsById.values()].sort((a, b) => a.flowId - b.flowId);
  const ports = [...portIds].sort((a, b) => a - b).map((portId) => ({ portId }));
  return { flows, ports, complete };
}
