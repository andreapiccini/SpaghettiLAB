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
  /** Core USB accepts one in-flight request; later writes wait for a response frame. */
  private sendQueue: Promise<void> = Promise.resolve();
  private inFlightWaiter: (() => void) | null = null;

  constructor(private readonly connection: RawByteStreamConnection) {
    this.unsubscribeConnection = connection.onData((chunk) => this.dispatch(chunk));
  }

  private releaseInFlight(): void {
    const waiter = this.inFlightWaiter;
    this.inFlightWaiter = null;
    waiter?.();
  }

  private dispatch(chunk: Uint8Array): void {
    for (const { kind, bytes } of this.decoder.push(chunk)) {
      if (kind === FRAME_KIND_RESPONSE) {
        this.releaseInFlight();
        for (const handler of this.responseHandlers) handler(bytes);
      } else if (kind === FRAME_KIND_EVENT) {
        for (const handler of this.eventHandlers) handler(bytes);
      }
    }
  }

  send(bytes: Uint8Array): Promise<void> {
    const framed = frameStreamMessage(FRAME_KIND_REQUEST, bytes);
    const run = this.sendQueue.then(() => this.writeOne(framed));
    this.sendQueue = run.then(
      () => undefined,
      () => undefined,
    );
    return run;
  }

  private writeOne(framed: Uint8Array): Promise<void> {
    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        this.releaseInFlight();
        resolve();
      }, 8000);
      this.inFlightWaiter = () => {
        clearTimeout(timeout);
        resolve();
      };
      this.connection.write(framed);
    });
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
