// S021 — Protocol V1 codec. See ./cbor.ts, ./envelope.ts, ./int64.ts,
// ./fields.ts and ./operations/ for the implementation; the roadmap task
// (roadmap/react-flow-v1/tasks/S021-codec-protocol-types.md) has the
// "Implementazione" note on scope and the golden-vector gap this codec
// works around.
// `encodeMap` is re-exported via `./fields.js` below, not here, to avoid a
// duplicate export — everything else from `cbor.ts` is exported directly.
export {
  ProtocolCodecError,
  CborReader,
  decodeOne,
  encodeUint,
  encodeInt,
  encodeBytes,
  encodeText,
  encodeArrayHeader,
  encodeMapHeader,
  encodeBool,
  encodeSequence,
  encodeArray,
  type CborValue,
} from "./cbor.js";
export * from "./int64.js";
export * from "./fields.js";
export * from "./envelope.js";
export * from "./events.js";
export * from "./operations/index.js";
