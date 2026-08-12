import { decodeOne } from "./cbor.js";
import { encodeMap, requireBytes, requireInt64, requireMap, requireText, requireU32, u32Field, bytesField, int64Field, textField } from "./fields.js";

/** `spaghetti_protocol_encode_record_event_payload`, `protocol_cbor.c` — `EventType.RECORD` payload. */
export type RecordEventPayload = {
  readonly sourceKey: number;
  readonly sequence: number;
  readonly schemaId: string;
  readonly schemaVersion: number;
};

export function encodeRecordEventPayload(p: RecordEventPayload): Uint8Array {
  return encodeMap([
    u32Field(0, p.sourceKey),
    u32Field(1, p.sequence),
    textField(2, p.schemaId),
    u32Field(3, p.schemaVersion),
  ]);
}

export function decodeRecordEventPayload(bytes: Uint8Array): RecordEventPayload {
  const map = requireMap(decodeOne(bytes), "RecordEventPayload");
  return {
    sourceKey: requireU32(map, 0, "RecordEventPayload"),
    sequence: requireU32(map, 1, "RecordEventPayload"),
    schemaId: requireText(map, 2, "RecordEventPayload"),
    schemaVersion: requireU32(map, 3, "RecordEventPayload"),
  };
}

/** `EventType.STATUS` payload — `boot_id` is `uint64`, never a JS `number` (see `int64.ts`). */
export type StatusEventPayload = {
  readonly deviceId: Uint8Array;
  readonly bootId: bigint;
  readonly queueDepth: number;
  readonly dropCount: number;
};

export function encodeStatusEventPayload(p: StatusEventPayload): Uint8Array {
  return encodeMap([
    bytesField(0, p.deviceId),
    int64Field(1, p.bootId),
    u32Field(2, p.queueDepth),
    u32Field(3, p.dropCount),
  ]);
}

export function decodeStatusEventPayload(bytes: Uint8Array): StatusEventPayload {
  const map = requireMap(decodeOne(bytes), "StatusEventPayload");
  return {
    deviceId: requireBytes(map, 0, "StatusEventPayload"),
    bootId: requireInt64(map, 1, "StatusEventPayload"),
    queueDepth: requireU32(map, 2, "StatusEventPayload"),
    dropCount: requireU32(map, 3, "StatusEventPayload"),
  };
}

/** `EventType.DISCOVERY` payload. */
export type DiscoveryEventPayload = {
  readonly candidateId: number;
  readonly portId: number;
  readonly generation: number;
};

export function encodeDiscoveryEventPayload(p: DiscoveryEventPayload): Uint8Array {
  return encodeMap([u32Field(0, p.candidateId), u32Field(1, p.portId), u32Field(2, p.generation)]);
}

export function decodeDiscoveryEventPayload(bytes: Uint8Array): DiscoveryEventPayload {
  const map = requireMap(decodeOne(bytes), "DiscoveryEventPayload");
  return {
    candidateId: requireU32(map, 0, "DiscoveryEventPayload"),
    portId: requireU32(map, 1, "DiscoveryEventPayload"),
    generation: requireU32(map, 2, "DiscoveryEventPayload"),
  };
}

/** `EventType.CONNECTIVITY` payload — `lastError` is a signed `int32` (raw firmware errno, can be negative). */
export type ConnectivityEventPayload = {
  readonly policy: number;
  readonly activeServices: number;
  readonly lastError: bigint;
};

export function encodeConnectivityEventPayload(p: ConnectivityEventPayload): Uint8Array {
  return encodeMap([u32Field(0, p.policy), u32Field(1, p.activeServices), int64Field(2, p.lastError)]);
}

export function decodeConnectivityEventPayload(bytes: Uint8Array): ConnectivityEventPayload {
  const map = requireMap(decodeOne(bytes), "ConnectivityEventPayload");
  return {
    policy: requireU32(map, 0, "ConnectivityEventPayload"),
    activeServices: requireU32(map, 1, "ConnectivityEventPayload"),
    lastError: requireInt64(map, 2, "ConnectivityEventPayload"),
  };
}
