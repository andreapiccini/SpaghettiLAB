import { describe, expect, it } from "vitest";
import type { CatalogIndex } from "@spaghettilab/catalog-model";
import { computeRequiredArtifacts, type UsedType } from "../required-artifacts.js";

const installedModuleDrivers: CatalogIndex = { fingerprint: new Uint8Array(0), moduleDrivers: [{ typeId: "driver.ina219", commandCount: 2 }], complete: true };

describe("computeRequiredArtifacts", () => {
  it("omits a module-driver type that GET_CATALOG already reports as installed", () => {
    const used: readonly UsedType[] = [{ typeId: "driver.ina219", kind: "module-driver", usedBy: "module-1" }];
    expect(computeRequiredArtifacts(used, installedModuleDrivers)).toEqual([]);
  });

  it("requires a module-driver type that GET_CATALOG does not report", () => {
    const used: readonly UsedType[] = [{ typeId: "driver.unknown", kind: "module-driver", usedBy: "module-2" }];
    const result = computeRequiredArtifacts(used, installedModuleDrivers);
    expect(result).toEqual([{ typeId: "driver.unknown", kind: "module-driver", requiredBy: ["module-2"] }]);
  });

  it("treats every block/rule usage as required when no installed set is supplied, since the wire cannot enumerate them", () => {
    const used: readonly UsedType[] = [{ typeId: "block.kalman", kind: "block", usedBy: "block-1" }];
    const result = computeRequiredArtifacts(used, installedModuleDrivers);
    expect(result).toEqual([{ typeId: "block.kalman", kind: "block", requiredBy: ["block-1"] }]);
  });

  it("omits a block type present in a caller-supplied installed set", () => {
    const used: readonly UsedType[] = [{ typeId: "block.kalman", kind: "block", usedBy: "block-1" }];
    const result = computeRequiredArtifacts(used, installedModuleDrivers, new Set(["block.kalman"]));
    expect(result).toEqual([]);
  });

  it("merges requiredBy across multiple uses of the same type", () => {
    const used: readonly UsedType[] = [
      { typeId: "block.kalman", kind: "block", usedBy: "block-1" },
      { typeId: "block.kalman", kind: "block", usedBy: "block-2" },
    ];
    const result = computeRequiredArtifacts(used, installedModuleDrivers);
    expect(result).toEqual([{ typeId: "block.kalman", kind: "block", requiredBy: ["block-1", "block-2"] }]);
  });

  describe("S104 — device-profile kind", () => {
    it("requires a profileId@version not present in the caller-supplied installed set", () => {
      const used: readonly UsedType[] = [{ typeId: "ina219-raw@1", kind: "device-profile", usedBy: "module-3" }];
      const result = computeRequiredArtifacts(used, installedModuleDrivers);
      expect(result).toEqual([{ typeId: "ina219-raw@1", kind: "device-profile", requiredBy: ["module-3"] }]);
    });

    it("omits a profileId@version LIST_DEVICE_PROFILES already reports as installed", () => {
      const used: readonly UsedType[] = [{ typeId: "ina219-raw@1", kind: "device-profile", usedBy: "module-3" }];
      const result = computeRequiredArtifacts(used, installedModuleDrivers, undefined, new Set(["ina219-raw@1"]));
      expect(result).toEqual([]);
    });
  });
});
