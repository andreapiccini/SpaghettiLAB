import { EventStream, SpaghettiClient, type ProtocolTransport, type SpaghettiClientOptions } from "@spaghettilab/protocol-sdk";

/**
 * The `spaghetti-connection` config node's runtime state — one shared
 * `ProtocolTransport` feeding both a `SpaghettiClient` (request/response,
 * S022) and an `EventStream` (record/status/discovery/connectivity, S024),
 * exactly the same split the React Flow app uses (`@spaghettilab/core-session`).
 * A Node-RED flow reuses this handle across every `record source`/
 * `command target`/`status` node wired to the same Core, instead of each
 * node opening its own connection — one transport per Core, matching how a
 * physical BLE/MQTT/WebSocket link actually works.
 */
export type SpaghettiConnectionHandle = {
  readonly client: SpaghettiClient;
  readonly eventStream: EventStream;
};

export function createSpaghettiConnection(transport: ProtocolTransport, clientOptions?: SpaghettiClientOptions): SpaghettiConnectionHandle {
  return {
    client: new SpaghettiClient(transport, clientOptions),
    eventStream: new EventStream(transport),
  };
}

export function disposeSpaghettiConnection(handle: SpaghettiConnectionHandle): void {
  handle.client.dispose();
  handle.eventStream.dispose();
}
