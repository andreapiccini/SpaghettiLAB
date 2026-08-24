import type { RawByteStreamConnection } from "../webserial-transport.js";

/** In-memory `RawByteStreamConnection` for tests — no real WebSerial/USB port involved. */
export class FakeRawByteStreamConnection implements RawByteStreamConnection {
  readonly written: Uint8Array[] = [];
  private readonly handlers = new Set<(chunk: Uint8Array) => void>();

  write(bytes: Uint8Array): void {
    this.written.push(bytes);
  }

  onData(handler: (chunk: Uint8Array) => void): () => void {
    this.handlers.add(handler);
    return () => this.handlers.delete(handler);
  }

  /** Test-only: simulates the serial port delivering one raw chunk — deliberately allows splitting/merging frames to exercise `StreamFrameDecoder`. */
  deliver(chunk: Uint8Array): void {
    for (const handler of this.handlers) handler(chunk);
  }
}
