import { coordinateRecordToCommand, CoordinateOutcome } from "@spaghettilab/node-red-nodes";

/**
 * `spaghetti-coordinator` — routes a `spaghetti-record-source` message
 * against one `@spaghettilab/system-automation-graph` `SystemAutomationLink`
 * (S111) via `@spaghettilab/node-red-nodes`'s `coordinateRecordToCommand()`
 * (S112) — never a fresh compatibility judgment of its own; the link this
 * node reads from its config was already validated at authoring time.
 * `msg.moduleKey`/`msg.commandId` on output 1 are wired straight into a
 * `spaghetti-command-target` node downstream.
 *
 * The transform registry is intentionally a flow-context lookup
 * (`flow.get("spaghettiTransforms")`) rather than inline code in this node —
 * the actual conversion math is real business logic this package never
 * invents (see `TransformRegistry`'s doc comment).
 */
export default function (RED) {
  function SpaghettiCoordinatorNode(config) {
    RED.nodes.createNode(this, config);
    const node = this;
    let link;
    try {
      link = JSON.parse(config.linkJson);
    } catch (err) {
      node.error(`spaghetti-coordinator: invalid link JSON — ${err.message ?? err}`);
      return;
    }

    node.on("input", (msg, send, done) => {
      const transformsMap = node.context().flow.get("spaghettiTransforms") || {};
      const transforms = { resolve: (name) => transformsMap[name] };

      const result = coordinateRecordToCommand(link, msg.payload, transforms);
      if (result.kind === CoordinateOutcome.ROUTED) {
        send([{ ...msg, moduleKey: result.invocation.moduleKey, commandId: result.invocation.commandId, payload: result.invocation.value }, null]);
      } else if (result.kind === CoordinateOutcome.TRANSFORM_UNRESOLVED) {
        node.error(`spaghetti-coordinator: link "${link.id}" declares unresolved transformation "${result.transformation}"`, msg);
        send([null, msg]);
      } else {
        send([null, msg]);
      }
      done();
    });
  }

  RED.nodes.registerType("spaghetti-coordinator", SpaghettiCoordinatorNode);
}
