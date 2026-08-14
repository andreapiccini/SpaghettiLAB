/** Local hex helper — `core-session`'s `hex.ts` only exports `bytesToHex`/`bytesEqualHex`, no inverse. `CoreBindingRecord.expectedDeviceId` and a marketplace/OTA manifest's `hash` are both lowercase hex strings (S014/S101 convention). */
export function hexToBytes(hex: string): Uint8Array {
  const clean = hex.length % 2 === 0 ? hex : `0${hex}`;
  const bytes = new Uint8Array(clean.length / 2);
  for (let i = 0; i < bytes.length; i++) bytes[i] = parseInt(clean.slice(i * 2, i * 2 + 2), 16);
  return bytes;
}
