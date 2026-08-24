import type { FeaturePack, GetFeaturesResponse } from "@spaghettilab/protocol-sdk";

export type CapabilityPackIndex = {
  readonly featureSetHash: Uint8Array;
  /** Sorted by `id`, order-independent of how `packs` arrived on the wire. */
  readonly packs: readonly FeaturePack[];
};

/** `GET_FEATURES` (S021) has no pagination — a single response is always a complete read. */
export function normalizeCapabilityPacks(response: GetFeaturesResponse): CapabilityPackIndex {
  const packs = [...response.packs].sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  return { featureSetHash: response.featureSetHash, packs };
}
