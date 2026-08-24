/**
 * Mirrors `struct spaghetti_device_profile_field` (`device_profile.h`).
 * "MVP supports INT64 and UINT64 only" — this package does not offer a
 * `bool`/`text`/`bytes` sample field type, because the firmware struct
 * itself doesn't yet. There is no separate fixed-point scale/exponent field
 * on the wire struct either: a fixed-point reading is produced by the
 * instruction sequence itself (e.g. `SHIFT`/`MASK` before `EMIT_FIELD`), not
 * declared as field metadata — this package does not invent one.
 */
export type SampleFieldType = "int64" | "uint64";

/** `SPAGHETTI_FIELD_NAME_SIZE` (24) includes the terminating NUL — 23 usable bytes. */
export const FIELD_NAME_MAX_LENGTH = 23;
/** `SPAGHETTI_UNIT_NAME_SIZE` (16) includes the terminating NUL — 15 usable bytes. */
export const UNIT_NAME_MAX_LENGTH = 15;

export type SampleField = {
  /** Stable nonzero schema field identifier — 0 is not a valid `fieldId`. */
  readonly fieldId: number;
  readonly type: SampleFieldType;
  readonly name: string;
  readonly unit?: string;
};
