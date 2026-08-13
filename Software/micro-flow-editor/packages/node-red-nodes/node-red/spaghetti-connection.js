import { WebSocketProtocolTransport } from "@spaghettilab/protocol-sdk";
import WebSocket from "ws";
import { createSpaghettiConnection, disposeSpaghettiConnection, wsToRawMessageConnection } from "@spaghettilab/node-red-nodes";

/**
 * `spaghetti-connection` — the config node every other SpaghettiLAB node
 * references. One WebSocket per Core (direct Wi-Fi, or the BLE gateway
 * documented in `Software/node-red/BLE_GATEWAY.md`, which tunnels the same
 * framed Protocol V1 bytes) feeds one shared `SpaghettiClient` +
 * `EventStream` (`@spaghettilab/node-red-nodes`'s `createSpaghettiConnection`,
 * S112) — the exact same client/event-stream split the React Flow app uses,
 * never a second decoder.
 *
 * Not runtime-verified inside a live Node-RED editor as of this commit — see
 * the package README's "Honest scope gaps".
 */
export default function (RED) {
  function SpaghettiConnectionNode(config) {
    RED.nodes.createNode(this, config);
    const node = this;
    node.url = config.url; // e.g. ws://127.0.0.1:8765/?token=...
    node.handle = undefined;
    node.socket = undefined;
    node.ready = false;

    function connect() {
      const socket = new WebSocket(node.url);
      node.socket = socket;
      socket.on("open", () => {
        node.handle = createSpaghettiConnection(new WebSocketProtocolTransport(wsToRawMessageConnection(socket)));
        node.ready = true;
        node.emit("spaghetti-connection:ready");
      });
      socket.on("close", () => {
        node.ready = false;
        if (node.handle) disposeSpaghettiConnection(node.handle);
        node.handle = undefined;
      });
      socket.on("error", (err) => {
        node.error(`spaghetti-connection: ${err.message ?? err}`);
      });
    }

    connect();

    node.on("close", (done) => {
      node.ready = false;
      if (node.handle) disposeSpaghettiConnection(node.handle);
      if (node.socket) node.socket.close();
      done();
    });
  }

  RED.nodes.registerType("spaghetti-connection", SpaghettiConnectionNode);
}
