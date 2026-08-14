import type { CommandEndpoint, NodeRedEndpoint, RecordFieldEndpoint } from "@spaghettilab/system-automation-graph";

/**
 * `@spaghettilab/system-automation-graph`'s `SystemAutomationEndpoint` only
 * carries wire identity (Core binding + stable key/schema/field or module
 * key/command id) — never a display label or a type/unit, since neither is
 * observable on the wire (`field-registry.ts`'s own doc comment: "never
 * observed on the Protocol V1 wire ... always caller-supplied"). This file
 * extends each endpoint kind with exactly those two authored-only fields,
 * the same "manual entry, no catalog to pick from" pattern already used for
 * Runtime & Diagnostics' Comandi tab (no command catalog exists either).
 */
export type CrossCoreNodeData =
  | (RecordFieldEndpoint & { readonly label: string; readonly valueType: string; readonly unit?: string })
  | (CommandEndpoint & { readonly label: string; readonly valueType?: string; readonly unit?: string })
  | (NodeRedEndpoint & { readonly label: string });
