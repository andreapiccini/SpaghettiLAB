import { decodeOne, encodeArray } from "../cbor.js";
import { encodeMap, optionalU32, requireArray, requireMap, requireText, requireU32, textField, u32Field } from "../fields.js";

export { encodeJobIdResponse as encodeScanDiscoveryResponse, decodeJobIdResponse as decodeScanDiscoveryResponse, type JobIdResponse as ScanDiscoveryResponse } from "../fields.js";

/** `LIST_DISCOVERY` (op 4) request — `cursor` default 0, `limit` default 4. */
export type ListDiscoveryRequest = { readonly cursor?: number; readonly limit?: number };

export function encodeListDiscoveryRequest(r: ListDiscoveryRequest): Uint8Array {
  const pairs = [];
  if (r.cursor !== undefined) pairs.push(u32Field(0, r.cursor));
  if (r.limit !== undefined) pairs.push(u32Field(1, r.limit));
  return encodeMap(pairs);
}

export function decodeListDiscoveryRequest(bytes: Uint8Array): ListDiscoveryRequest {
  const map = requireMap(decodeOne(bytes), "ListDiscoveryRequest");
  return { cursor: optionalU32(map, 0, 0, "ListDiscoveryRequest"), limit: optionalU32(map, 1, 4, "ListDiscoveryRequest") };
}

export type DiscoveryCandidate = {
  readonly id: number;
  readonly portId: number;
  readonly generation: number;
  readonly confidence: number;
  readonly suggestedTypeId: string;
};

export type ListDiscoveryResponse = {
  readonly candidates: readonly DiscoveryCandidate[];
  readonly nextCursor: number;
};

export function encodeListDiscoveryResponse(r: ListDiscoveryResponse): Uint8Array {
  const candidates = r.candidates.map((c) =>
    encodeMap([
      u32Field(0, c.id),
      u32Field(1, c.portId),
      u32Field(2, c.generation),
      u32Field(3, c.confidence),
      textField(4, c.suggestedTypeId),
    ]),
  );
  return encodeMap([[0, encodeArray(candidates)], u32Field(1, r.nextCursor)]);
}

export function decodeListDiscoveryResponse(bytes: Uint8Array): ListDiscoveryResponse {
  const map = requireMap(decodeOne(bytes), "ListDiscoveryResponse");
  const candidates = requireArray(map, 0, "ListDiscoveryResponse").map((entry) => {
    const m = requireMap(entry, "ListDiscoveryResponse.candidates[]");
    return {
      id: requireU32(m, 0, "DiscoveryCandidate"),
      portId: requireU32(m, 1, "DiscoveryCandidate"),
      generation: requireU32(m, 2, "DiscoveryCandidate"),
      confidence: requireU32(m, 3, "DiscoveryCandidate"),
      suggestedTypeId: requireText(m, 4, "DiscoveryCandidate"),
    };
  });
  return { candidates, nextCursor: requireU32(map, 1, "ListDiscoveryResponse") };
}

/** `SCAN_DISCOVERY` (op 5) request — async job, response is the shared `{0: job_id}` shape (re-exported above). */
export type ScanDiscoveryRequest = { readonly portId: number; readonly allowStateChanging?: boolean };

export function encodeScanDiscoveryRequest(r: ScanDiscoveryRequest): Uint8Array {
  const pairs = [u32Field(0, r.portId)];
  if (r.allowStateChanging !== undefined) pairs.push(u32Field(1, r.allowStateChanging ? 1 : 0));
  return encodeMap(pairs);
}

export function decodeScanDiscoveryRequest(bytes: Uint8Array): ScanDiscoveryRequest {
  const map = requireMap(decodeOne(bytes), "ScanDiscoveryRequest");
  return {
    portId: requireU32(map, 0, "ScanDiscoveryRequest"),
    allowStateChanging: optionalU32(map, 1, 0, "ScanDiscoveryRequest") !== 0,
  };
}

/** `ACCEPT_DISCOVERY` (op 6) request/response. */
export type AcceptDiscoveryRequest = {
  readonly candidateId: number;
  readonly key: number;
  readonly generation: number;
};

export function encodeAcceptDiscoveryRequest(r: AcceptDiscoveryRequest): Uint8Array {
  return encodeMap([u32Field(0, r.candidateId), u32Field(1, r.key), u32Field(2, r.generation)]);
}

export function decodeAcceptDiscoveryRequest(bytes: Uint8Array): AcceptDiscoveryRequest {
  const map = requireMap(decodeOne(bytes), "AcceptDiscoveryRequest");
  return {
    candidateId: requireU32(map, 0, "AcceptDiscoveryRequest"),
    key: requireU32(map, 1, "AcceptDiscoveryRequest"),
    generation: requireU32(map, 2, "AcceptDiscoveryRequest"),
  };
}

export type AcceptDiscoveryResponse = { readonly generation: number; readonly moduleKey: number };

export function encodeAcceptDiscoveryResponse(r: AcceptDiscoveryResponse): Uint8Array {
  return encodeMap([u32Field(0, r.generation), u32Field(1, r.moduleKey)]);
}

export function decodeAcceptDiscoveryResponse(bytes: Uint8Array): AcceptDiscoveryResponse {
  const map = requireMap(decodeOne(bytes), "AcceptDiscoveryResponse");
  return { generation: requireU32(map, 0, "AcceptDiscoveryResponse"), moduleKey: requireU32(map, 1, "AcceptDiscoveryResponse") };
}
