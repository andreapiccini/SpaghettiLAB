import { describe, expect, it } from "vitest";
import { PROCESSING_CATALOG_CATEGORIES } from "../categories.js";
import { PROCESSING_BLOCK_CATALOG } from "../entries.js";
import {
  findCatalogEntryByAppblocksId,
  groupCatalogByCategory,
  isPlaceableOnDeviceGraph,
  isPlaceableOnSystemAutomationGraph,
  searchCatalog,
  shippedTypeIds,
  systemAutomationCatalogEntries,
} from "../query.js";

const OMITTED_VENDOR_IDS = [
  "azure_command",
  "azure_telemetry",
  "cgg_telemetry",
  "luis",
  "tibbit_26_end",
  "tibbit_26_send",
  "tibbit_26_start",
  "wiegand",
] as const;

const FIRMWARE_BLOCK_TYPE_IDS = [
  "lookup_table",
  "polynomial",
  "unit_convert",
  "publish_field",
  "scale_offset",
  "clamp",
  "map_range",
  "add",
  "subtract",
  "multiply",
  "divide",
  "threshold",
  "hysteresis",
  "debounce",
  "kalman",
  "moving_average",
  "low_pass",
  "median",
  "mask_shift",
  "combine_fields",
  "select",
] as const;

describe("processing-block-catalog", () => {
  it("has unique catalog ids", () => {
    const ids = PROCESSING_BLOCK_CATALOG.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("keeps AppBlocks ids unique when present, and omits vendor-only ones", () => {
    const mapped = PROCESSING_BLOCK_CATALOG.map((e) => e.appblocksId).filter((id): id is string => id !== undefined);
    expect(new Set(mapped).size).toBe(mapped.length);
    for (const id of OMITTED_VENDOR_IDS) {
      expect(mapped.includes(id), id).toBe(false);
      expect(findCatalogEntryByAppblocksId(id)).toBeUndefined();
    }
  });

  it("covers every shipped firmware Block/Rule type_id", () => {
    const typeIds = new Set(PROCESSING_BLOCK_CATALOG.map((e) => e.typeId).filter((id): id is string => id !== undefined));
    for (const typeId of FIRMWARE_BLOCK_TYPE_IDS) {
      expect(typeIds.has(typeId), typeId).toBe(true);
    }
    expect(shippedTypeIds().has("threshold")).toBe(true);
    expect(shippedTypeIds().has("kalman")).toBe(true);
  });

  it("requires type_id on placeable Block/Rule entries", () => {
    for (const entry of PROCESSING_BLOCK_CATALOG) {
      if (!isPlaceableOnDeviceGraph(entry)) continue;
      if (entry.nodeKind === "block" || entry.nodeKind === "rule") {
        expect(entry.typeId, entry.id).toBeTruthy();
      }
    }
  });

  it("keeps host automations off the Core graph and on the System Automation Graph", () => {
    expect(isPlaceableOnDeviceGraph(findCatalogEntryByAppblocksId("forloop")!)).toBe(false);
    expect(isPlaceableOnDeviceGraph(findCatalogEntryByAppblocksId("lcd_set_screen")!)).toBe(false);
    expect(isPlaceableOnDeviceGraph(findCatalogEntryByAppblocksId("sms_send")!)).toBe(false);
    expect(isPlaceableOnDeviceGraph(findCatalogEntryByAppblocksId("http")!)).toBe(false);
    expect(isPlaceableOnSystemAutomationGraph(findCatalogEntryByAppblocksId("http")!)).toBe(true);
    expect(systemAutomationCatalogEntries().every((e) => e.runtime === "node-red")).toBe(true);
    expect(systemAutomationCatalogEntries().length).toBeGreaterThan(0);
  });

  it("places Core analogs for IF, schedule, lookup and publish", () => {
    expect(isPlaceableOnDeviceGraph(findCatalogEntryByAppblocksId("comparison")!)).toBe(true);
    expect(findCatalogEntryByAppblocksId("comparison")!.typeId).toBe("threshold");
    expect(findCatalogEntryByAppblocksId("time_interval")!.nodeKind).toBe("schedule");
    expect(findCatalogEntryByAppblocksId("table")!.typeId).toBe("lookup_table");
    expect(findCatalogEntryByAppblocksId("mqtt_pub")!.typeId).toBe("publish_field");
  });

  it("keeps Features-tab items unavailable until that dump arrives", () => {
    expect(findCatalogEntryByAppblocksId("debug")!.runtime).toBe("feature");
    expect(findCatalogEntryByAppblocksId("variable_set")!.runtime).toBe("feature");
    expect(isPlaceableOnDeviceGraph(findCatalogEntryByAppblocksId("debug")!)).toBe(false);
  });

  it("groups by the declared category order and search is case-insensitive", () => {
    const groups = groupCatalogByCategory();
    expect(groups.map((g) => g.category.id)).toEqual(
      PROCESSING_CATALOG_CATEGORIES.filter((c) => PROCESSING_BLOCK_CATALOG.some((e) => e.category === c.id)).map((c) => c.id),
    );
    expect(searchCatalog("KALMAN").some((e) => e.typeId === "kalman")).toBe(true);
    expect(searchCatalog("node_mqtt_pub").length).toBe(0);
    expect(searchCatalog("mqtt_pub").some((e) => e.appblocksId === "mqtt_pub")).toBe(true);
  });
});
