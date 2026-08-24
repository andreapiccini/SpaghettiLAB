import type { CoreBindingId } from "@spaghettilab/domain";
import type { CommandDescriptor, FieldDescriptor, FieldRegistry } from "./field-registry.js";

/**
 * "Implementa catalogo unificato dei Core disponibili" (S111 §
 * Implementazione point 2) — one entry per `CoreBindingId` known to the
 * project, listing what a link author can pick from. This package does no
 * I/O: an app-layer caller builds each entry from
 * `@spaghettilab/core-session` (reachability), `@spaghettilab/catalog-model`
 * (Module Driver catalog) and a Device Profile/Block-catalog-derived field
 * registry (see `field-registry.ts`'s doc comment on why type/unit data is
 * never wire-derived). `deviceId` is carried only for display/audit — every
 * structural reference in this package still uses `coreBinding`
 * (`CoreBindingId`), never the raw device id string, so nothing here can
 * accidentally key state off it.
 */
export type UnifiedCoreCatalogEntry = {
  readonly coreBinding: CoreBindingId;
  readonly deviceId: string;
  readonly reachable: boolean;
  readonly availableRecordFields: readonly FieldDescriptor[];
  readonly availableCommands: readonly CommandDescriptor[];
};

export type UnifiedCoreCatalog = readonly UnifiedCoreCatalogEntry[];

export function findCoreCatalogEntry(catalog: UnifiedCoreCatalog, coreBinding: CoreBindingId): UnifiedCoreCatalogEntry | undefined {
  return catalog.find((e) => e.coreBinding === coreBinding);
}

/**
 * Builds a `FieldRegistry` from the unified catalog — the bridge into
 * `createSystemAutomationLink()`'s compatibility check, so a caller doesn't
 * have to hand-roll a lookup over the same data twice. Fields/commands are
 * looked up regardless of which `coreBinding` they belong to (a
 * `schemaId`/`schemaVersion`/`fieldId` triple or `moduleKey`/`commandId`
 * pair is only unique *within* one Core, but `RecordFieldEndpoint`/
 * `CommandEndpoint` always carry their own `coreBinding` too, so a caller
 * resolving a specific endpoint already knows which entry to prefer if two
 * Cores happen to reuse the same numbers) — this convenience registry
 * returns the first match across the whole catalog, which is correct for
 * authoring UI purposes (showing what a field/command *is*) but a caller
 * doing per-Core-precise resolution should query `findCoreCatalogEntry()`
 * directly instead.
 */
export function toFieldRegistry(catalog: UnifiedCoreCatalog): FieldRegistry {
  return {
    resolveField(schemaId, schemaVersion, fieldId) {
      for (const entry of catalog) {
        const field = entry.availableRecordFields.find((f) => f.schemaId === schemaId && f.schemaVersion === schemaVersion && f.fieldId === fieldId);
        if (field) return field;
      }
      return undefined;
    },
    resolveCommand(moduleKey, commandId) {
      for (const entry of catalog) {
        const command = entry.availableCommands.find((c) => c.moduleKey === moduleKey && c.commandId === commandId);
        if (command) return command;
      }
      return undefined;
    },
  };
}
