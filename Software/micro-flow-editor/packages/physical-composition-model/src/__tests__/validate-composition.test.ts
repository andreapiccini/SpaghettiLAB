import type { TopologyIndex } from "@spaghettilab/catalog-model";
import type { GraphNode } from "@spaghettilab/domain";
import { describe, expect, it } from "vitest";
import { RailAssurance } from "../power.js";
import { validateComposition } from "../validate-composition.js";
import type { ModuleNodeData, PhysicalCompositionNodeData } from "../entities.js";

type Node = GraphNode<"physical-composition", string, PhysicalCompositionNodeData>;

function topology(): TopologyIndex {
  return {
    complete: true,
    ports: [{ portId: 1 }, { portId: 2 }],
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
            rails: [
              { railId: 1000, assurance: RailAssurance.SWITCHED, maxTotalMicroamps: 500_000 },
              { railId: 1001, assurance: RailAssurance.UNMANAGED, maxTotalMicroamps: 0 },
            ],
          },
        ],
      },
      {
        flowId: 11,
        portId: 2,
        direction: 1,
        signalCount: 1,
        bays: [],
      },
    ],
  };
}

function moduleNode(id: string, overrides: Partial<ModuleNodeData> = {}): Node {
  return {
    layer: "physical-composition",
    id,
    data: {
      kind: "module",
      driverTypeId: "driver.generic",
      portId: 1,
      bayId: 100,
      railId: 1000,
      electricalMode: "input-output",
      properties: {},
      ...overrides,
    },
  };
}

describe("validateComposition — S050 § Verifiche", () => {
  it("accepts two I2C Modules on the same Port with distinct addresses", () => {
    const nodes = [
      moduleNode("m1", { endpoint: { address: 0x10 } }),
      moduleNode("m2", { endpoint: { address: 0x11 } }),
    ];
    const result = validateComposition(nodes, topology(), { acknowledgedModuleNodeIds: new Set(["m1", "m2"]) });
    expect(result.ok).toBe(true);
  });

  it("rejects two Modules on the same Port sharing an address as an endpoint collision", () => {
    const nodes = [
      moduleNode("m1", { endpoint: { address: 0x10 } }),
      moduleNode("m2", { endpoint: { address: 0x10 } }),
    ];
    const result = validateComposition(nodes, topology(), { acknowledgedModuleNodeIds: new Set(["m1", "m2"]) });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.some((e) => e.code === "physical-composition.endpoint_collision")).toBe(true);
      expect(result.error.filter((e) => e.code === "physical-composition.endpoint_collision")).toHaveLength(2);
    }
  });

  it("rejects a Bay that does not exist under the Module's Port", () => {
    const nodes = [moduleNode("m1", { bayId: 999, endpoint: { address: 0x10 } })];
    const result = validateComposition(nodes, topology());
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error[0]!.code).toBe("physical-composition.bay_not_declared");
  });

  it("rejects a Port that is not declared by any Flow", () => {
    const nodes = [moduleNode("m1", { portId: 999, endpoint: { address: 0x10 } })];
    const result = validateComposition(nodes, topology());
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error[0]!.code).toBe("physical-composition.port_not_declared");
  });

  it("rejects a Rail that does not exist under the Module's Bay (incompatible rail)", () => {
    const nodes = [moduleNode("m1", { railId: 9999, endpoint: { address: 0x10 } })];
    const result = validateComposition(nodes, topology(), { acknowledgedModuleNodeIds: new Set(["m1"]) });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error[0]!.code).toBe("physical-composition.rail_not_declared");
  });

  it("rejects a Port whose Flow declares no bays at all (wrong transport for this Port)", () => {
    const nodes = [moduleNode("m1", { portId: 2, bayId: 1, railId: 1, endpoint: { address: 0x10 } })];
    const result = validateComposition(nodes, topology());
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error[0]!.code).toBe("physical-composition.bay_not_declared");
  });

  it("flags a transport mismatch when a caller-classified I2C driver has no address", () => {
    const nodes = [moduleNode("m1", { driverTypeId: "driver.i2c-sensor" })];
    const result = validateComposition(nodes, topology(), {
      transportOf: (typeId) => (typeId === "driver.i2c-sensor" ? "i2c" : undefined),
      acknowledgedModuleNodeIds: new Set(["m1"]),
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.some((e) => e.code === "physical-composition.transport_mismatch")).toBe(true);
  });

  it("flags a transport mismatch when a caller-classified SPI driver has no chip-select", () => {
    const nodes = [moduleNode("m1", { driverTypeId: "driver.spi-sensor", endpoint: { address: 0x10 } })];
    const result = validateComposition(nodes, topology(), {
      transportOf: (typeId) => (typeId === "driver.spi-sensor" ? "spi" : undefined),
      acknowledgedModuleNodeIds: new Set(["m1"]),
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.some((e) => e.code === "physical-composition.transport_mismatch")).toBe(true);
  });

  it("passive (UNMANAGED) power requires an explicit acknowledgement", () => {
    const nodes = [moduleNode("m1", { railId: 1001, endpoint: { address: 0x10 } })];
    const withoutAck = validateComposition(nodes, topology());
    expect(withoutAck.ok).toBe(false);
    if (!withoutAck.ok) {
      expect(withoutAck.error.some((e) => e.code === "physical-composition.missing_power_acknowledgement")).toBe(true);
    }
    const withAck = validateComposition(nodes, topology(), { acknowledgedModuleNodeIds: new Set(["m1"]) });
    expect(withAck.ok).toBe(true);
  });

  it("rejects two Modules sharing the same non-zero moduleKey", () => {
    const nodes = [
      moduleNode("m1", { moduleKey: 5, endpoint: { address: 0x10 } }),
      moduleNode("m2", { moduleKey: 5, endpoint: { address: 0x11 } }),
    ];
    const result = validateComposition(nodes, topology(), { acknowledgedModuleNodeIds: new Set(["m1", "m2"]) });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.filter((e) => e.code === "physical-composition.module_key_conflict")).toHaveLength(2);
  });

  it("collects every problem instead of stopping at the first", () => {
    const nodes = [
      moduleNode("m1", { portId: 999, endpoint: { address: 0x10 } }),
      moduleNode("m2", { bayId: 999, endpoint: { address: 0x11 } }),
    ];
    const result = validateComposition(nodes, topology());
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.length).toBeGreaterThanOrEqual(2);
  });

  it("ignores non-module nodes entirely", () => {
    const nodes: Node[] = [{ layer: "physical-composition", id: "b1", data: { kind: "backbone", variant: "din" } }];
    const result = validateComposition(nodes, topology());
    expect(result.ok).toBe(true);
  });
});
