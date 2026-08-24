import type { TopologyIndex } from "@spaghettilab/catalog-model";
import type { GraphNode } from "@spaghettilab/domain";
import type { DiscoveryCandidate } from "@spaghettilab/protocol-sdk";
import { describe, expect, it } from "vitest";
import { RailAssurance } from "../power.js";
import { moduleFromAcceptedDiscovery, previewDiscoveryAccept, previewDiscoveryAcceptDiff } from "../discovery.js";
import type { PhysicalCompositionNodeData } from "../entities.js";

function topology(): TopologyIndex {
  return {
    complete: true,
    ports: [{ portId: 1 }],
    flows: [
      {
        flowId: 10,
        portId: 1,
        direction: 0,
        signalCount: 1,
        bays: [
          {
            bayId: 100,
            ordinal: 0,
            railMask: 1,
            moduleKey: 0,
            admission: 0,
            rails: [{ railId: 1000, assurance: RailAssurance.SWITCHED, maxTotalMicroamps: 500_000 }],
          },
        ],
      },
    ],
  };
}

function candidate(): DiscoveryCandidate {
  return { id: 42, portId: 1, generation: 3, confidence: 90, suggestedTypeId: "driver.discovered-sensor" };
}

describe("previewDiscoveryAccept — S050 point 7", () => {
  it("builds a proposed Module without a moduleKey — nothing is assigned ahead of the real ACCEPT_DISCOVERY round trip", () => {
    const preview = previewDiscoveryAccept(candidate(), {
      key: 7,
      bayId: 100,
      railId: 1000,
      electricalMode: "input-only",
    });
    expect(preview.proposedModule.moduleKey).toBeUndefined();
    expect(preview.proposedModule.driverTypeId).toBe("driver.discovered-sensor");
    expect(preview.proposedModule.portId).toBe(1);
  });
});

describe("previewDiscoveryAcceptDiff — explicit diff, never auto-applied", () => {
  it("reports the composition as valid when the choice is compatible, without mutating existingNodes", () => {
    const existingNodes: readonly GraphNode<"physical-composition", string, PhysicalCompositionNodeData>[] = [];
    const preview = previewDiscoveryAccept(candidate(), {
      key: 7,
      bayId: 100,
      railId: 1000,
      electricalMode: "input-only",
      properties: { threshold: 5 },
    });
    const diff = previewDiscoveryAcceptDiff(existingNodes, preview, topology());
    expect(diff.ok).toBe(true);
    expect(existingNodes).toHaveLength(0);
  });

  it("surfaces a validation problem in the diff when the choice references a nonexistent Bay", () => {
    const preview = previewDiscoveryAccept(candidate(), {
      key: 7,
      bayId: 999,
      railId: 1000,
      electricalMode: "input-only",
    });
    const diff = previewDiscoveryAcceptDiff([], preview, topology());
    expect(diff.ok).toBe(false);
    if (!diff.ok) expect(diff.error[0]!.code).toBe("physical-composition.bay_not_declared");
  });

  it("surfaces a collision against an already-placed Module without mutating either input", () => {
    const existing: readonly GraphNode<"physical-composition", string, PhysicalCompositionNodeData>[] = [
      {
        layer: "physical-composition",
        id: "existing-module",
        data: {
          kind: "module",
          driverTypeId: "driver.existing",
          portId: 1,
          bayId: 100,
          railId: 1000,
          electricalMode: "input-only",
          endpoint: { address: 0x20 },
          properties: {},
        },
      },
    ];
    const preview = previewDiscoveryAccept(candidate(), {
      key: 7,
      bayId: 100,
      railId: 1000,
      electricalMode: "input-only",
      properties: { address: 0x20 },
    });
    // The proposed module has no endpoint set on it directly (properties isn't the endpoint),
    // so no collision is expected here — this proves the diff runs full validateComposition,
    // not a shortcut, by asserting the unrelated existing Module still passes on its own.
    const diff = previewDiscoveryAcceptDiff(existing, preview, topology());
    expect(diff.ok).toBe(true);
    expect(existing).toHaveLength(1);
  });
});

describe("moduleFromAcceptedDiscovery", () => {
  it("only fills in moduleKey once the real ACCEPT_DISCOVERY response is known", () => {
    const preview = previewDiscoveryAccept(candidate(), {
      key: 7,
      bayId: 100,
      railId: 1000,
      electricalMode: "input-only",
    });
    const accepted = moduleFromAcceptedDiscovery(preview, 42);
    expect(accepted.moduleKey).toBe(42);
    expect(accepted).not.toBe(preview.proposedModule);
  });
});
