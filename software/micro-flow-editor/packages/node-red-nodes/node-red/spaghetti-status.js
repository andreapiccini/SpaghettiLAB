import { fetchCoreStatus, watchStatusEvents } from "@spaghettilab/node-red-nodes";

/**
 * `spaghetti-status` — reads/watches Core status via
 * `@spaghettilab/node-red-nodes`'s `fetchCoreStatus()`/`watchStatusEvents()`
 * (S112), which reuse `@spaghettilab/core-status`'s real
 * `describeCoreStatus()` — the same enum labels the React Flow app shows.
 */
export default function (RED) {
  function SpaghettiStatusNode(config) {
    RED.nodes.createNode(this, config);
    const node = this;
    const connectionNode = RED.nodes.getNode(config.connection);

    async function refresh() {
      if (!connectionNode?.handle) return;
      try {
        const view = await fetchCoreStatus(connectionNode.handle.client);
        node.send({ payload: view });
        node.status({ fill: view.healthState === "HEALTHY" ? "green" : "yellow", shape: "dot", text: `${view.state}/${view.healthState}` });
      } catch (err) {
        node.error(`spaghetti-status: ${err.message ?? err}`);
      }
    }

    function watch() {
      if (!connectionNode?.handle) return;
      watchStatusEvents(connectionNode.handle.eventStream, () => refresh()).catch((err) => node.error(`spaghetti-status: ${err.message ?? err}`));
    }

    if (connectionNode?.ready) {
      refresh();
      watch();
    }
    connectionNode?.on("spaghetti-connection:ready", () => {
      refresh();
      watch();
    });

    node.on("input", (msg, send, done) => {
      refresh().then(done, done);
    });
  }

  RED.nodes.registerType("spaghetti-status", SpaghettiStatusNode);
}
