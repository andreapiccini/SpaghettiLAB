from __future__ import annotations

import importlib.util
import re
import sys
import threading
import time
from pathlib import Path
from typing import Optional

import serial
from cobs import cobs
from google.protobuf.json_format import MessageToDict


REPO_ROOT = Path(__file__).resolve().parents[2]
PROTO_DIR = REPO_ROOT / "proto"
GENERATED_DIR = PROTO_DIR / "generated"
IDENTITY_HEADER = GENERATED_DIR / "sensedial_proto_identity.h"
PYTHON_PROTO_DIR = REPO_ROOT / "firmware" / "tools" / "_generated"
PB2_MODULE_NAME = "sensedial_lowside_pb2"
DEFAULT_PROTOCOL_VERSION = 1
DEFAULT_PROTOCOL_HASH = 0

PROTO_VERSION_RE = re.compile(r"#define\s+SENSEDIAL_LOWSIDE_PROTO_VERSION\s+(\d+)")
PROTO_HASH_RE = re.compile(r"#define\s+SENSEDIAL_LOWSIDE_PROTO_HASH\s+UINT64_C\(0x([0-9A-Fa-f]+)\)")

HOST_COMMANDS = {
    "reboot": "HOST_COMMAND_REBOOT",
    "enter-bootloader": "HOST_COMMAND_ENTER_BOOTLOADER",
    "clear-faults": "HOST_COMMAND_CLEAR_FAULTS",
}

TARGETS = {
    "unspecified": "FIRMWARE_TARGET_UNSPECIFIED",
    "highside": "FIRMWARE_TARGET_HIGHSIDE",
    "lowside": "FIRMWARE_TARGET_LOWSIDE",
}


class BackendError(RuntimeError):
    pass


class NonceGenerator:
    def __init__(self, start: int = 1) -> None:
        self._next = start

    def take(self) -> int:
        value = self._next
        self._next += 1
        return value

    def peek(self) -> int:
        return self._next


def parse_identity() -> tuple[int, int]:
    if not IDENTITY_HEADER.exists():
        return DEFAULT_PROTOCOL_VERSION, DEFAULT_PROTOCOL_HASH

    text = IDENTITY_HEADER.read_text(encoding="utf-8")
    version_match = PROTO_VERSION_RE.search(text)
    hash_match = PROTO_HASH_RE.search(text)
    version = int(version_match.group(1)) if version_match else DEFAULT_PROTOCOL_VERSION
    proto_hash = int(hash_match.group(1), 16) if hash_match else DEFAULT_PROTOCOL_HASH
    return version, proto_hash


def load_pb2():
    generated = PYTHON_PROTO_DIR / "sensedial_lowside_pb2.py"
    if not generated.exists():
        raise BackendError(
            "Python protobuf bindings are missing. Generate them with "
            "`python3 firmware/tools/host_test_tool.py generate-python`."
        )

    sys.path.insert(0, str(PYTHON_PROTO_DIR))
    spec = importlib.util.spec_from_file_location(PB2_MODULE_NAME, generated)
    if spec is None or spec.loader is None:
        raise BackendError(f"Could not load protobuf bindings from {generated}")

    module = importlib.util.module_from_spec(spec)
    sys.modules[PB2_MODULE_NAME] = module
    spec.loader.exec_module(module)
    return module


def cobs_frame(payload: bytes) -> bytes:
    return cobs.encode(payload) + b"\x00"


def cobs_unframe(frame: bytes) -> bytes:
    return cobs.decode(frame.rstrip(b"\x00"))


def encode_message(msg) -> bytes:
    return msg.SerializeToString()


def decode_message(message_cls, payload: bytes):
    msg = message_cls()
    msg.ParseFromString(payload)
    return msg


def payload_name(msg) -> str:
    return msg.WhichOneof("payload") or "<none>"


def message_to_dict(msg) -> dict:
    return MessageToDict(msg, preserving_proto_field_name=True, use_integers_for_enums=False)


class SenseDialSerialClient:
    def __init__(self) -> None:
        self.pb2 = load_pb2()
        self.protocol_version, self.protocol_hash = parse_identity()
        self._serial: Optional[serial.Serial] = None
        self._lock = threading.RLock()
        self._nonce_gen = NonceGenerator()
        self._port: Optional[str] = None
        self._baudrate: Optional[int] = None
        self._timeout: Optional[float] = None
        self._host_ready = False

    def status(self) -> dict:
        return {
            "serial_open": bool(self._serial and self._serial.is_open),
            "host_ready": self._host_ready,
            "port": self._port,
            "baudrate": self._baudrate,
            "timeout": self._timeout,
            "protocol_version": self.protocol_version,
            "protocol_hash": str(self.protocol_hash),
            "next_nonce": self._nonce_gen.peek(),
        }

    def _next_nonce(self, forced_nonce: Optional[int]) -> int:
        if forced_nonce is not None:
            return forced_nonce
        return self._nonce_gen.take()

    def _ensure_open(self, port: str, baudrate: int, timeout: float) -> None:
        if (
            self._serial is not None
            and self._serial.is_open
            and self._port == port
            and self._baudrate == baudrate
            and self._timeout == timeout
        ):
            return

        self.close()

        try:
            self._serial = serial.Serial(port=port, baudrate=baudrate, timeout=timeout)
        except serial.SerialException as exc:
            raise BackendError(f"Could not open serial port {port}: {exc}") from exc

        self._port = port
        self._baudrate = baudrate
        self._timeout = timeout
        self._host_ready = False
        time.sleep(2.0)

    def close(self) -> None:
        if self._serial is not None:
            try:
                self._serial.close()
            finally:
                self._serial = None
        self._host_ready = False

    def _send(self, msg) -> None:
        if self._serial is None:
            raise BackendError("Serial port is not open.")

        frame = cobs_frame(encode_message(msg))
        try:
            self._serial.write(frame)
            self._serial.flush()
        except serial.SerialException as exc:
            raise BackendError(f"Serial write failed: {exc}") from exc

    def _iter_frames(self, deadline: float):
        if self._serial is None:
            raise BackendError("Serial port is not open.")

        while time.monotonic() < deadline:
            try:
                raw = self._serial.read_until(b"\x00")
            except serial.SerialException as exc:
                raise BackendError(f"Serial read failed: {exc}") from exc

            if not raw:
                continue
            if not raw.endswith(b"\x00"):
                continue
            yield raw

    def _wait_for_message(self, response_timeout: float, predicate):
        deadline = time.monotonic() + response_timeout
        last_seen = None

        for frame in self._iter_frames(deadline):
            try:
                msg = decode_message(self.pb2.ToHost, cobs_unframe(frame))
            except Exception as exc:
                raise BackendError(f"Malformed incoming frame: {exc}") from exc

            last_seen = msg
            if predicate(msg):
                return msg

        if last_seen is None:
            raise BackendError(f"No matching response received within {response_timeout:.1f}s.")
        raise BackendError(
            f"No matching response received within {response_timeout:.1f}s. "
            f"Last payload seen: {payload_name(last_seen)}."
        )

    def _build_protocol_info(self, nonce: int, protocol_version: int, protocol_hash: int):
        msg = self.pb2.FromHost()
        msg.protocol_version = protocol_version
        msg.nonce = nonce
        msg.protocol_info.protocol_version = protocol_version
        msg.protocol_info.protocol_hash = protocol_hash
        return msg

    def _build_request_state(
        self,
        nonce: int,
        protocol_version: int,
        include_highside_status: bool,
        include_lowside_status: bool,
        include_fw_update_status: bool,
    ):
        msg = self.pb2.FromHost()
        msg.protocol_version = protocol_version
        msg.nonce = nonce
        msg.request_state.include_highside_status = include_highside_status
        msg.request_state.include_lowside_status = include_lowside_status
        msg.request_state.include_fw_update_status = include_fw_update_status
        return msg

    def _build_host_command(self, nonce: int, protocol_version: int, command_name: str, target_name: str):
        if command_name not in HOST_COMMANDS:
            raise BackendError(f"Unsupported host command: {command_name}")
        if target_name not in TARGETS:
            raise BackendError(f"Unsupported target: {target_name}")

        msg = self.pb2.FromHost()
        msg.protocol_version = protocol_version
        msg.nonce = nonce
        msg.host_command.command = getattr(self.pb2, HOST_COMMANDS[command_name])
        msg.host_command.target = getattr(self.pb2, TARGETS[target_name])
        return msg

    def connect(
        self,
        *,
        port: str,
        baudrate: int,
        timeout: float,
        response_timeout: float,
        protocol_version: Optional[int] = None,
        protocol_hash: Optional[int] = None,
        nonce: Optional[int] = None,
    ) -> dict:
        with self._lock:
            self._ensure_open(port, baudrate, timeout)
            nonce_value = self._next_nonce(nonce)
            protocol_version = self.protocol_version if protocol_version is None else protocol_version
            protocol_hash = self.protocol_hash if protocol_hash is None else protocol_hash

            msg = self._build_protocol_info(nonce_value, protocol_version, protocol_hash)
            self._send(msg)

            ack = self._wait_for_message(
                response_timeout,
                lambda incoming: payload_name(incoming) == "ack" and incoming.ack.nonce == nonce_value,
            )
            self._host_ready = True

            return {
                "sent": message_to_dict(msg),
                "received": message_to_dict(ack),
                "matched_payload": "ack",
                "host_ready": self._host_ready,
            }

    def request_state(
        self,
        *,
        port: str,
        baudrate: int,
        timeout: float,
        response_timeout: float,
        protocol_version: Optional[int] = None,
        nonce: Optional[int] = None,
        auto_connect: bool = False,
        include_highside_status: bool = True,
        include_lowside_status: bool = True,
        include_fw_update_status: bool = True,
    ) -> dict:
        with self._lock:
            self._ensure_open(port, baudrate, timeout)
            if auto_connect and not self._host_ready:
                self.connect(
                    port=port,
                    baudrate=baudrate,
                    timeout=timeout,
                    response_timeout=response_timeout,
                )

            nonce_value = self._next_nonce(nonce)
            protocol_version = self.protocol_version if protocol_version is None else protocol_version
            msg = self._build_request_state(
                nonce_value,
                protocol_version,
                include_highside_status,
                include_lowside_status,
                include_fw_update_status,
            )
            self._send(msg)

            host_state = self._wait_for_message(
                response_timeout,
                lambda incoming: payload_name(incoming) == "host_state" and incoming.nonce == nonce_value,
            )
            return {
                "sent": message_to_dict(msg),
                "received": message_to_dict(host_state),
                "matched_payload": "host_state",
                "host_ready": self._host_ready,
            }

    def host_command(
        self,
        *,
        port: str,
        baudrate: int,
        timeout: float,
        response_timeout: float,
        protocol_version: Optional[int] = None,
        nonce: Optional[int] = None,
        auto_connect: bool = False,
        command: str,
        target: str = "lowside",
    ) -> dict:
        with self._lock:
            self._ensure_open(port, baudrate, timeout)
            if auto_connect and not self._host_ready:
                self.connect(
                    port=port,
                    baudrate=baudrate,
                    timeout=timeout,
                    response_timeout=response_timeout,
                )

            nonce_value = self._next_nonce(nonce)
            protocol_version = self.protocol_version if protocol_version is None else protocol_version
            msg = self._build_host_command(nonce_value, protocol_version, command, target)
            self._send(msg)
            return {
                "sent": message_to_dict(msg),
                "received": None,
                "matched_payload": None,
                "host_ready": self._host_ready,
            }

    def listen_next(
        self,
        *,
        port: str,
        baudrate: int,
        timeout: float,
        response_timeout: float,
    ) -> dict:
        with self._lock:
            self._ensure_open(port, baudrate, timeout)
            msg = self._wait_for_message(response_timeout, lambda incoming: True)
            return {
                "received": message_to_dict(msg),
                "matched_payload": payload_name(msg),
                "host_ready": self._host_ready,
            }
