import { describe, expect, it } from "vitest";
import type { CatalogIndex, ProfileIndex } from "@spaghettilab/catalog-model";
import { buildEditorModel } from "../editor-model.js";

function catalog(typeIds: readonly string[]): CatalogIndex {
  return {
    fingerprint: new Uint8Array(4),
    moduleDrivers: typeIds.map((typeId) => ({ typeId, commandCount: 1 })),
    complete: true,
  };
}

function profiles(entries: readonly { profileId: string; version: number }[]): ProfileIndex {
  return {
    profiles: entries.map((e) => ({ ...e, hash: new Uint8Array(4) })),
    complete: true,
  };
}

describe("buildEditorModel", () => {
  it("derives one node type per Module Driver and Device Profile, sorted by typeId", () => {
    const model = buildEditorModel(catalog(["relay", "ina219"]), profiles([{ profileId: "bme280", version: 1 }]));
    expect(model.nodeTypes.map((n) => n.typeId)).toEqual(["bme280", "ina219", "relay"]);
  });

  it("tags the source of each node type correctly", () => {
    const model = buildEditorModel(catalog(["relay"]), profiles([{ profileId: "bme280", version: 1 }]));
    expect(model.nodeTypes.find((n) => n.typeId === "relay")?.source).toBe("module-driver");
    expect(model.nodeTypes.find((n) => n.typeId === "bme280")?.source).toBe("device-profile");
  });

  it("is independent of the order the underlying indices were built in", () => {
    const a = buildEditorModel(catalog(["relay", "ina219"]), profiles([]));
    const b = buildEditorModel(catalog(["ina219", "relay"]), profiles([]));
    expect(a).toEqual(b);
  });

  it("produces empty handles/propertySchema for every node type today (no wire data to populate them from)", () => {
    const model = buildEditorModel(catalog(["relay"]), profiles([]));
    expect(model.nodeTypes[0]!.handles).toEqual([]);
    expect(model.nodeTypes[0]!.propertySchema).toEqual([]);
  });
});
