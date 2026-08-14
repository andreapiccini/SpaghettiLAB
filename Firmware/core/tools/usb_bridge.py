"""USB Serial/JTAG → localhost WebSocket bridge for browsers without Web Serial.

Safari (and Tauri-on-macOS WKWebView) cannot call navigator.serial. This
process opens Core USB ports with Protocol V1 stream framing and exposes the
same message-oriented WebSocket shape React Flow already uses
(WebSocketProtocolTransport: raw request envelopes in, kind-byte + envelope
out). Bind 127.0.0.1 only.

WebSocket paths:
  /list              text JSON {cores: [...]} then close
  /core/<device_id>  binary Protocol V1 session
"""

from __future__ import annotations

import argparse
import asyncio
import json
import logging
import sys
import threading
import time
from dataclasses import dataclass
from typing import Any

from tools.device import open_serial_without_reset, serial_ports
from tools.spaghetti_protocol import (
    Operation,
    decode_get_status_response,
    decode_response,
    encode_request,
)

logger = logging.getLogger("spaghetti.usb_bridge")

KIND_RESPONSE = 0x00
KIND_EVENT = 0x01
KIND_REQUEST = 0x02
HEADER_SIZE = 5
ENVELOPE_MAX = 512 + 64
DEFAULT_LISTEN = "127.0.0.1:8766"
IDENTIFY_TIMEOUT_S = 4.0


def encode_usb_frame(kind: int, envelope: bytes) -> bytes:
    if len(envelope) > ENVELOPE_MAX:
        raise ValueError("envelope too large")
    return bytes([kind]) + len(envelope).to_bytes(4, "big") + envelope


def pop_usb_frame(buffer: bytearray) -> tuple[int, bytes] | None:
    """Reassemble one response/event frame; skip leftover Shell bytes."""
    while len(buffer) >= 1:
        kind = buffer[0]
        if kind not in (KIND_RESPONSE, KIND_EVENT):
            del buffer[0]
            continue
        if len(buffer) < HEADER_SIZE:
            return None
        length = int.from_bytes(buffer[1:5], "big")
        if length > ENVELOPE_MAX:
            del buffer[0]
            continue
        if len(buffer) < HEADER_SIZE + length:
            return None
        envelope = bytes(buffer[HEADER_SIZE : HEADER_SIZE + length])
        del buffer[: HEADER_SIZE + length]
        return kind, envelope
    return None


@dataclass
class BoundCore:
    device_id_hex: str
    device_name: str
    version: str
    port: str
    connection: Any
    write_lock: threading.Lock


def _close_quiet(connection: Any) -> None:
    try:
        connection.close()
    except Exception:  # noqa: BLE001
        pass


def _identify_sync(port: str) -> BoundCore | None:
    try:
        import serial as serial_mod
    except ImportError:
        logger.error("pyserial missing; run make host-tools")
        return None

    try:
        conn = open_serial_without_reset(serial_mod, port, 115200)
    except Exception as exc:  # noqa: BLE001
        logger.debug("skip %s: %s", port, exc)
        return None

    buffer = bytearray()
    try:
        conn.reset_input_buffer()
        envelope = encode_request(1, Operation.GET_STATUS, b"")
        conn.write(encode_usb_frame(KIND_REQUEST, envelope))
        conn.flush()
        deadline = time.monotonic() + IDENTIFY_TIMEOUT_S
        while time.monotonic() < deadline:
            waiting = conn.in_waiting
            chunk = conn.read(waiting if waiting else 1)
            if chunk:
                buffer.extend(chunk)
            while True:
                parsed = pop_usb_frame(buffer)
                if parsed is None:
                    break
                kind, body = parsed
                if kind != KIND_RESPONSE:
                    continue
                _corr, name, _code, payload = decode_response(body)
                if name != "ok":
                    _close_quiet(conn)
                    return None
                status = decode_get_status_response(payload)
                if status.device_id:
                    device_id = status.device_id.hex()
                else:
                    device_id = f"usb-{port.rsplit('/', 1)[-1]}"
                return BoundCore(
                    device_id_hex=device_id,
                    device_name=status.device_name or "",
                    version=status.version,
                    port=port,
                    connection=conn,
                    write_lock=threading.Lock(),
                )
        _close_quiet(conn)
        return None
    except Exception as exc:  # noqa: BLE001
        logger.debug("identify failed on %s: %s", port, exc)
        _close_quiet(conn)
        return None


class UsbBridge:
    def __init__(self) -> None:
        self.cores: dict[str, BoundCore] = {}
        self._busy: set[str] = set()
        self._lock = threading.Lock()
        self._scan_lock = threading.Lock()

    def refresh(self) -> list[BoundCore]:
        with self._scan_lock:
            return self._refresh_locked()

    def _refresh_locked(self) -> list[BoundCore]:
        present = set(serial_ports())
        with self._lock:
            stale = [
                device_id
                for device_id, core in self.cores.items()
                if core.port not in present and device_id not in self._busy
            ]
            for device_id in stale:
                _close_quiet(self.cores[device_id].connection)
                del self.cores[device_id]
            known_ports = {core.port for core in self.cores.values()}

        for path in present:
            if path in known_ports:
                continue
            core = _identify_sync(path)
            if core is None:
                continue
            with self._lock:
                previous = self.cores.get(core.device_id_hex)
                if previous is not None and previous.port != core.port:
                    if core.device_id_hex not in self._busy:
                        _close_quiet(previous.connection)
                self.cores[core.device_id_hex] = core
                known_ports.add(path)
            logger.info(
                "core %s name=%s port=%s",
                core.device_id_hex[:12],
                core.device_name or "-",
                path,
            )
        with self._lock:
            return list(self.cores.values())

    def cores_document(self) -> dict[str, Any]:
        cores = self.refresh()
        return {
            "cores": [
                {
                    "deviceIdHex": core.device_id_hex,
                    "deviceName": core.device_name,
                    "version": core.version,
                    "port": core.port,
                }
                for core in cores
            ]
        }

    def get(self, device_id_hex: str) -> BoundCore | None:
        with self._lock:
            return self.cores.get(device_id_hex)

    def try_acquire(self, device_id_hex: str) -> BoundCore | None:
        with self._lock:
            core = self.cores.get(device_id_hex)
            if core is None or device_id_hex in self._busy:
                return None
            self._busy.add(device_id_hex)
            return core

    def release(self, device_id_hex: str) -> None:
        with self._lock:
            self._busy.discard(device_id_hex)


def _read_serial_chunks(
    connection: Any,
    stop: threading.Event,
    queue: asyncio.Queue[bytes],
    loop: asyncio.AbstractEventLoop,
) -> None:
    try:
        while not stop.is_set():
            waiting = connection.in_waiting
            chunk = connection.read(waiting if waiting else 1)
            if chunk:
                loop.call_soon_threadsafe(queue.put_nowait, bytes(chunk))
    except Exception:  # noqa: BLE001
        loop.call_soon_threadsafe(queue.put_nowait, b"")


async def _pipe_core(websocket: Any, core: BoundCore) -> None:
    stop = threading.Event()
    incoming: asyncio.Queue[bytes] = asyncio.Queue()
    loop = asyncio.get_running_loop()
    reader = threading.Thread(
        target=_read_serial_chunks,
        args=(core.connection, stop, incoming, loop),
        daemon=True,
    )
    reader.start()
    buffer = bytearray()

    async def pump_serial() -> None:
        while True:
            chunk = await incoming.get()
            if not chunk:
                return
            buffer.extend(chunk)
            while True:
                parsed = pop_usb_frame(buffer)
                if parsed is None:
                    break
                kind, envelope = parsed
                await websocket.send(bytes([kind]) + envelope)

    serial_task = asyncio.create_task(pump_serial())
    try:
        async for message in websocket:
            if not isinstance(message, (bytes, bytearray)):
                continue
            payload = bytes(message)

            def write() -> None:
                with core.write_lock:
                    core.connection.write(encode_usb_frame(KIND_REQUEST, payload))
                    core.connection.flush()

            try:
                await asyncio.to_thread(write)
            except Exception:
                logger.exception("usb write failed port=%s", core.port)
                break
    finally:
        stop.set()
        serial_task.cancel()
        try:
            await serial_task
        except asyncio.CancelledError:
            pass


def make_handler(bridge: UsbBridge):
    async def handler(websocket: Any, path: str | None = None) -> None:
        from websockets.exceptions import ConnectionClosed

        if path is None:
            request = getattr(websocket, "request", None)
            path = request.path if request is not None else "/"
        path = path.split("?", 1)[0]
        try:
            if path in ("/", "/list"):
                document = await asyncio.to_thread(bridge.cores_document)
                await websocket.send(json.dumps(document))
                return
            if path.startswith("/core/"):
                device_id = path[len("/core/") :].lower()
                core = bridge.get(device_id)
                if core is None:
                    await asyncio.to_thread(bridge.refresh)
                    core = bridge.get(device_id)
                if core is None:
                    await websocket.close(4404, "unknown core")
                    return
                acquired = bridge.try_acquire(device_id)
                if acquired is None:
                    await websocket.close(4409, "core busy")
                    return
                try:
                    await _pipe_core(websocket, acquired)
                except ConnectionClosed:
                    pass
                finally:
                    bridge.release(device_id)
                return
            await websocket.close(4404, "unknown path")
        except ConnectionClosed:
            pass

    return handler


async def run_server(listen: str) -> None:
    from websockets.asyncio.server import serve

    host, port_s = listen.rsplit(":", 1)
    port = int(port_s)
    bridge = UsbBridge()
    await asyncio.to_thread(bridge.refresh)
    async with serve(make_handler(bridge), host, port, max_size=4096):
        logger.info(
            "USB bridge on ws://%s:%s  (Safari: keep make monitor closed)",
            host,
            port,
        )
        await asyncio.Future()


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        description="USB Protocol V1 bridge for Safari/React Flow"
    )
    parser.add_argument("--listen", default=DEFAULT_LISTEN, help="loopback host:port")
    parser.add_argument("--verbose", "-v", action="store_true")
    args = parser.parse_args(argv)
    logging.basicConfig(
        level=logging.DEBUG if args.verbose else logging.INFO,
        format="%(levelname)s %(message)s",
    )
    try:
        asyncio.run(run_server(args.listen))
    except KeyboardInterrupt:
        return 0
    return 0


if __name__ == "__main__":
    sys.exit(main())
