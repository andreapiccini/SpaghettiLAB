import { decodeOne } from "../cbor.js";
import { bytesField, decodeEmptyPayload, encodeEmptyPayload, encodeMap, requireBytes, requireMap, requireText, requireU32, textField, u32Field } from "../fields.js";

/**
 * `OPEN_BLE_UPDATE` (op 28), `WRITE_BLE_UPDATE` (op 29), `FINISH_BLE_UPDATE`
 * (op 30), `CANCEL_BLE_UPDATE` (op 31) — added to `protocol.h`'s operation
 * enum (Firmware commit 875c115) after this SDK's operations were first
 * written; not previously decoded here at all. Handlers live in
 * `update_ops.c`, distinct from `connectivity_ops.c`'s Wi-Fi/handover ops.
 */

/** `OPEN_BLE_UPDATE` (op 28) request — `decode_ble_begin`, `update_ops.c`. `imageSha256` must be exactly 32 bytes. */
export type OpenBleUpdateRequest = {
  readonly imageSize: number;
  readonly imageSha256: Uint8Array;
  readonly version: string;
};

export function encodeOpenBleUpdateRequest(r: OpenBleUpdateRequest): Uint8Array {
  return encodeMap([u32Field(0, r.imageSize), bytesField(1, r.imageSha256), textField(2, r.version)]);
}

export function decodeOpenBleUpdateRequest(bytes: Uint8Array): OpenBleUpdateRequest {
  const map = requireMap(decodeOne(bytes), "OpenBleUpdateRequest");
  return { imageSize: requireU32(map, 0, "OpenBleUpdateRequest"), imageSha256: requireBytes(map, 1, "OpenBleUpdateRequest"), version: requireText(map, 2, "OpenBleUpdateRequest") };
}

/** `OPEN_BLE_UPDATE` response — `{0: session_id}`. Deliberately not the shared `JobIdResponse` type: this operation is declared `ASYNC_JOB` on the firmware side but its field is a BLE session id, a different concept from a pollable `GET_JOB_STATUS` job. */
export type OpenBleUpdateResponse = { readonly sessionId: number };

export function encodeOpenBleUpdateResponse(r: OpenBleUpdateResponse): Uint8Array {
  return encodeMap([u32Field(0, r.sessionId)]);
}

export function decodeOpenBleUpdateResponse(bytes: Uint8Array): OpenBleUpdateResponse {
  const map = requireMap(decodeOne(bytes), "OpenBleUpdateResponse");
  return { sessionId: requireU32(map, 0, "OpenBleUpdateResponse") };
}

/** `WRITE_BLE_UPDATE` (op 29) request — carries an explicit byte `offset`, not just a sequential chunk: a retried write can target a specific offset, which is what makes resume meaningful for this transport (see `@spaghettilab/ota-lifecycle`'s README). */
export type WriteBleUpdateRequest = { readonly sessionId: number; readonly offset: number; readonly bytes: Uint8Array };

export function encodeWriteBleUpdateRequest(r: WriteBleUpdateRequest): Uint8Array {
  return encodeMap([u32Field(0, r.sessionId), u32Field(1, r.offset), bytesField(2, r.bytes)]);
}

export function decodeWriteBleUpdateRequest(bytes: Uint8Array): WriteBleUpdateRequest {
  const map = requireMap(decodeOne(bytes), "WriteBleUpdateRequest");
  return { sessionId: requireU32(map, 0, "WriteBleUpdateRequest"), offset: requireU32(map, 1, "WriteBleUpdateRequest"), bytes: requireBytes(map, 2, "WriteBleUpdateRequest") };
}

/** `WRITE_BLE_UPDATE`/`FINISH_BLE_UPDATE`/`CANCEL_BLE_UPDATE` all respond with the empty map — success/absence signaled by the envelope alone. */
export const encodeBleUpdateEmptyResponse = encodeEmptyPayload;
export function decodeBleUpdateEmptyResponse(bytes: Uint8Array): void {
  decodeEmptyPayload(bytes, "BleUpdateEmptyResponse");
}

/** `FINISH_BLE_UPDATE` (op 30) / `CANCEL_BLE_UPDATE` (op 31) request — both just `{0: session_id}`. */
export type BleUpdateSessionRequest = { readonly sessionId: number };

export function encodeBleUpdateSessionRequest(r: BleUpdateSessionRequest): Uint8Array {
  return encodeMap([u32Field(0, r.sessionId)]);
}

export function decodeBleUpdateSessionRequest(bytes: Uint8Array): BleUpdateSessionRequest {
  const map = requireMap(decodeOne(bytes), "BleUpdateSessionRequest");
  return { sessionId: requireU32(map, 0, "BleUpdateSessionRequest") };
}
