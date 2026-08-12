import { ProtocolCodecError } from "./cbor.js";

/**
 * Lossless JSON representation for the protocol's 64-bit fields (`boot_id`,
 * `uptime_ms`, `lease_expires_at_ms`) and its signed 32-bit error fields
 * (`last_error`, `internal_result`) — a JS `number` cannot represent the
 * full `int64`/`uint64` range without precision loss, so the wire value is
 * always a `bigint` internally and a decimal string at the JSON boundary
 * (S021 point 2: "converti in JSON con la regola lossless del firmware").
 */
export function int64ToJson(value: bigint): string {
  return value.toString();
}

const INTEGER_STRING = /^-?\d+$/;

/**
 * Parses a lossless JSON representation of a 64-bit field. Accepts a
 * decimal string (always lossless) or a JS number only if it is a safe
 * integer (`Number.isSafeInteger`) — anything else is **rejected, never
 * rounded** (S021's own verification: "un numero JSON non rappresentabile
 * losslessly viene rifiutato, non arrotondato").
 */
export function int64FromJson(value: unknown): bigint {
  if (typeof value === "string") {
    if (!INTEGER_STRING.test(value)) {
      throw new ProtocolCodecError(`"${value}" is not a valid integer string`);
    }
    return BigInt(value);
  }
  if (typeof value === "number") {
    if (!Number.isSafeInteger(value)) {
      throw new ProtocolCodecError(
        `${value} cannot be represented losslessly as a 64-bit integer from a JSON number — encode it as a decimal string instead`,
      );
    }
    return BigInt(value);
  }
  throw new ProtocolCodecError(`expected a decimal string or a safe-integer number, got ${typeof value}`);
}
