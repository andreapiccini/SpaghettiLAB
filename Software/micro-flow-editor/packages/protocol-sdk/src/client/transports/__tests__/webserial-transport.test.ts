import { describe, expect, it } from "vitest";
import { FRAME_KIND_EVENT, FRAME_KIND_REQUEST, FRAME_KIND_RESPONSE, frameStreamMessage, StreamFrameDecoder } from "../framing.js";
import { FakeRawByteStreamConnection } from "../fakes/fake-raw-byte-stream-connection.js";
import { WebSerialProtocolTransport } from "../webserial-transport.js";

describe("StreamFrameDecoder", () => {
  it("decodes one complete frame delivered in a single chunk", () => {
    const decoder = new StreamFrameDecoder();
    const inner = new Uint8Array([1, 2, 3]);
    const frames = decoder.push(frameStreamMessage(FRAME_KIND_RESPONSE, inner));
    expect(frames).toEqual([{ kind: FRAME_KIND_RESPONSE, bytes: inner }]);
  });

  it("reassembles a frame split across multiple chunks", () => {
    const decoder = new StreamFrameDecoder();
    const inner = new Uint8Array([9, 8, 7, 6, 5]);
    const whole = frameStreamMessage(FRAME_KIND_EVENT, inner);

    expect(decoder.push(whole.slice(0, 3))).toEqual([]);
    expect(decoder.push(whole.slice(3, 6))).toEqual([]);
    const frames = decoder.push(whole.slice(6));
    expect(frames).toEqual([{ kind: FRAME_KIND_EVENT, bytes: inner }]);
  });

  it("splits two frames merged into a single chunk", () => {
    const decoder = new StreamFrameDecoder();
    const first = frameStreamMessage(FRAME_KIND_RESPONSE, new Uint8Array([1]));
    const second = frameStreamMessage(FRAME_KIND_EVENT, new Uint8Array([2, 3]));
    const merged = new Uint8Array(first.length + second.length);
    merged.set(first, 0);
    merged.set(second, first.length);

    const frames = decoder.push(merged);

    expect(frames).toEqual([
      { kind: FRAME_KIND_RESPONSE, bytes: new Uint8Array([1]) },
      { kind: FRAME_KIND_EVENT, bytes: new Uint8Array([2, 3]) },
    ]);
  });
});

describe("WebSerialProtocolTransport", () => {
  it("writes a length-prefixed request frame", async () => {
    const connection = new FakeRawByteStreamConnection();
    const transport = new WebSerialProtocolTransport(connection);
    const payload = new Uint8Array([1, 2, 3]);

    await transport.send(payload);

    expect(connection.written).toEqual([frameStreamMessage(FRAME_KIND_REQUEST, payload)]);
  });

  it("dispatches response/event frames delivered across split chunks", () => {
    const connection = new FakeRawByteStreamConnection();
    const transport = new WebSerialProtocolTransport(connection);
    const responses: Uint8Array[] = [];
    const events: Uint8Array[] = [];
    transport.onResponse((bytes) => responses.push(bytes));
    transport.onEvent((bytes) => events.push(bytes));

    const frame = frameStreamMessage(FRAME_KIND_RESPONSE, new Uint8Array([0xaa, 0xbb]));
    connection.deliver(frame.slice(0, 4));
    connection.deliver(frame.slice(4));

    expect(responses).toEqual([new Uint8Array([0xaa, 0xbb])]);
    expect(events).toHaveLength(0);
  });
});
