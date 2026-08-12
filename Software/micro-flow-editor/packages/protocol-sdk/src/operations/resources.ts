import { decodeOne } from "../cbor.js";
import { bytesField, decodeEmptyPayload, encodeEmptyPayload, encodeMap, requireBytes, requireMap, requireMapField, requireU32, u32Field, type FieldMap } from "../fields.js";

/** `GET_RESOURCES` (op 21) has an empty request payload. */
export const encodeGetResourcesRequest = encodeEmptyPayload;
export function decodeGetResourcesRequest(bytes: Uint8Array): void {
  decodeEmptyPayload(bytes, "GetResourcesRequest");
}

/** `capacity`/`used`/`peak` — one distinct pool per resource kind, never summed (see `UX-S090` § Resource monitor). */
export type ResourcePool = { readonly capacity: number; readonly used: number; readonly peak: number };

function encodePool(p: ResourcePool): Uint8Array {
  return encodeMap([u32Field(0, p.capacity), u32Field(1, p.used), u32Field(2, p.peak)]);
}

function decodePool(map: FieldMap, key: number, context: string): ResourcePool {
  const inner = requireMapField(map, key, context);
  return {
    capacity: requireU32(inner, 0, `${context}.pool`),
    used: requireU32(inner, 1, `${context}.pool`),
    peak: requireU32(inner, 2, `${context}.pool`),
  };
}

/** `GET_RESOURCES` (op 21) response — `resources_ops.c`. */
export type GetResourcesResponse = {
  readonly featureSetHash: Uint8Array;
  readonly modules: ResourcePool;
  readonly rules: ResourcePool;
  readonly blocks: ResourcePool;
  readonly profiles: ResourcePool;
  readonly records: ResourcePool;
  readonly workspace: ResourcePool;
  readonly allocationFailures: number;
};

export function encodeGetResourcesResponse(r: GetResourcesResponse): Uint8Array {
  return encodeMap([
    bytesField(0, r.featureSetHash),
    [1, encodePool(r.modules)],
    [2, encodePool(r.rules)],
    [3, encodePool(r.blocks)],
    [4, encodePool(r.profiles)],
    [5, encodePool(r.records)],
    [6, encodePool(r.workspace)],
    u32Field(7, r.allocationFailures),
  ]);
}

export function decodeGetResourcesResponse(bytes: Uint8Array): GetResourcesResponse {
  const map = requireMap(decodeOne(bytes), "GetResourcesResponse");
  return {
    featureSetHash: requireBytes(map, 0, "GetResourcesResponse"),
    modules: decodePool(map, 1, "GetResourcesResponse.modules"),
    rules: decodePool(map, 2, "GetResourcesResponse.rules"),
    blocks: decodePool(map, 3, "GetResourcesResponse.blocks"),
    profiles: decodePool(map, 4, "GetResourcesResponse.profiles"),
    records: decodePool(map, 5, "GetResourcesResponse.records"),
    workspace: decodePool(map, 6, "GetResourcesResponse.workspace"),
    allocationFailures: requireU32(map, 7, "GetResourcesResponse"),
  };
}
