"""USB Serial/JTAG → WebSocket bridge: framing and loopback session."""

from __future__ import annotations

import asyncio
import json
import threading
import time
import unittest
from unittest import mock

from websockets.asyncio.client import connect as ws_connect
from websockets.asyncio.server import serve

from tools.spaghetti_protocol import (
    CoreStatus,
    Operation,
    decode_request,
    encode_get_status_response,
    encode_request,
    encode_response,
)
from tools.usb_bridge import (
    KIND_REQUEST,
    KIND_RESPONSE,
    BoundCore,
    UsbBridge,
    encode_usb_frame,
    make_handler,
    pop_usb_frame,
)


DEVICE_ID = bytes(range(32))
DEVICE_ID_HEX = DEVICE_ID.hex()


class FramingTest(unittest.TestCase):
    def test_roundtrip(self) -> None:
        envelope = encode_request(7, Operation.GET_STATUS, b"")
        frame = encode_usb_frame(KIND_RESPONSE, envelope)
        buffer = bytearray(frame)
        parsed = pop_usb_frame(buffer)
        self.assertEqual(parsed, (KIND_RESPONSE, envelope))
        self.assertEqual(buffer, b"")

    def test_skips_shell_junk(self) -> None:
        envelope = encode_request(3, Operation.GET_STATUS, b"")
        frame = encode_usb_frame(KIND_RESPONSE, envelope)
        buffer = bytearray(b"uart:~$ \r\n") + frame
        parsed = pop_usb_frame(buffer)
        self.assertEqual(parsed, (KIND_RESPONSE, envelope))

    def test_incomplete_waits(self) -> None:
        envelope = encode_request(3, Operation.GET_STATUS, b"")
        frame = encode_usb_frame(KIND_RESPONSE, envelope)
        buffer = bytearray(frame[:4])
        self.assertIsNone(pop_usb_frame(buffer))
        self.assertEqual(len(buffer), 4)
        buffer.extend(frame[4:])
        parsed = pop_usb_frame(buffer)
        self.assertEqual(parsed, (KIND_RESPONSE, envelope))

    def test_oversize_length_is_skipped(self) -> None:
        # High length byte is not a frame kind, so skip-1 resyncs on the real frame.
        bogus = bytes([KIND_RESPONSE, 0x80, 0x00, 0x00, 0x10])
        envelope = encode_request(1, Operation.GET_STATUS, b"")
        frame = encode_usb_frame(KIND_RESPONSE, envelope)
        buffer = bytearray(bogus + frame)
        parsed = pop_usb_frame(buffer)
        self.assertEqual(parsed, (KIND_RESPONSE, envelope))


class FakeSerial:
    def __init__(self) -> None:
        self._rx = bytearray()
        self._lock = threading.Lock()
        self.timeout = 0.05
        self.written = bytearray()

    @property
    def in_waiting(self) -> int:
        with self._lock:
            return len(self._rx)

    def write(self, data: bytes) -> int:
        self.written.extend(data)
        if len(data) < 5 or data[0] != KIND_REQUEST:
            return len(data)
        length = int.from_bytes(data[1:5], "big")
        envelope = data[5 : 5 + length]
        if len(envelope) != length:
            return len(data)
        corr, op, _payload = decode_request(envelope)
        if op != Operation.GET_STATUS:
            return len(data)
        status = CoreStatus(
            version="test",
            device_id=DEVICE_ID,
            device_name="BridgeCore",
        )
        reply = encode_response(corr, "ok", encode_get_status_response(status))
        framed = encode_usb_frame(KIND_RESPONSE, reply)
        with self._lock:
            self._rx.extend(framed)
        return len(data)

    def read(self, size: int) -> bytes:
        deadline = time.monotonic() + self.timeout
        while time.monotonic() < deadline:
            with self._lock:
                if self._rx:
                    chunk = bytes(self._rx[:size])
                    del self._rx[:size]
                    return chunk
            time.sleep(0.005)
        return b""

    def flush(self) -> None:
        return None

    def reset_input_buffer(self) -> None:
        with self._lock:
            self._rx.clear()

    def close(self) -> None:
        return None


def _run(coro):
    return asyncio.run(coro)


class BridgeSessionTest(unittest.TestCase):
    def test_list_and_core_pipe(self) -> None:
        async def scenario() -> None:
            serial = FakeSerial()
            bridge = UsbBridge()
            bridge.cores[DEVICE_ID_HEX] = BoundCore(
                device_id_hex=DEVICE_ID_HEX,
                device_name="BridgeCore",
                version="test",
                port="/dev/cu.usbmodem-fake",
                connection=serial,
                write_lock=threading.Lock(),
            )
            async with serve(make_handler(bridge), "127.0.0.1", 0, max_size=4096) as server:
                port = server.sockets[0].getsockname()[1]
                origin = f"ws://127.0.0.1:{port}"
                async with ws_connect(f"{origin}/list") as ws:
                    document = json.loads(await ws.recv())
                self.assertEqual(document["cores"][0]["deviceIdHex"], DEVICE_ID_HEX)
                self.assertEqual(document["cores"][0]["deviceName"], "BridgeCore")

                request = encode_request(9, Operation.GET_STATUS, b"")
                async with ws_connect(f"{origin}/core/{DEVICE_ID_HEX}") as ws:
                    await ws.send(request)
                    frame = await asyncio.wait_for(ws.recv(), timeout=2)
                self.assertIsInstance(frame, (bytes, bytearray))
                self.assertEqual(frame[0], KIND_RESPONSE)
                envelope = bytes(frame[1:])
                from tools.spaghetti_protocol import decode_response, decode_get_status_response

                _corr, name, _code, payload = decode_response(envelope)
                self.assertEqual(name, "ok")
                status = decode_get_status_response(payload)
                self.assertEqual(status.device_id, DEVICE_ID)
                self.assertEqual(status.device_name, "BridgeCore")

        with mock.patch(
            "tools.usb_bridge.serial_ports",
            return_value=["/dev/cu.usbmodem-fake"],
        ):
            _run(scenario())


if __name__ == "__main__":
    unittest.main()
