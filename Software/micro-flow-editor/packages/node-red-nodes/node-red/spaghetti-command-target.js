import { runCommandTarget } from "@spaghettilab/node-red-nodes";

/**
 * `spaghetti-command-target` — sends `msg.payload` as a `MODULE_COMMAND`
 * via `@spaghettilab/node-red-nodes`'s `runCommandTarget()` (S112), which
 * is `@spaghettilab/core-actions`'s real `runCommand()` — the exact same
 * permission-denied/queue-full/timeout classification the React Flow app
 * uses, called directly, never mirrored.
 */
export default function (RED) {
  function SpaghettiCommandTargetNode(config) {
    RED.nodes.createNode(this, config);
    const node = this;
    const connectionNode = RED.nodes.getNode(config.connection);
    const permissionScope = config.permissionScope || undefined;

    node.on("input", async (msg, send, done) => {
      if (!connectionNode?.handle) {
        node.error("spaghetti-command-target: connection not ready", msg);
        return done();
      }
      const moduleKey = msg.moduleKey ?? Number(config.moduleKey);
      const commandId = msg.commandId ?? Number(config.commandId);
      try {
        const outcome = await runCommandTarget(connectionNode.handle.client, connectionNode.grantedPermissions ?? new Set(), {
          moduleKey,
          commandId,
          permissionScope,
        });
        send({ ...msg, payload: outcome });
        node.status({ fill: outcome.kind === "SUCCESS" ? "green" : "red", shape: "dot", text: outcome.kind });
        done();
      } catch (err) {
        node.error(`spaghetti-command-target: ${err.message ?? err}`, msg);
        done(err);
      }
    });
  }

  RED.nodes.registerType("spaghetti-command-target", SpaghettiCommandTargetNode);
}
