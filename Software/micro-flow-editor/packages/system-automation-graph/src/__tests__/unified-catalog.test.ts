import { describe, expect, it } from "vitest";
import { findCoreCatalogEntry, toFieldRegistry, type UnifiedCoreCatalog } from "../unified-catalog.js";
import { CORE_A, CORE_B } from "./fixtures.js";

const catalog: UnifiedCoreCatalog = [
  {
    coreBinding: CORE_A,
    deviceId: "aa",
    reachable: true,
    availableRecordFields: [{ schemaId: "sensor.temp", schemaVersion: 1, fieldId: 0, valueType: "float", unit: "celsius" }],
    availableCommands: [{ moduleKey: 1, commandId: 1, valueType: "bool" }],
  },
  {
    coreBinding: CORE_B,
    deviceId: "bb",
    reachable: false,
    availableRecordFields: [],
    availableCommands: [],
  },
];

describe("findCoreCatalogEntry", () => {
  it("finds the entry for a known CoreBinding", () => {
    expect(findCoreCatalogEntry(catalog, CORE_A)?.deviceId).toBe("aa");
  });
  it("returns undefined for an unknown CoreBinding", () => {
    const unknown = catalog[0]!.coreBinding;
    expect(findCoreCatalogEntry([], unknown)).toBeUndefined();
  });
});

describe("toFieldRegistry", () => {
  it("resolves a field declared anywhere in the unified catalog", () => {
    const registry = toFieldRegistry(catalog);
    expect(registry.resolveField("sensor.temp", 1, 0)?.unit).toBe("celsius");
  });

  it("resolves a command declared anywhere in the unified catalog", () => {
    const registry = toFieldRegistry(catalog);
    expect(registry.resolveCommand(1, 1)?.valueType).toBe("bool");
  });

  it("returns undefined for a field/command not in any entry", () => {
    const registry = toFieldRegistry(catalog);
    expect(registry.resolveField("unknown", 1, 0)).toBeUndefined();
    expect(registry.resolveCommand(99, 99)).toBeUndefined();
  });
});
