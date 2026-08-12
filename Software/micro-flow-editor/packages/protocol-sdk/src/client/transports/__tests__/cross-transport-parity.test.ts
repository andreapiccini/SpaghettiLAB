/**
 * S023's core verification: "MQTT e WebSocket/BLE, alimentati con lo stesso
 * golden vector, producono esattamente gli stessi oggetti di dominio." Feeds
 * the identical encoded envelope through both adapters via a real
 * `SpaghettiClient` and asserts the decoded domain object is deep-equal —
 * proving neither adapter alters, reinterprets, or adds any Config/catalog
 * logic of its own (S023's other requirement) on top of the shared S021/S022
 * codec and client.
 */
import { describe, expect, it } from "vitest";
import { decodeRequest, encodeResponse, ProtocolStatus } from "../../../envelope.js";
import { encodeGetStatusResponse, type GetStatusResponse } from "../../../operations/index.js";
import { SpaghettiClient } from "../../spaghetti-client.js";
import { FakeMqttConnection } from "../fakes/fake-mqtt-connection.js";
import { FakeRawMessageConnection } from "../fakes/fake-raw-message-connection.js";
import { FRAME_KIND_RESPONSE, frameMessage } from "../framing.js";
import { MqttProtocolTransport } from "../mqtt-transport.js";
import { WebSocketProtocolTransport } from "../websocket-transport.js";

const STATUS_FIXTURE: GetStatusResponse = {
  state: 1,
  mode: 1,
  imageState: 0,
  activeSlot: 0,
  imageConfirmed: true,
  version: "1.2.3",
  portCount: 2,
  lastResetCause: 0,
  healthState: 1,
  modules: [
    { key: 10, id: 1, portId: 0, state: 1, endpointKind: 2, endpointValueRaw: 64, typeId: "ina219" },
  ],
};

describe("cross-transport parity", () => {
  it("MQTT and WebSocket adapters, fed the same golden envelope, produce identical decoded domain objects", async () => {
    const mqttConnection = new FakeMqttConnection();
    const mqttTransport = new MqttProtocolTransport(mqttConnection, {
      request: "req",
      response: "res",
      event: "evt",
    });
    const mqttClient = new SpaghettiClient(mqttTransport);

    const wsConnection = new FakeRawMessageConnection();
    const wsTransport = new WebSocketProtocolTransport(wsConnection);
    const wsClient = new SpaghettiClient(wsTransport);

    const mqttPromise = mqttClient.getStatus();
    const wsPromise = wsClient.getStatus();

    const mqttCorrelationId = decodeRequest(mqttConnection.published[0]!.payload).correlationId;
    const wsCorrelationId = decodeRequest(wsConnection.sent[0]!).correlationId;

    const payload = encodeGetStatusResponse(STATUS_FIXTURE);

    mqttConnection.deliver(
      "res",
      encodeResponse({ correlationId: mqttCorrelationId, status: ProtocolStatus.OK, payload }),
    );
    wsConnection.deliver(
      frameMessage(
        FRAME_KIND_RESPONSE,
        encodeResponse({ correlationId: wsCorrelationId, status: ProtocolStatus.OK, payload }),
      ),
    );

    const [mqttResult, wsResult] = await Promise.all([mqttPromise, wsPromise]);

    expect(mqttResult).toEqual(STATUS_FIXTURE);
    expect(wsResult).toEqual(STATUS_FIXTURE);
    expect(mqttResult).toEqual(wsResult);
  });
});
