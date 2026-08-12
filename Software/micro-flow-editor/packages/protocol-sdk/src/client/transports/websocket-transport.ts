import { FRAME_KIND_EVENT, FRAME_KIND_RESPONSE, unframeMessage } from "./framing.js";
import type { ProtocolTransport } from "../transport.js";

/**
 * Low-level byte-message capability this adapter needs — a port over a real
 * `WebSocket` (or a BLE gateway that tunnels the same framed bytes over a
 * WebSocket connection; from this adapter's perspective they're the same
 * shape, which is the point of "WebSocket/BLE gateway" as one adapter
 * category rather than two).
 */
export interface RawMessageConnection {
  send(bytes: Uint8Array): void;
  /** Returns an unsubscribe function. */
  onMessage(handler: (bytes: Uint8Array) => void): () => void;
}

/**
 * `ProtocolTransport` over a message-oriented raw connection (WebSocket, or a
 * BLE gateway tunneled the same way). Outgoing requests need no framing
 * (always requests, never ambiguous); incoming messages carry one leading
 * kind byte (`framing.ts`) so responses and events can share one channel.
 * Only trasporto byte/messaggi — no Config/catalog logic (S023).
 */
export class WebSocketProtocolTransport implements ProtocolTransport {
  private readonly responseHandlers = new Set<(bytes: Uint8Array) => void>();
  private readonly eventHandlers = new Set<(bytes: Uint8Array) => void>();
  private readonly unsubscribeConnection: () => void;

  constructor(private readonly connection: RawMessageConnection) {
    this.unsubscribeConnection = connection.onMessage((frame) => this.dispatch(frame));
  }

  private dispatch(frame: Uint8Array): void {
    const { kind, bytes } = unframeMessage(frame);
    if (kind === FRAME_KIND_RESPONSE) {
      for (const handler of this.responseHandlers) handler(bytes);
    } else if (kind === FRAME_KIND_EVENT) {
      for (const handler of this.eventHandlers) handler(bytes);
    }
    // An unrecognized kind byte is silently ignored — same "never crash the
    // channel on unrecoverable garbage" principle as S022's envelope decode.
  }

  send(bytes: Uint8Array): Promise<void> {
    this.connection.send(bytes);
    return Promise.resolve();
  }

  onResponse(handler: (bytes: Uint8Array) => void): () => void {
    this.responseHandlers.add(handler);
    return () => this.responseHandlers.delete(handler);
  }

  onEvent(handler: (bytes: Uint8Array) => void): () => void {
    this.eventHandlers.add(handler);
    return () => this.eventHandlers.delete(handler);
  }

  dispose(): void {
    this.unsubscribeConnection();
  }
}
