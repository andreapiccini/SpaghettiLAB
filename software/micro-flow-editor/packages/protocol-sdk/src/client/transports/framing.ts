/**
 * Envelope wire shape is identical for responses and events (S021), so a
 * transport whose channel doesn't already distinguish them out-of-band (a
 * dedicated topic, a dedicated reply frame type) needs one explicit byte of
 * framing. Shared by the WebSocket and WebSerial/USB adapters, which both
 * face this same problem — MQTT doesn't, since its topics already do the
 * distinguishing.
 */
export const FRAME_KIND_RESPONSE = 0x00;
export const FRAME_KIND_EVENT = 0x01;
/** Only meaningful on stream transports (serial/USB) that need a length prefix in both directions; WebSocket's outgoing `send()` needs no kind byte at all since it's always unambiguously a request. */
export const FRAME_KIND_REQUEST = 0x02;
export type FrameKind = typeof FRAME_KIND_RESPONSE | typeof FRAME_KIND_EVENT | typeof FRAME_KIND_REQUEST;

/** One kind byte followed by the envelope — for transports with native message boundaries (WebSocket: each `send()` is one frame on the wire). */
export function frameMessage(kind: FrameKind, bytes: Uint8Array): Uint8Array {
  const out = new Uint8Array(bytes.length + 1);
  out[0] = kind;
  out.set(bytes, 1);
  return out;
}

export function unframeMessage(frame: Uint8Array): { kind: number; bytes: Uint8Array } {
  return { kind: frame[0] ?? -1, bytes: frame.subarray(1) };
}

/**
 * Kind byte + big-endian uint32 length prefix + envelope — for raw
 * byte-stream transports (serial/USB) that have no message boundaries of
 * their own and can deliver arbitrary, non-aligned chunks.
 */
export function frameStreamMessage(kind: FrameKind, bytes: Uint8Array): Uint8Array {
  const out = new Uint8Array(bytes.length + 5);
  out[0] = kind;
  new DataView(out.buffer).setUint32(1, bytes.length, false);
  out.set(bytes, 5);
  return out;
}

/**
 * Reassembles length-prefixed frames from a byte stream delivered in
 * arbitrary chunks — `push()` accumulates and returns every frame that has
 * become complete, buffering the remainder for the next chunk.
 */
export class StreamFrameDecoder {
  private buffer = new Uint8Array(0);

  push(chunk: Uint8Array): Array<{ kind: number; bytes: Uint8Array }> {
    const merged = new Uint8Array(this.buffer.length + chunk.length);
    merged.set(this.buffer, 0);
    merged.set(chunk, this.buffer.length);
    this.buffer = merged;

    const frames: Array<{ kind: number; bytes: Uint8Array }> = [];
    for (;;) {
      if (this.buffer.length < 1) break;
      const kind = this.buffer[0]!;
      if (kind !== FRAME_KIND_RESPONSE && kind !== FRAME_KIND_EVENT) {
        this.buffer = this.buffer.subarray(1);
        continue;
      }
      if (this.buffer.length < 5) break;
      const length = new DataView(this.buffer.buffer, this.buffer.byteOffset, 5).getUint32(1, false);
      if (length > 2112) {
        this.buffer = this.buffer.subarray(1);
        continue;
      }
      if (this.buffer.length < 5 + length) break;
      frames.push({ kind, bytes: this.buffer.slice(5, 5 + length) });
      this.buffer = this.buffer.slice(5 + length);
    }
    return frames;
  }
}
