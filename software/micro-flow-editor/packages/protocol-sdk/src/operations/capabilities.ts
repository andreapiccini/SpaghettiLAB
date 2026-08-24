import { decodeOne } from "../cbor.js";
import { decodeEmptyPayload, encodeEmptyPayload, encodeMap, requireMap, requireText, requireU32, textField, u32Field } from "../fields.js";

/** `GET_CAPABILITIES` (op 9) has an empty request payload. */
export const encodeGetCapabilitiesRequest = encodeEmptyPayload;
export function decodeGetCapabilitiesRequest(bytes: Uint8Array): void {
  decodeEmptyPayload(bytes, "GetCapabilitiesRequest");
}

/** `GET_CAPABILITIES` (op 9) response — `capabilities_ops.c`. Request payload is empty. */
export type GetCapabilitiesResponse = {
  readonly resourceProfile: number;
  readonly buildCapabilities: number;
  readonly coreVariant: string;
  readonly maxProtocolPayload: number;
  readonly maxInflightRequests: number;
  readonly replayWindowMs: number;
  readonly maxModules: number;
  readonly maxPrincipals: number;
};

export function encodeGetCapabilitiesResponse(r: GetCapabilitiesResponse): Uint8Array {
  return encodeMap([
    u32Field(0, r.resourceProfile),
    u32Field(1, r.buildCapabilities),
    textField(2, r.coreVariant),
    u32Field(3, r.maxProtocolPayload),
    u32Field(4, r.maxInflightRequests),
    u32Field(5, r.replayWindowMs),
    u32Field(6, r.maxModules),
    u32Field(7, r.maxPrincipals),
  ]);
}

export function decodeGetCapabilitiesResponse(bytes: Uint8Array): GetCapabilitiesResponse {
  const map = requireMap(decodeOne(bytes), "GetCapabilitiesResponse");
  return {
    resourceProfile: requireU32(map, 0, "GetCapabilitiesResponse"),
    buildCapabilities: requireU32(map, 1, "GetCapabilitiesResponse"),
    coreVariant: requireText(map, 2, "GetCapabilitiesResponse"),
    maxProtocolPayload: requireU32(map, 3, "GetCapabilitiesResponse"),
    maxInflightRequests: requireU32(map, 4, "GetCapabilitiesResponse"),
    replayWindowMs: requireU32(map, 5, "GetCapabilitiesResponse"),
    maxModules: requireU32(map, 6, "GetCapabilitiesResponse"),
    maxPrincipals: requireU32(map, 7, "GetCapabilitiesResponse"),
  };
}
