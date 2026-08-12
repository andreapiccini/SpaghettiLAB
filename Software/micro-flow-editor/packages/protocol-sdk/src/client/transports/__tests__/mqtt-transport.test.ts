import { describe, expect, it } from "vitest";
import { FakeMqttConnection } from "../fakes/fake-mqtt-connection.js";
import { MqttProtocolTransport } from "../mqtt-transport.js";

const TOPICS = { request: "cores/1/request", response: "cores/1/response", event: "cores/1/event" };

describe("MqttProtocolTransport", () => {
  it("publishes send() to the request topic", async () => {
    const connection = new FakeMqttConnection();
    const transport = new MqttProtocolTransport(connection, TOPICS);
    const payload = new Uint8Array([1, 2, 3]);

    await transport.send(payload);

    expect(connection.published).toEqual([{ topic: TOPICS.request, payload }]);
  });

  it("routes messages from the response topic to onResponse handlers only", () => {
    const connection = new FakeMqttConnection();
    const transport = new MqttProtocolTransport(connection, TOPICS);
    const responses: Uint8Array[] = [];
    const events: Uint8Array[] = [];
    transport.onResponse((bytes) => responses.push(bytes));
    transport.onEvent((bytes) => events.push(bytes));

    connection.deliver(TOPICS.response, new Uint8Array([0xaa]));

    expect(responses).toHaveLength(1);
    expect(events).toHaveLength(0);
  });

  it("routes messages from the event topic to onEvent handlers only", () => {
    const connection = new FakeMqttConnection();
    const transport = new MqttProtocolTransport(connection, TOPICS);
    const responses: Uint8Array[] = [];
    const events: Uint8Array[] = [];
    transport.onResponse((bytes) => responses.push(bytes));
    transport.onEvent((bytes) => events.push(bytes));

    connection.deliver(TOPICS.event, new Uint8Array([0xbb]));

    expect(events).toHaveLength(1);
    expect(responses).toHaveLength(0);
  });

  it("unsubscribes cleanly", () => {
    const connection = new FakeMqttConnection();
    const transport = new MqttProtocolTransport(connection, TOPICS);
    const received: Uint8Array[] = [];
    const unsubscribe = transport.onResponse((bytes) => received.push(bytes));

    unsubscribe();
    connection.deliver(TOPICS.response, new Uint8Array([1]));

    expect(received).toHaveLength(0);
  });
});
