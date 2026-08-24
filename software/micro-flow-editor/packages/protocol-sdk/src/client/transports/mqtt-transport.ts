import type { ProtocolTransport } from "../transport.js";

/**
 * Low-level MQTT capability this adapter needs — a port, not a dependency on
 * any concrete MQTT client library. `protocol-sdk` stays free of a real MQTT
 * implementation; whoever wires up a real Core connection supplies one
 * (e.g. an `mqtt.js` client wrapped to this shape).
 */
export interface MqttConnection {
  publish(topic: string, payload: Uint8Array): Promise<void>;
  /** Returns an unsubscribe function. */
  subscribe(topic: string, handler: (payload: Uint8Array) => void): () => void;
}

export type MqttTransportTopics = {
  /** Topic this Core listens on for requests. */
  readonly request: string;
  /** Topic this Core publishes responses to. */
  readonly response: string;
  /** Topic this Core publishes events to. */
  readonly event: string;
};

/**
 * `ProtocolTransport` over MQTT — one topic per direction, matching MQTT's own
 * pub/sub shape directly. Carries only bytes: no Config or catalog logic (S023
 * "un adapter di trasporto non contiene logica di Config o di catalogo, solo
 * trasporto byte/messaggi") — this class is deliberately this small.
 */
export class MqttProtocolTransport implements ProtocolTransport {
  constructor(
    private readonly connection: MqttConnection,
    private readonly topics: MqttTransportTopics,
  ) {}

  send(bytes: Uint8Array): Promise<void> {
    return this.connection.publish(this.topics.request, bytes);
  }

  onResponse(handler: (bytes: Uint8Array) => void): () => void {
    return this.connection.subscribe(this.topics.response, handler);
  }

  onEvent(handler: (bytes: Uint8Array) => void): () => void {
    return this.connection.subscribe(this.topics.event, handler);
  }
}
