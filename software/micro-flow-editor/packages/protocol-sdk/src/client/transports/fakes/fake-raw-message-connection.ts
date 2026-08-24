import type { RawMessageConnection } from "../websocket-transport.js";

/** In-memory `RawMessageConnection` for tests — no real WebSocket involved. */
export class FakeRawMessageConnection implements RawMessageConnection {
  readonly sent: Uint8Array[] = [];
  private readonly handlers = new Set<(bytes: Uint8Array) => void>();

  send(bytes: Uint8Array): void {
    this.sent.push(bytes);
  }

  onMessage(handler: (bytes: Uint8Array) => void): () => void {
    this.handlers.add(handler);
    return () => this.handlers.delete(handler);
  }

  /** Test-only: simulates the peer delivering one message. */
  deliver(bytes: Uint8Array): void {
    for (const handler of this.handlers) handler(bytes);
  }
}
