import type { RawMessageConnection } from "@spaghettilab/protocol-sdk";

/** The slice of the `ws` package's `WebSocket` this adapter needs — a port, not a hard dependency on `ws`'s full type surface, matching `protocol-sdk`'s own "no concrete library dependency" stance for `RawMessageConnection`/`MqttConnection`. */
export type MinimalWebSocket = {
  send(data: Uint8Array): void;
  on(event: "message", listener: (data: Uint8Array) => void): void;
  off(event: "message", listener: (data: Uint8Array) => void): void;
};

/**
 * Wraps a real `ws` WebSocket (or anything shaped like one — e.g. the
 * `spaghetti-gateway` BLE↔WebSocket bridge documented in
 * `software/node-red/BLE_GATEWAY.md`, which tunnels the exact same framed
 * Protocol V1 bytes) into `@spaghettilab/protocol-sdk`'s `RawMessageConnection`
 * — the one real transport adapter this package wires up itself, since
 * `software/node-red/BLE_GATEWAY.md` already establishes WebSocket as the
 * real, working path from Node-RED to a Core (direct Wi-Fi or via the BLE
 * gateway). `protocol-sdk` deliberately carries no WebSocket library
 * dependency of its own (`WebSocketProtocolTransport`'s doc comment); this
 * is where that gap gets filled with a real, tested adapter instead of a
 * caller-supplied stub.
 */
export function wsToRawMessageConnection(socket: MinimalWebSocket): RawMessageConnection {
  return {
    send(bytes: Uint8Array) {
      socket.send(bytes);
    },
    onMessage(handler: (bytes: Uint8Array) => void) {
      const listener = (data: Uint8Array) => handler(data instanceof Uint8Array ? data : new Uint8Array(data));
      socket.on("message", listener);
      return () => socket.off("message", listener);
    },
  };
}
