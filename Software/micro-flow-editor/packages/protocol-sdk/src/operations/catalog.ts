import { decodeOne, encodeArray } from "../cbor.js";
import { bytesField, encodeMap, optionalU32, requireArray, requireBytes, requireMap, requireText, requireU32, textField, u32Field } from "../fields.js";

/** `GET_CATALOG` (op 1) request — both fields optional; the firmware clamps/defaults them itself (`cursor` default 0, `limit` default 8, max 32). */
export type GetCatalogRequest = { readonly cursor?: number; readonly limit?: number };

export function encodeGetCatalogRequest(r: GetCatalogRequest): Uint8Array {
  const pairs = [];
  if (r.cursor !== undefined) pairs.push(u32Field(0, r.cursor));
  if (r.limit !== undefined) pairs.push(u32Field(1, r.limit));
  return encodeMap(pairs);
}

export function decodeGetCatalogRequest(bytes: Uint8Array): GetCatalogRequest {
  const map = requireMap(decodeOne(bytes), "GetCatalogRequest");
  return { cursor: optionalU32(map, 0, 0, "GetCatalogRequest"), limit: optionalU32(map, 1, 8, "GetCatalogRequest") };
}

export type CatalogDriverEntry = { readonly typeId: string; readonly commandCount: number };

export type GetCatalogResponse = {
  readonly protocolVersion: number;
  readonly configVersion: number;
  readonly fingerprint: Uint8Array;
  readonly drivers: readonly CatalogDriverEntry[];
  readonly nextCursor: number;
  readonly driverCount: number;
};

export function encodeGetCatalogResponse(r: GetCatalogResponse): Uint8Array {
  const drivers = r.drivers.map((d) => encodeMap([textField(0, d.typeId), u32Field(1, d.commandCount)]));
  return encodeMap([
    u32Field(0, r.protocolVersion),
    u32Field(1, r.configVersion),
    bytesField(2, r.fingerprint),
    [3, encodeArray(drivers)],
    u32Field(4, r.nextCursor),
    u32Field(5, r.driverCount),
  ]);
}

export function decodeGetCatalogResponse(bytes: Uint8Array): GetCatalogResponse {
  const map = requireMap(decodeOne(bytes), "GetCatalogResponse");
  const drivers = requireArray(map, 3, "GetCatalogResponse").map((entry) => {
    const m = requireMap(entry, "GetCatalogResponse.drivers[]");
    return { typeId: requireText(m, 0, "CatalogDriverEntry"), commandCount: requireU32(m, 1, "CatalogDriverEntry") };
  });
  return {
    protocolVersion: requireU32(map, 0, "GetCatalogResponse"),
    configVersion: requireU32(map, 1, "GetCatalogResponse"),
    fingerprint: requireBytes(map, 2, "GetCatalogResponse"),
    drivers,
    nextCursor: requireU32(map, 4, "GetCatalogResponse"),
    driverCount: requireU32(map, 5, "GetCatalogResponse"),
  };
}
