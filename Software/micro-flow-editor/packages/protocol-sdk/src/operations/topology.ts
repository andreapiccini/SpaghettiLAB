import { decodeOne, encodeArray, type CborValue } from "../cbor.js";
import { encodeMap, optionalU32, requireArray, requireMap, requireU32, u32Field } from "../fields.js";

/** `GET_TOPOLOGY` (op 20) request — `cursor` default 0, `limit` default 2. */
export type GetTopologyRequest = { readonly cursor?: number; readonly limit?: number };

export function encodeGetTopologyRequest(r: GetTopologyRequest): Uint8Array {
  const pairs = [];
  if (r.cursor !== undefined) pairs.push(u32Field(0, r.cursor));
  if (r.limit !== undefined) pairs.push(u32Field(1, r.limit));
  return encodeMap(pairs);
}

export function decodeGetTopologyRequest(bytes: Uint8Array): GetTopologyRequest {
  const map = requireMap(decodeOne(bytes), "GetTopologyRequest");
  return { cursor: optionalU32(map, 0, 0, "GetTopologyRequest"), limit: optionalU32(map, 1, 2, "GetTopologyRequest") };
}

export type TopologyRail = {
  readonly id: number;
  /** `spaghetti_power_admission` — distinguishes e.g. `UNVERIFIED` vs `ENFORCED`, kept as a raw number (see the S021 research note on unresolved enum labels). */
  readonly assurance: number;
  readonly maxTotalMicroamps: number;
};

export type TopologyBay = {
  readonly id: number;
  readonly ordinal: number;
  readonly railMask: number;
  /** 0 if no Module is placed in this Bay. */
  readonly moduleKey: number;
  readonly admission: number;
  readonly rails: readonly TopologyRail[];
};

export type TopologyFlow = {
  readonly id: number;
  readonly portId: number;
  readonly direction: number;
  readonly signalCount: number;
  readonly bays: readonly TopologyBay[];
};

export type GetTopologyResponse = {
  readonly flows: readonly TopologyFlow[];
  readonly nextCursor: number;
};

function encodeRail(r: TopologyRail): Uint8Array {
  return encodeMap([u32Field(0, r.id), u32Field(1, r.assurance), u32Field(2, r.maxTotalMicroamps)]);
}

function encodeBay(b: TopologyBay): Uint8Array {
  return encodeMap([
    u32Field(0, b.id),
    u32Field(1, b.ordinal),
    u32Field(2, b.railMask),
    u32Field(3, b.moduleKey),
    u32Field(4, b.admission),
    [5, encodeArray(b.rails.map(encodeRail))],
  ]);
}

function encodeFlow(f: TopologyFlow): Uint8Array {
  return encodeMap([
    u32Field(0, f.id),
    u32Field(1, f.portId),
    u32Field(2, f.direction),
    u32Field(3, f.signalCount),
    [4, encodeArray(f.bays.map(encodeBay))],
  ]);
}

export function encodeGetTopologyResponse(r: GetTopologyResponse): Uint8Array {
  return encodeMap([[0, encodeArray(r.flows.map(encodeFlow))], u32Field(1, r.nextCursor)]);
}

function decodeRail(entry: CborValue): TopologyRail {
  const m = requireMap(entry, "TopologyRail");
  return {
    id: requireU32(m, 0, "TopologyRail"),
    assurance: requireU32(m, 1, "TopologyRail"),
    maxTotalMicroamps: requireU32(m, 2, "TopologyRail"),
  };
}

function decodeBay(entry: CborValue): TopologyBay {
  const m = requireMap(entry, "TopologyBay");
  return {
    id: requireU32(m, 0, "TopologyBay"),
    ordinal: requireU32(m, 1, "TopologyBay"),
    railMask: requireU32(m, 2, "TopologyBay"),
    moduleKey: requireU32(m, 3, "TopologyBay"),
    admission: requireU32(m, 4, "TopologyBay"),
    rails: requireArray(m, 5, "TopologyBay").map(decodeRail),
  };
}

function decodeFlow(entry: CborValue): TopologyFlow {
  const m = requireMap(entry, "TopologyFlow");
  return {
    id: requireU32(m, 0, "TopologyFlow"),
    portId: requireU32(m, 1, "TopologyFlow"),
    direction: requireU32(m, 2, "TopologyFlow"),
    signalCount: requireU32(m, 3, "TopologyFlow"),
    bays: requireArray(m, 4, "TopologyFlow").map(decodeBay),
  };
}

export function decodeGetTopologyResponse(bytes: Uint8Array): GetTopologyResponse {
  const map = requireMap(decodeOne(bytes), "GetTopologyResponse");
  return {
    flows: requireArray(map, 0, "GetTopologyResponse").map(decodeFlow),
    nextCursor: requireU32(map, 1, "GetTopologyResponse"),
  };
}
