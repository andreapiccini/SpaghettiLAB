export const CapabilityMarketplaceErrorCode = {
  IMPORT_TOO_LARGE: "capability-marketplace.import_too_large",
  MALFORMED_JSON: "capability-marketplace.malformed_json",
  INVALID_SHAPE: "capability-marketplace.invalid_shape",
  DUPLICATE_PACK_ID: "capability-marketplace.duplicate_pack_id",
  /** Not a parse failure — an entry whose `kind` isn't a registered `ArtifactKind` (S104). It's skipped, never fatal to the rest of the catalog. */
  UNKNOWN_KIND: "capability-marketplace.unknown_kind",
} as const;
