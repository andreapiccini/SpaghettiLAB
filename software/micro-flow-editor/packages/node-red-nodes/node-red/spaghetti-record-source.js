import { runRecordSource } from "@spaghettilab/node-red-nodes";

/**
 * `spaghetti-record-source` — emits one `msg` per matching Protocol V1
 * `RECORD` event, via `@spaghettilab/node-red-nodes`'s `runRecordSource()`
 * (S112), the same S021-S024 decoder the React Flow app uses. `resolveFields`
 * is left `undefined` here (no MQTT-payload decoder for real record bytes
 * exists — see the package README) unless a future node config wires one in.
 */
export default function (RED) {
  function SpaghettiRecordSourceNode(config) {
    RED.nodes.createNode(this, config);
    const node = this;
    const connectionNode = RED.nodes.getNode(config.connection);
    const filter = {
      sourceKey: config.sourceKey !== "" && config.sourceKey !== undefined ? Number(config.sourceKey) : undefined,
      schemaId: config.schemaId || undefined,
    };

    function start() {
      if (!connectionNode?.handle) return;
      runRecordSource(connectionNode.handle.eventStream, config.coreId || connectionNode.id, filter, (msg) => {
        node.send({ payload: msg });
      }).catch((err) => node.error(`spaghetti-record-source: ${err.message ?? err}`));
    }

    if (connectionNode?.ready) start();
    connectionNode?.on("spaghetti-connection:ready", start);
  }

  RED.nodes.registerType("spaghetti-record-source", SpaghettiRecordSourceNode);
}
