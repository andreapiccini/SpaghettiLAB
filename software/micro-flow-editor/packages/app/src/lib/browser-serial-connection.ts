import type { RawByteStreamConnection } from "@spaghettilab/protocol-sdk";

/** The Web Serial surface this adapter actually uses — a real `SerialPort` satisfies it. */
export type UsbSerialPort = {
  readable: ReadableStream<Uint8Array> | null;
  writable: WritableStream<Uint8Array> | null;
  open(options: { baudRate: number }): Promise<void>;
  close(): Promise<void>;
  setSignals?(signals: { dataTerminalReady?: boolean; requestToSend?: boolean }): Promise<void>;
};

export type BrowserSerialConnection = RawByteStreamConnection & {
  close(): Promise<void>;
};

const openByPort = new WeakMap<UsbSerialPort, BrowserSerialConnection>();

/**
 * Wraps a Web Serial port as the `RawByteStreamConnection` `WebSerialProtocolTransport`
 * expects. Reuses an already-open wrapper so probe + connect share one pipe.
 * DTR/RTS stay off so ESP32-C3 USB Serial/JTAG does not reboot on open.
 */
export async function openBrowserSerial(port: UsbSerialPort, baudRate = 115200): Promise<BrowserSerialConnection> {
  const existing = openByPort.get(port);
  if (existing) return existing;

  if (port.readable === null || port.writable === null) {
    await port.open({ baudRate });
    try {
      await port.setSignals?.({ dataTerminalReady: false, requestToSend: false });
    } catch {
      // Some USB-JTAG stacks ignore modem signals; opening still succeeded.
    }
  }

  const reader = port.readable?.getReader();
  const writer = port.writable?.getWriter();
  if (!reader || !writer) {
    throw new Error("La porta USB non è leggibile/scrivibile.");
  }

  const handlers = new Set<(chunk: Uint8Array) => void>();
  let closed = false;

  const readLoop = (async () => {
    try {
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        if (value) {
          for (const handler of handlers) handler(value);
        }
      }
    } catch {
      // Port closed or device unplugged — subscribers just stop receiving.
    }
  })();

  const connection: BrowserSerialConnection = {
    write(bytes) {
      void writer.write(bytes);
    },
    onData(handler) {
      handlers.add(handler);
      return () => {
        handlers.delete(handler);
      };
    },
    async close() {
      if (closed) return;
      closed = true;
      openByPort.delete(port);
      try {
        reader.releaseLock();
      } catch {
        /* already released */
      }
      try {
        writer.releaseLock();
      } catch {
        /* already released */
      }
      await readLoop.catch(() => undefined);
      try {
        await port.close();
      } catch {
        /* already closed */
      }
    },
  };

  openByPort.set(port, connection);
  return connection;
}

export type BrowserSerialApi = {
  getPorts(): Promise<UsbSerialPort[]>;
  requestPort(options?: { filters?: Array<{ usbVendorId: number }> }): Promise<UsbSerialPort>;
};

export function browserSerial(): BrowserSerialApi | null {
  const serial = (navigator as Navigator & { serial?: BrowserSerialApi }).serial;
  return serial ?? null;
}
