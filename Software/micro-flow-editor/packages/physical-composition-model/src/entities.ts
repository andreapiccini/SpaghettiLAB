/**
 * Node payloads for the `"physical-composition"` `GraphState` (S013/S014).
 * Cabling between entities is expressed with the graph's own edges, not a
 * back-reference field here — an edge already is the relationship, and a
 * duplicated `xId` field on both ends could only ever drift out of sync with
 * it. Bay/Port/Rail are never authoring nodes: they are numeric IDs the Core
 * itself declared (`@spaghettilab/catalog-model`'s `TopologyIndex`), referenced
 * directly by a `ModuleNodeData`, never re-declared as separate entities here
 * (S050 point 2: "costruisci la composizione soltanto dalle Flow/Bay/rail
 * dichiarate dal Core").
 *
 * None of these types carry a label or grouping field — per S050 point 1
 * ("associa label e grouping senza alterare identità firmware") those live in
 * `AuthoringMetadata.comment`/`AuthoringMetadata.groupId`
 * (`@spaghettilab/domain`), which `canonicalProjectHash` already excludes, so
 * relabeling or regrouping structurally cannot change a Config hash.
 */

/**
 * How a Backbone is built — an open, cataloguable property, never a hardcoded
 * electrical assumption (S050 point 2: "gestisci backbone compatte, DIN o
 * future varianti come metadata/proprietà catalogate"). `properties` is the
 * escape hatch for whatever a future variant needs that isn't `variant`
 * itself.
 */
export type BackboneNodeData = {
  readonly kind: "backbone";
  readonly variant: string;
  readonly properties?: Readonly<Record<string, unknown>>;
};

/**
 * `passive` mirrors a rail's `RailAssurance.UNMANAGED` state at the authoring
 * entity representing the physical power source itself — a Power node can be
 * declared passive even before any Module is placed on one of its rails.
 */
export type PowerSourceNodeData = {
  readonly kind: "power-source";
  readonly passive: boolean;
};

/**
 * A Connector is deliberately its own node, distinct from a Bay (S050 point
 * 5): swapping a connector's pinout or the external device wired to it must
 * never implicitly change a Module's `electricalMode` — that field lives only
 * on `ModuleNodeData` and nothing here can reach it.
 */
export type ConnectorNodeData = {
  readonly kind: "connector";
  readonly pinout?: string;
  /** Which wire-declared Bay this connector is physically seated in, if placed yet. */
  readonly bayId?: number;
};

export type ExternalDeviceNodeData = {
  readonly kind: "external-device";
  readonly description?: string;
};

/** Whether a Module only reads, only writes, or does both — a real composition can be any of the three (S050 point 6). */
export type ElectricalMode = "input-only" | "output-only" | "input-output";

/**
 * Instance bus binding — mutually exclusive in practice, all optional here.
 * `address` is I2C (`i2c_address`), `chipSelect` is SPI (`spi_cs`), `w1Rom` is
 * the 8-byte 1-Wire ROM (`w1_rom`) as 16 lowercase hex chars (see `parseW1RomHex`).
 * Transport is not on the generic Module Driver wire — see `validate-composition.ts`.
 */
export type ModuleEndpoint = {
  readonly address?: number;
  readonly chipSelect?: number;
  /** Canonical 16-char lowercase hex (`SPAGHETTI_ENDPOINT_VALUE_MAX` = 8). */
  readonly w1Rom?: string;
};

/**
 * `moduleKey` is the firmware-assigned stable key (S050 point 3: "Module key
 * stabile") — `undefined` until one is assigned, e.g. via
 * `moduleFromDiscoveryAcceptance` (`discovery.ts`). `portId`/`bayId`/`railId`
 * are the exact numeric IDs the Core declared in its `TopologyIndex`, never an
 * authoring-side copy. `properties` is schema-driven per `driverTypeId` (S042
 * `FormModel`/`buildFormModel`), validated by that package, not this one.
 */
export type ModuleNodeData = {
  readonly kind: "module";
  readonly moduleKey?: number;
  readonly driverTypeId: string;
  readonly profileId?: string;
  readonly portId: number;
  readonly bayId: number;
  readonly railId: number;
  readonly endpoint?: ModuleEndpoint;
  readonly electricalMode: ElectricalMode;
  readonly properties: Readonly<Record<string, unknown>>;
};

export type PhysicalCompositionNodeData =
  | BackboneNodeData
  | PowerSourceNodeData
  | ConnectorNodeData
  | ExternalDeviceNodeData
  | ModuleNodeData;

export function isModuleNodeData(data: PhysicalCompositionNodeData): data is ModuleNodeData {
  return data.kind === "module";
}
