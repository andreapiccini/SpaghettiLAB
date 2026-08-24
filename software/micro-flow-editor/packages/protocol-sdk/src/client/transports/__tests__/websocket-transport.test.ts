import { describe, expect, it } from "vitest";
import { FRAME_KIND_EVENT, FRAME_KIND_RESPONSE, frameMessage } from "../framing.js";
import { FakeRawMessageConnection } from "../fakes/fake-raw-message-connection.js";
import { WebSocketProtocolTransport } from "../websocket-transport.js";

describe("WebSocketProtocolTransport", () => {
  it("sends unframed bytes — always unambiguously a request", async () => {
    const connection = new FakeRawMessageConnection();
    const transport = new WebSocketProtocolTransport(connection);
    const payload = new Uint8Array([1, 2, 3]);

    await transport.send(payload);

    expect(connection.sent).toEqual([payload]);
  });

  it("dispatches a frame with the response kind byte to onResponse only", () => {
    const connection = new FakeRawMessageConnection();
    const transport = new WebSocketProtocolTransport(connection);
    const responses: Uint8Array[] = [];
    const events: Uint8Array[] = [];
    transport.onResponse((bytes) => responses.push(bytes));
    transport.onEvent((bytes) => events.push(bytes));

    const inner = new Uint8Array([0xaa, 0xbb]);
    connection.deliver(frameMessage(FRAME_KIND_RESPONSE, inner));

    expect(responses).toEqual([inner]);
    expect(events).toHaveLength(0);
  });

  it("dispatches a frame with the event kind byte to onEvent only", () => {
    const connection = new FakeRawMessageConnection();
    const transport = new WebSocketProtocolTransport(connection);
    const responses: Uint8Array[] = [];
    const events: Uint8Array[] = [];
    transport.onResponse((bytes) => responses.push(bytes));
    transport.onEvent((bytes) => events.push(bytes));

    const inner = new Uint8Array([0xcc]);
    connection.deliver(frameMessage(FRAME_KIND_EVENT, inner));

    expect(events).toEqual([inner]);
    expect(responses).toHaveLength(0);
  });

  it("silently ignores a frame with an unrecognized kind byte instead of crashing", () => {
    const connection = new FakeRawMessageConnection();
    const transport = new WebSocketProtocolTransport(connection);
    transport.onResponse(() => {
      throw new Error("must not be called");
    });

    expect(() => connection.deliver(new Uint8Array([0x7f, 0x01]))).not.toThrow();
  });

  it("dispose() stops delivering to handlers", () => {
    const connection = new FakeRawMessageConnection();
    const transport = new WebSocketProtocolTransport(connection);
    const responses: Uint8Array[] = [];
    transport.onResponse((bytes) => responses.push(bytes));

    transport.dispose();
    connection.deliver(frameMessage(FRAME_KIND_RESPONSE, new Uint8Array([1])));

    expect(responses).toHaveLength(0);
  });
});
