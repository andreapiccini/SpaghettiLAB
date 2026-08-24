import type { RawMessageConnection } from "@spaghettilab/protocol-sdk";

/**
 * The browser-native counterpart to `@spaghettilab/node-red-nodes`'
 * `wsToRawMessageConnection()` — that one wraps the `ws` npm package for a
 * Node.js runtime (Node-RED's container); this wraps the browser's own
 * global `WebSocket`, which `@spaghettilab/protocol-sdk`'s
 * `WebSocketProtocolTransport` is equally happy to sit on top of (it only
 * needs `RawMessageConnection`'s two methods, never a concrete library).
 * Resolves once the socket actually opens, so a caller's `CoreSession.connect()`
 * never starts sending requests over a socket that isn't ready yet.
 */
export function connectBrowserWebSocket(url: string): Promise<{ connection: RawMessageConnection; socket: WebSocket }> {
  return new Promise((resolve, reject) => {
    const socket = new WebSocket(url);
    socket.binaryType = "arraybuffer";

    const handleOpen = () => {
      socket.removeEventListener("open", handleOpen);
      socket.removeEventListener("error", handleError);
      resolve({
        socket,
        connection: {
          send(bytes: Uint8Array) {
            socket.send(bytes);
          },
          onMessage(handler: (bytes: Uint8Array) => void) {
            const listener = (event: MessageEvent) => {
              if (event.data instanceof ArrayBuffer) handler(new Uint8Array(event.data));
            };
            socket.addEventListener("message", listener);
            return () => socket.removeEventListener("message", listener);
          },
        },
      });
    };
    const handleError = () => {
      socket.removeEventListener("open", handleOpen);
      socket.removeEventListener("error", handleError);
      reject(new Error(`WebSocket connection to ${url} failed`));
    };

    socket.addEventListener("open", handleOpen);
    socket.addEventListener("error", handleError);
  });
}
