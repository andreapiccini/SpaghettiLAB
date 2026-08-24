import type { CoreBindingId, NodeRedResourceId } from "@spaghettilab/domain";

/**
 * Every endpoint kind an edge in this graph can connect — S111 §
 * Implementazione point 1: `Core record field`, `Core command`, Node-RED
 * processing/integration. Each Core-side endpoint references its Core via
 * `coreBinding` (`@spaghettilab/domain`'s `CoreBindingId`, a project-stable
 * resource id tied to `CoreBindingRecord.expectedDeviceId`) — never a
 * runtime session/connection id, which changes every reconnect
 * (`@spaghettilab/core-session`'s session objects are exactly that kind of
 * ephemeral handle, deliberately not usable here). `sourceKey`/`moduleKey`
 * are the stable `Config`-assigned keys (`@spaghettilab/config-compiler`'s
 * `assignKeys()`), stable for the life of a deployed Config, not a raw
 * runtime pointer either.
 */

export type RecordFieldEndpoint = {
  readonly kind: "record-field";
  readonly coreBinding: CoreBindingId;
  /** The Module/Schedule's stable Config key this record originates from — `spaghetti_record.source_key` on the wire. */
  readonly sourceKey: number;
  readonly schemaId: string;
  readonly schemaVersion: number;
  readonly fieldId: number;
};

export type CommandEndpoint = {
  readonly kind: "command";
  readonly coreBinding: CoreBindingId;
  /** The target Module's stable Config key — `MODULE_COMMAND`'s `key` field on the wire. */
  readonly moduleKey: number;
  readonly commandId: number;
};

export type NodeRedEndpoint = {
  readonly kind: "nodered";
  readonly nodeRedResourceId: NodeRedResourceId;
};

export type SystemAutomationEndpoint = RecordFieldEndpoint | CommandEndpoint | NodeRedEndpoint;

export function isRecordFieldEndpoint(e: SystemAutomationEndpoint): e is RecordFieldEndpoint {
  return e.kind === "record-field";
}

export function isCommandEndpoint(e: SystemAutomationEndpoint): e is CommandEndpoint {
  return e.kind === "command";
}

export function isNodeRedEndpoint(e: SystemAutomationEndpoint): e is NodeRedEndpoint {
  return e.kind === "nodered";
}

/** A stable, order-independent identity string for an endpoint — used to key validity/staleness tracking without re-deriving it ad hoc at every call site. */
export function endpointKey(e: SystemAutomationEndpoint): string {
  if (e.kind === "record-field") return `record-field:${e.coreBinding}:${e.sourceKey}:${e.schemaId}:${e.schemaVersion}:${e.fieldId}`;
  if (e.kind === "command") return `command:${e.coreBinding}:${e.moduleKey}:${e.commandId}`;
  return `nodered:${e.nodeRedResourceId}`;
}
