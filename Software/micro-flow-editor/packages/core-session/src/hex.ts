/** `CoreBindingRecord.expectedDeviceId` (S014) is the device ID as a lowercase hex string — the same encoding `StatusEventPayload.deviceId` (S021) carries as raw bytes. */
export function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function bytesEqualHex(bytes: Uint8Array, hex: string): boolean {
  return bytesToHex(bytes) === hex.toLowerCase();
}
