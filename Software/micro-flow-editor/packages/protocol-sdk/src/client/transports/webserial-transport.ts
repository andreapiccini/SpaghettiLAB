import { FRAME_KIND_EVENT, FRAME_KIND_REQUEST, FRAME_KIND_RESPONSE, frameStreamMessage, StreamFrameDecoder } from "./framing.js";
import type { ProtocolTransport } from "../transport.js";

/**
 * Low-level raw byte-stream capability this adapter needs — a port over a
 * real WebSerial `SerialPort` (or plain USB CDC). Unlike WebSocket, a serial
 * connection has **no message boundaries**: `onData` chunks can split or
 * merge frames arbitrarily, which is why this adapter needs
 * `StreamFrameDecoder` (`framing.ts`) rather than the single kind-byte
 * framing WebSocket gets away with.
 */
export interface RawByteStreamConnection {
  write(bytes: Uint8Array): void;
  /** Returns an unsubscribe function. Delivers raw, possibly partial/merged chunks. */
  onData(handler: (chunk: Uint8Array) => void): () => void;
}

/**
 * `ProtocolTransport` over a raw byte stream (WebSerial/USB). Satisfies S023
 * "definisci interfacce per USB/WebSerial ... senza duplicare semantica del
 * client": this reuses `ProtocolTransport` exactly like the MQTT/WebSocket
 * adapters, so `SpaghettiClient` (S022) needs no special case for it. Only
 * trasporto byte/messaggi — no Config/catalog logic.
 */
export class WebSerialProtocolTransport implements ProtocolTransport {
  private readonly decoder = new StreamFrameDecoder();
  private readonly responseHandlers = new Set<(bytes: Uint8Array) => void>();
  private readonly eventHandlers = new Set<(bytes: Uint8Array) => void>();
  private readonly unsubscribeConnection: () => void;

  constructor(private readonly connection: RawByteStreamConnection) {
    this.unsubscribeConnection = connection.onData((chunk) => this.dispatch(chunk));
  }

  private dispatch(chunk: Uint8Array): void {
    for (const { kind, bytes } of this.decoder.push(chunk)) {
      if (kind === FRAME_KIND_RESPONSE) {
        for (const handler of this.responseHandlers) handler(bytes);
      } else if (kind === FRAME_KIND_EVENT) {
        for (const handler of this.eventHandlers) handler(bytes);
      }
    }
  }

  send(bytes: Uint8Array): Promise<void> {
    // Requests need the same length-prefix framing so the far end's own
    // stream parser can find the boundary — this is a raw byte stream, not a
    // message-oriented transport like WebSocket.
    this.connection.write(frameStreamMessage(FRAME_KIND_REQUEST, bytes));
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
