import { describe, expect, it } from "vitest";
import { normalizeTopologyPages } from "../topology-index.js";
import type { GetTopologyResponse } from "@spaghettilab/protocol-sdk";

// Raw rail assurance values as reported by the Core — this package doesn't
// know or assume their semantic labels (see the S021 research note on
// unresolved enum labels), it only must never conflate the two.
const UNVERIFIED = 0;
const ENFORCED = 1;

function page(flows: GetTopologyResponse["flows"]): GetTopologyResponse {
  return { flows, nextCursor: 0 };
}

function flowWithRail(flowId: number, assurance: number): GetTopologyResponse["flows"][number] {
  return {
    id: flowId,
    portId: 0,
    direction: 1,
    signalCount: 5,
    bays: [
      {
        id: 1,
        ordinal: 0,
        railMask: 1,
        moduleKey: 0,
        admission: assurance,
        rails: [{ id: 1, assurance, maxTotalMicroamps: 500000 }],
      },
    ],
  };
}

describe("normalizeTopologyPages — never coerces rail assurance", () => {
  it("keeps a Core-reported UNVERIFIED rail as UNVERIFIED, never promoting it to ENFORCED", () => {
    const index = normalizeTopologyPages([page([flowWithRail(1, UNVERIFIED)])], true);
    expect(index.flows[0]!.bays[0]!.rails[0]!.assurance).toBe(UNVERIFIED);
    expect(index.flows[0]!.bays[0]!.admission).toBe(UNVERIFIED);
  });

  it("keeps a Core-reported ENFORCED rail as ENFORCED, never demoting it", () => {
    const index = normalizeTopologyPages([page([flowWithRail(1, ENFORCED)])], true);
    expect(index.flows[0]!.bays[0]!.rails[0]!.assurance).toBe(ENFORCED);
  });
});

describe("normalizeTopologyPages — order independence and Port collection", () => {
  it("produces the same index regardless of page order", () => {
    const pageA = page([flowWithRail(1, ENFORCED)]);
    const pageB = page([flowWithRail(2, UNVERIFIED)]);
    expect(normalizeTopologyPages([pageA, pageB], true)).toEqual(normalizeTopologyPages([pageB, pageA], true));
  });

  it("collects distinct Port IDs referenced across flows, sorted", () => {
    const flowOnPort2 = { ...flowWithRail(1, ENFORCED), portId: 2, capabilities: 1 };
    const flowOnPort0 = { ...flowWithRail(2, ENFORCED), portId: 0, capabilities: 24 };
    const index = normalizeTopologyPages([page([flowOnPort2, flowOnPort0])], true);
    expect(index.ports).toEqual([
      { portId: 0, capabilities: 24 },
      { portId: 2, capabilities: 1 },
    ]);
    expect(index.flows.find((flow) => flow.portId === 0)?.capabilities).toBe(24);
  });

  it("deduplicates the same flow reported on more than one page", () => {
    const flow = flowWithRail(1, ENFORCED);
    const index = normalizeTopologyPages([page([flow]), page([flow])], true);
    expect(index.flows).toHaveLength(1);
  });

  it("propagates the complete flag verbatim — an interrupted read never looks complete", () => {
    expect(normalizeTopologyPages([page([flowWithRail(1, ENFORCED)])], false).complete).toBe(false);
  });
});
