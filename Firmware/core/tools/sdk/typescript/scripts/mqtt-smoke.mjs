/**
 * Fake MQTT → SpaghettiClient smoke (no broker, no Node-RED process).
 */
import {
  SpaghettiClient,
  MqttProtocolTransport,
  decodeRequest,
  encodeResponse,
  encodeGetStatusResponse,
  Operation,
} from "../dist/index.js";

async function main() {
  const handlers = new Map();

  const connection = {
    async publish(topic, payload) {
      if (!topic.includes("/requests/")) return;
      const req = decodeRequest(payload);
      if (req.operation !== Operation.GET_STATUS) {
        throw new Error(`unexpected operation ${req.operation}`);
      }
      const body = encodeGetStatusResponse({
        state: 1,
        mode: 0,
        imageState: 0,
        activeSlot: 0,
        imageConfirmed: true,
        version: "smoke",
        portCount: 1,
        lastResetCause: 0,
        healthState: 0,
        modules: [],
      });
      const response = encodeResponse(req.correlationId, "ok", body);
      const responseTopic = topic.replace("/requests/", "/responses/");
      for (const handler of handlers.get(responseTopic) ?? []) {
        handler(response);
      }
    },
    subscribe(topic, handler) {
      const list = handlers.get(topic) ?? [];
      list.push(handler);
      handlers.set(topic, list);
      return () => {
        const next = (handlers.get(topic) ?? []).filter((h) => h !== handler);
        handlers.set(topic, next);
      };
    },
    async close() {
      handlers.clear();
    },
  };

  const transport = new MqttProtocolTransport(connection, {
    coreId: "11".repeat(32),
    clientId: "mqtt-smoke",
    baseTopic: "spaghetti",
  });
  const client = new SpaghettiClient(transport, { defaultTimeoutMs: 2000 });
  const status = await client.getStatus();
  if (status.version !== "smoke") {
    throw new Error(`unexpected status version ${status.version}`);
  }
  await client.close();
  console.log("node-red-mqtt-smoke: OK");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
