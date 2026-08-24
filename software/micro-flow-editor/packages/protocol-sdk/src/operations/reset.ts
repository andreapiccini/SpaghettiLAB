import { decodeOne } from "../cbor.js";
import { decodeEmptyPayload, encodeEmptyPayload, encodeMap, requireMap, requireU32, u32Field } from "../fields.js";

/** `FACTORY_RESET` (op 15) request; response payload is an empty map. */
export type FactoryResetRequest = { readonly scope: number };

export function encodeFactoryResetRequest(r: FactoryResetRequest): Uint8Array {
  return encodeMap([u32Field(0, r.scope)]);
}

export function decodeFactoryResetRequest(bytes: Uint8Array): FactoryResetRequest {
  const map = requireMap(decodeOne(bytes), "FactoryResetRequest");
  return { scope: requireU32(map, 0, "FactoryResetRequest") };
}

export const encodeFactoryResetResponse = encodeEmptyPayload;
export function decodeFactoryResetResponse(bytes: Uint8Array): void {
  decodeEmptyPayload(bytes, "FactoryResetResponse");
}
