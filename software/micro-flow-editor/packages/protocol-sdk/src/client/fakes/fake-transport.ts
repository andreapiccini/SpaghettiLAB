import type { ProtocolTransport } from "../transport.js";

/** In-memory `ProtocolTransport` for tests — no real MQTT/WebSocket/BLE involved. */
export class FakeTransport implements ProtocolTransport {
  readonly sent: Uint8Array[] = [];
  private readonly responseHandlers = new Set<(bytes: Uint8Array) => void>();
  private readonly eventHandlers = new Set<(bytes: Uint8Array) => void>();

  send(bytes: Uint8Array): Promise<void> {
    this.sent.push(bytes);
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

  /** Test-only: simulates the Core delivering a response envelope. */
  deliverResponse(bytes: Uint8Array): void {
    for (const handler of this.responseHandlers) handler(bytes);
  }

  /** Test-only: simulates the Core delivering an event envelope. */
  deliverEvent(bytes: Uint8Array): void {
    for (const handler of this.eventHandlers) handler(bytes);
  }
}
