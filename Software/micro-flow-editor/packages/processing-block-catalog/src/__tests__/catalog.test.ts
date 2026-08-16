import { describe, expect, it } from "vitest";
import { PROCESSING_CATALOG_CATEGORIES } from "../categories.js";
import { PROCESSING_BLOCK_CATALOG } from "../entries.js";
import {
  findCatalogEntryByAppblocksId,
  groupCatalogByCategory,
  isPlaceableOnDeviceGraph,
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

  it("places included AppBlocks on the Core graph with named fields", () => {
    const included = [
      "system",
      "network_changed",
      "interrupt",
      "debug",
      "datetime",
      "datetime_format",
      "label",
      "system_reboot",
      "upgrade_firmware",
      "digital_line_set",
      "variable_changed",
      "variable_set",
      "command_triggered",
      "bitwise",
      "arithmetic",
      "comparison",
      "compound_condition",
      "math_compound",
      "forloop",
      "command_trigger",
      "timer_completed",
      "time_interval",
      "cron_event",
      "timer_start",
      "timer_stop",
      "time_delay",
      "table_insert",
      "table",
      "table_update",
      "log_add",
      "settings_init",
      "http_server_endpoint",
      "ser_data_arrival",
      "socket_data_arrival",
      "socket_event",
      "sms_recv",
      "ser_data_send",
      "sms_send",
      "socket_connect",
      "socket",
      "mqtt_sub",
      "mqtt_change",
      "http",
      "mqtt_pub",
      "lcd_text_widget",
      "lcd_image_widget",
      "lcd_menu",
      "lcd_set_screen",
    ] as const;
    for (const id of included) {
      const entry = findCatalogEntryByAppblocksId(id);
      expect(entry, id).toBeDefined();
      expect(isPlaceableOnDeviceGraph(entry!), id).toBe(true);
    }
    expect(findCatalogEntryByAppblocksId("system")!.fields).toBeUndefined();
    expect(findCatalogEntryByAppblocksId("debug")!.fields?.some((f) => f.id === "message")).toBe(true);
    expect(findCatalogEntryByAppblocksId("time_interval")!.nodeKind).toBe("event-source");
    expect(findCatalogEntryByAppblocksId("comparison")!.typeId).toBe("threshold");
    expect(findCatalogEntryByAppblocksId("table")!.typeId).toBe("lookup_table");
    expect(findCatalogEntryByAppblocksId("mqtt_pub")!.typeId).toBe("publish_field");
  });

  it("hides the excluded AppBlocks from the Core graph", () => {
    for (const id of ["keypad", "keypad_released", "pat", "beep", "modbus_slave_register", "modbus_response", "modbus_timeout", "modbus_write"] as const) {
      const entry = findCatalogEntryByAppblocksId(id);
      expect(entry, id).toBeDefined();
      expect(isPlaceableOnDeviceGraph(entry!), id).toBe(false);
    }
  });

  it("keeps remaining host automations off the Core graph", () => {
    expect(isPlaceableOnDeviceGraph(findCatalogEntryByAppblocksId("http_server_response")!)).toBe(false);
    expect(systemAutomationCatalogEntries().every((e) => e.runtime === "node-red")).toBe(true);
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
