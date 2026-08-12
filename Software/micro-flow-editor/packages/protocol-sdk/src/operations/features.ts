import { decodeOne, encodeArray } from "../cbor.js";
import { bytesField, decodeEmptyPayload, encodeEmptyPayload, encodeMap, requireArray, requireBytes, requireMap, requireText, requireU32, textField, u32Field } from "../fields.js";

/** `GET_FEATURES` (op 27) has an empty request payload. */
export const encodeGetFeaturesRequest = encodeEmptyPayload;
export function decodeGetFeaturesRequest(bytes: Uint8Array): void {
  decodeEmptyPayload(bytes, "GetFeaturesRequest");
}

/** `GET_FEATURES` (op 27) response — `features_ops.c`. Request payload is empty. */
export type FeaturePack = {
  readonly id: string;
  readonly version: string;
  readonly requiredHwCaps: number;
  readonly moduleTypeCount: number;
};

export type GetFeaturesResponse = {
  readonly featureSetHash: Uint8Array;
  readonly packs: readonly FeaturePack[];
};

export function encodeGetFeaturesResponse(r: GetFeaturesResponse): Uint8Array {
  const packs = r.packs.map((p) =>
    encodeMap([textField(0, p.id), textField(1, p.version), u32Field(2, p.requiredHwCaps), u32Field(3, p.moduleTypeCount)]),
  );
  return encodeMap([bytesField(0, r.featureSetHash), [1, encodeArray(packs)]]);
}

export function decodeGetFeaturesResponse(bytes: Uint8Array): GetFeaturesResponse {
  const map = requireMap(decodeOne(bytes), "GetFeaturesResponse");
  const packs = requireArray(map, 1, "GetFeaturesResponse").map((entry) => {
    const m = requireMap(entry, "GetFeaturesResponse.packs[]");
    return {
      id: requireText(m, 0, "FeaturePack"),
      version: requireText(m, 1, "FeaturePack"),
      requiredHwCaps: requireU32(m, 2, "FeaturePack"),
      moduleTypeCount: requireU32(m, 3, "FeaturePack"),
    };
  });
  return { featureSetHash: requireBytes(map, 0, "GetFeaturesResponse"), packs };
}
