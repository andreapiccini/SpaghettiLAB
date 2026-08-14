/**
 * Authoring catalog for the Device Processing Graph. `GET_CATALOG` still only
 * lists Module Drivers, so this package is the host-side source of Block/Rule/
 * schedule/event operations until the wire grows those descriptors. Firmware
 * `type_id` values remain the runtime authority: a shipped entry's `typeId` must
 * match a `SPAGHETTI_BLOCK_DRIVER_DEFINE` / rule driver, never an invented UI name.
 *
 * AppBlocks Library blocks that have a SpaghettiLAB analog are mapped here
 * (Features tab is a later dump). Vendor-only hardware and unbounded loops are
 * omitted, not faked as Core drivers.
 */

export type ProcessingCatalogCategoryId =
  | "system"
  | "trigger"
  | "variables"
  | "logic"
  | "math"
  | "filter"
  | "time"
  | "io"
  | "strings"
  | "display"
  | "sound"
  | "storage"
  | "serial"
  | "network"
  | "cloud"
  | "modbus";

export type ProcessingRuntime =
  | "core-block"
  | "core-rule"
  | "core-schedule"
  | "core-event"
  | "core-admin"
  | "authoring"
  | "node-red"
  | "feature"
  | "out-of-scope";

export type ProcessingAvailability = "shipped" | "pack" | "planned" | "unavailable";

export type ProcessingNodeKind = "schedule" | "event-source" | "block" | "rule";

export type ProcessingCatalogEntry = {
  readonly id: string;
  readonly label: string;
  readonly subtitle: string;
  readonly category: ProcessingCatalogCategoryId;
  readonly runtime: ProcessingRuntime;
  readonly availability: ProcessingAvailability;
  readonly nodeKind?: ProcessingNodeKind;
  /** AppBlocks `data-testid="li-node_<id>-blocklist"` id, when this row maps one. */
  readonly appblocksId?: string;
  /** Firmware `spaghetti_block_config.type_id` or `spaghetti_rule_config.type_id`. */
  readonly typeId?: string;
  readonly packId?: string;
  readonly notes: string;
};

export type ProcessingCatalogCategory = {
  readonly id: ProcessingCatalogCategoryId;
  readonly label: string;
  readonly color: string;
};
