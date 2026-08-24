import { describe, expect, it, vi } from "vitest";
import type { MinimalWebSocket } from "../ws-connection.js";
import { wsToRawMessageConnection } from "../ws-connection.js";

function socketFixture() {
  const listeners = new Set<(data: Uint8Array) => void>();
  const socket: MinimalWebSocket = {
    send: vi.fn(),
    on: (event, listener) => {
      if (event === "message") listeners.add(listener);
    },
    off: (event, listener) => {
      if (event === "message") listeners.delete(listener);
    },
  };
  return { socket, emit: (data: Uint8Array) => listeners.forEach((l) => l(data)), listenerCount: () => listeners.size };
}

describe("wsToRawMessageConnection", () => {
  it("forwards send() straight to the socket", () => {
    const { socket } = socketFixture();
    const connection = wsToRawMessageConnection(socket);
    const bytes = new Uint8Array([1, 2, 3]);
    connection.send(bytes);
    expect(socket.send).toHaveBeenCalledWith(bytes);
  });

  it("delivers incoming messages to the registered handler", () => {
    const { socket, emit } = socketFixture();
    const connection = wsToRawMessageConnection(socket);
    const received: Uint8Array[] = [];
    connection.onMessage((bytes) => received.push(bytes));

    emit(new Uint8Array([9, 9]));

    expect(received).toEqual([new Uint8Array([9, 9])]);
  });

  it("the returned unsubscribe function removes the listener", () => {
    const { socket, emit, listenerCount } = socketFixture();
    const connection = wsToRawMessageConnection(socket);
    const unsubscribe = connection.onMessage(() => {});
    expect(listenerCount()).toBe(1);

    unsubscribe();
    expect(listenerCount()).toBe(0);

    const received: Uint8Array[] = [];
    connection.onMessage((bytes) => received.push(bytes));
    unsubscribe(); // unsubscribing the first (already-removed) handler again must not affect the second
    emit(new Uint8Array([1]));
    expect(received).toHaveLength(1);
  });
});
