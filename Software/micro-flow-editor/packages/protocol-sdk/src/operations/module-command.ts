import { decodeOne } from "../cbor.js";
import { decodeEmptyPayload, encodeEmptyPayload, encodeMap, requireMap, requireU32, u32Field } from "../fields.js";

/**
 * `MODULE_COMMAND` (op 7) request — `module_command.c`. The task doc this
 * codec is built from describes "stable target key, command ID e property
 * arguments," but the firmware handler as implemented only decodes `key`
 * and `commandId` — no argument field exists on the wire yet (see the S021
 * research note's incompleteness list). This type intentionally has no
 * `arguments` field: adding one here would silently desync from what the
 * firmware actually reads.
 */
export type ModuleCommandRequest = { readonly key: number; readonly commandId: number };

export function encodeModuleCommandRequest(r: ModuleCommandRequest): Uint8Array {
  return encodeMap([u32Field(0, r.key), u32Field(1, r.commandId)]);
}

export function decodeModuleCommandRequest(bytes: Uint8Array): ModuleCommandRequest {
  const map = requireMap(decodeOne(bytes), "ModuleCommandRequest");
  return { key: requireU32(map, 0, "ModuleCommandRequest"), commandId: requireU32(map, 1, "ModuleCommandRequest") };
}

/** Response payload is an empty map — success is carried entirely by the envelope status. */
export const encodeModuleCommandResponse = encodeEmptyPayload;
export function decodeModuleCommandResponse(bytes: Uint8Array): void {
  decodeEmptyPayload(bytes, "ModuleCommandResponse");
}
