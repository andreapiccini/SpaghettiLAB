/**
 * Minimal canonical CBOR primitives — encode/decode only the subset the
 * firmware's zcbor-based Protocol V1 actually uses: unsigned/negative
 * integers (major type 0/1, up to 64 bits), byte strings, UTF-8 text
 * strings, definite-length arrays/maps, and the two boolean simple values.
 * No floats, no tags, no indefinite-length items, no bignums — the firmware
 * never emits them (see Software/reference or the S021 implementation note
 * for the research this is based on), so a general-purpose CBOR library
 * would accept/produce a strictly larger surface than this protocol allows.
 * Encoding is always canonical (RFC 8949 §4.2.1: shortest-possible integer
 * head, definite lengths, ascending small-integer map keys) to match
 * zcbor's canonical output byte-for-byte.
 */

export class ProtocolCodecError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ProtocolCodecError";
  }
}

const MAJOR_UINT = 0;
const MAJOR_NEGINT = 1;
const MAJOR_BYTES = 2;
const MAJOR_TEXT = 3;
const MAJOR_ARRAY = 4;
const MAJOR_MAP = 5;
const MAJOR_SIMPLE = 7;

function concatBytes(chunks: readonly Uint8Array[]): Uint8Array {
  const total = chunks.reduce((n, c) => n + c.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    out.set(chunk, offset);
    offset += chunk.length;
  }
  return out;
}

/** Canonical minimal-length head (major type + argument) per RFC 8949 §3.1/§4.2.1. */
function encodeHead(majorType: number, argument: bigint): Uint8Array {
  if (argument < 0n) {
    throw new ProtocolCodecError("CBOR head argument must be non-negative");
  }
  const mt = majorType << 5;
  if (argument < 24n) {
    return Uint8Array.of(mt | Number(argument));
  }
  if (argument <= 0xffn) {
    return Uint8Array.of(mt | 24, Number(argument));
  }
  if (argument <= 0xffffn) {
    const bytes = new Uint8Array(3);
    bytes[0] = mt | 25;
    new DataView(bytes.buffer).setUint16(1, Number(argument), false);
    return bytes;
  }
  if (argument <= 0xffffffffn) {
    const bytes = new Uint8Array(5);
    bytes[0] = mt | 26;
    new DataView(bytes.buffer).setUint32(1, Number(argument), false);
    return bytes;
  }
  if (argument <= 0xffffffffffffffffn) {
    const bytes = new Uint8Array(9);
    bytes[0] = mt | 27;
    new DataView(bytes.buffer).setBigUint64(1, argument, false);
    return bytes;
  }
  throw new ProtocolCodecError("CBOR argument exceeds the 64-bit range this protocol supports");
}

export function encodeUint(value: bigint): Uint8Array {
  return encodeHead(MAJOR_UINT, value);
}

/** Encodes a signed integer of either sign as canonical CBOR major type 0/1. */
export function encodeInt(value: bigint): Uint8Array {
  return value >= 0n ? encodeHead(MAJOR_UINT, value) : encodeHead(MAJOR_NEGINT, -1n - value);
}

export function encodeBytes(value: Uint8Array): Uint8Array {
  return concatBytes([encodeHead(MAJOR_BYTES, BigInt(value.length)), value]);
}

export function encodeText(value: string): Uint8Array {
  const utf8 = new TextEncoder().encode(value);
  return concatBytes([encodeHead(MAJOR_TEXT, BigInt(utf8.length)), utf8]);
}

export function encodeArrayHeader(length: number): Uint8Array {
  return encodeHead(MAJOR_ARRAY, BigInt(length));
}

export function encodeMapHeader(pairCount: number): Uint8Array {
  return encodeHead(MAJOR_MAP, BigInt(pairCount));
}

export function encodeBool(value: boolean): Uint8Array {
  return Uint8Array.of(value ? 0xf5 : 0xf4);
}

/** Concatenates an ordered sequence of already-encoded CBOR items into one buffer. */
export function encodeSequence(...items: readonly Uint8Array[]): Uint8Array {
  return concatBytes(items);
}

/**
 * Builds a canonical definite-length map from `[key, valueBytes]` pairs, in
 * the order given — callers pass field IDs in ascending order (0,1,2,...),
 * which for small integer keys (the only kind this protocol ever uses) is
 * already canonical order, matching zcbor's canonical mode.
 */
export function encodeMap(pairs: ReadonlyArray<readonly [number, Uint8Array]>): Uint8Array {
  const parts: Uint8Array[] = [encodeMapHeader(pairs.length)];
  for (const [key, value] of pairs) {
    parts.push(encodeUint(BigInt(key)), value);
  }
  return concatBytes(parts);
}

export function encodeArray(items: readonly Uint8Array[]): Uint8Array {
  return concatBytes([encodeArrayHeader(items.length), ...items]);
}

export type CborValue =
  | { readonly kind: "uint"; readonly value: bigint }
  | { readonly kind: "int"; readonly value: bigint }
  | { readonly kind: "bytes"; readonly value: Uint8Array }
  | { readonly kind: "text"; readonly value: string }
  | { readonly kind: "array"; readonly value: readonly CborValue[] }
  | { readonly kind: "map"; readonly value: ReadonlyMap<number, CborValue> }
  | { readonly kind: "bool"; readonly value: boolean };

/** Cursor-based decoder for one CBOR value at a time, tracking consumed bytes. */
export class CborReader {
  private offset = 0;

  constructor(private readonly bytes: Uint8Array) {}

  get remaining(): number {
    return this.bytes.length - this.offset;
  }

  private readByte(): number {
    if (this.offset >= this.bytes.length) {
      throw new ProtocolCodecError("unexpected end of CBOR input");
    }
    return this.bytes[this.offset++]!;
  }

  private readBytes(length: number): Uint8Array {
    if (this.offset + length > this.bytes.length) {
      throw new ProtocolCodecError("unexpected end of CBOR input");
    }
    const out = this.bytes.subarray(this.offset, this.offset + length);
    this.offset += length;
    return out;
  }

  private readArgument(additionalInfo: number): bigint {
    if (additionalInfo < 24) return BigInt(additionalInfo);
    if (additionalInfo === 24) return BigInt(this.readByte());
    if (additionalInfo === 25) {
      const b = this.readBytes(2);
      return BigInt(new DataView(b.buffer, b.byteOffset, 2).getUint16(0, false));
    }
    if (additionalInfo === 26) {
      const b = this.readBytes(4);
      return BigInt(new DataView(b.buffer, b.byteOffset, 4).getUint32(0, false));
    }
    if (additionalInfo === 27) {
      const b = this.readBytes(8);
      return new DataView(b.buffer, b.byteOffset, 8).getBigUint64(0, false);
    }
    throw new ProtocolCodecError(
      `unsupported CBOR additional info ${additionalInfo} — indefinite-length items are never used by this protocol`,
    );
  }

  readValue(): CborValue {
    const head = this.readByte();
    const majorType = head >> 5;
    const additionalInfo = head & 0x1f;
    switch (majorType) {
      case MAJOR_UINT:
        return { kind: "uint", value: this.readArgument(additionalInfo) };
      case MAJOR_NEGINT:
        return { kind: "int", value: -1n - this.readArgument(additionalInfo) };
      case MAJOR_BYTES:
        return { kind: "bytes", value: this.readBytes(Number(this.readArgument(additionalInfo))) };
      case MAJOR_TEXT: {
        const raw = this.readBytes(Number(this.readArgument(additionalInfo)));
        return { kind: "text", value: new TextDecoder("utf-8", { fatal: true }).decode(raw) };
      }
      case MAJOR_ARRAY: {
        const length = Number(this.readArgument(additionalInfo));
        const items: CborValue[] = [];
        for (let i = 0; i < length; i++) items.push(this.readValue());
        return { kind: "array", value: items };
      }
      case MAJOR_MAP: {
        const length = Number(this.readArgument(additionalInfo));
        const map = new Map<number, CborValue>();
        for (let i = 0; i < length; i++) {
          const key = this.readValue();
          if (key.kind !== "uint") {
            throw new ProtocolCodecError("CBOR map key must be a non-negative integer");
          }
          const numericKey = Number(key.value);
          if (map.has(numericKey)) {
            throw new ProtocolCodecError(`duplicate CBOR map key ${numericKey}`);
          }
          map.set(numericKey, this.readValue());
        }
        return { kind: "map", value: map };
      }
      case MAJOR_SIMPLE:
        if (additionalInfo === 20) return { kind: "bool", value: false };
        if (additionalInfo === 21) return { kind: "bool", value: true };
        throw new ProtocolCodecError(`unsupported CBOR simple value ${additionalInfo}`);
      default:
        throw new ProtocolCodecError(`unsupported CBOR major type ${majorType}`);
    }
  }
}

export function decodeOne(bytes: Uint8Array): CborValue {
  return new CborReader(bytes).readValue();
}
