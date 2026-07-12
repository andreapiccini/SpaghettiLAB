#!/usr/bin/env python3
from __future__ import annotations

import json
import os
import atexit
import signal
import sys
import threading
import time
from http import HTTPStatus
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any
from urllib.parse import urlparse

import serial
from serial.tools import list_ports

FIRMWARE_ROOT = Path(__file__).resolve().parents[3] / "firmware"
TOOLS_DIR = FIRMWARE_ROOT / "tools"
sys.path.insert(0, str(TOOLS_DIR))

import host_test_tool as host  # noqa: E402


class SenseDialBridge:
    def __init__(self) -> None:
        self.pb2 = None
        self.proto_version = 1
        self.proto_hash = 0
        self._refresh_protocol()
        self.serial: serial.Serial | None = None
        self.port: str | None = None
        self.nonces = host.NonceGenerator(1)
        self.position_nonce = 1
        self.lock = threading.RLock()
        self.last_seen_monotonic: float | None = None
        self.heartbeat_failures = 0

    def _refresh_protocol(self) -> None:
        # Firmware builds may regenerate the schema while the Electron backend
        # remains alive. Reload before every serial handshake so a PC-only
        # session never keeps using a stale protocol hash.
        host.generate_python_bindings(host.DEFAULT_PYTHON_OUT)
        self.pb2 = host.load_pb2(host.DEFAULT_PYTHON_OUT)
        self.proto_version, self.proto_hash = host.parse_identity()
        self.proto_version = self.proto_version or 1
        self.proto_hash = self.proto_hash or 0

    def ports(self) -> list[dict[str, Any]]:
        return [
            {
                "device": item.device,
                "description": item.description,
                "vid": item.vid,
                "pid": item.pid,
            }
            for item in list_ports.comports()
            if "usb" in item.device.lower() or item.vid is not None
        ]

    def close(self) -> None:
        with self.lock:
            if self.serial is not None:
                try:
                    if self.serial.is_open:
                        self.serial.close()
                finally:
                    print("[serial] released", flush=True)
                    self.serial = None
                    self.port = None
                    self.last_seen_monotonic = None

    def connect(self, port: str) -> dict[str, Any]:
        with self.lock:
            self.close()
            self._refresh_protocol()
            self.serial = host.open_serial(port, 115200, 0.1)
            self.port = port
            try:
                self.serial.reset_input_buffer()
                self.serial.reset_output_buffer()
                time.sleep(1.8)
                deadline = time.monotonic() + 6.0
                attempt = 0
                while time.monotonic() < deadline:
                    attempt += 1
                    nonce = self.nonces.take()
                    message = host.build_protocol_info(
                        self.pb2,
                        nonce,
                        self.proto_version,
                        self.proto_hash,
                    )
                    print(f"[connect] handshake attempt {attempt} nonce={nonce}", flush=True)
                    host.send_frame(self.serial, host.cobs_frame(host.encode_message(message)))
                    if host.wait_for_ack(self.serial, self.pb2, nonce, 1.2) == 0:
                        self.last_seen_monotonic = time.monotonic()
                        self.heartbeat_failures = 0
                        return {"connected": True, "port": self.port}
                raise RuntimeError("The device did not complete the protocol handshake")
            except Exception:
                self.close()
                raise

    def require_serial(self) -> serial.Serial:
        if self.serial is None or not self.serial.is_open:
            raise RuntimeError("SenseDial is not connected")
        return self.serial

    def _exchange(
        self,
        message: Any,
        expected: str,
        timeout: float = 2.0,
        log_prefix: str | None = None,
    ) -> dict[str, Any]:
        ser = self.require_serial()
        host.send_frame(ser, host.cobs_frame(host.encode_message(message)))
        deadline = time.monotonic() + timeout
        logs: list[str] = []
        for frame in host.iter_frames(ser, deadline):
            incoming = host.decode_to_host_frame(frame, self.pb2)
            payload = host.payload_name(incoming)
            if payload == "log":
                logs.append(incoming.log.msg)
                if log_prefix is not None:
                    print(f"{log_prefix} {incoming.log.msg}", flush=True)
                continue
            if payload == expected and incoming.nonce == message.nonce:
                self.last_seen_monotonic = time.monotonic()
                self.heartbeat_failures = 0
                result = host.message_data(incoming)
                result["logs"] = logs
                return result
        raise TimeoutError(f"No {expected} response received")

    def _disconnect_lost_device(self, reason: Exception) -> None:
        port = self.port
        print(f"[heartbeat] lost SenseDial on {port}: {reason}", flush=True)
        self.close()

    def status(self) -> dict[str, Any]:
        with self.lock:
            try:
                message = host.build_request_state(
                    self.pb2, self.nonces.take(), self.proto_version, True, True, True
                )
                result = {
                    "connected": True,
                    "port": self.port,
                    "last_seen_ms": 0,
                    "state": self._exchange(message, "host_state", 1.25),
                }
                self.heartbeat_failures = 0
                return result
            except Exception as exc:
                self.heartbeat_failures += 1
                if self.heartbeat_failures >= 3:
                    self._disconnect_lost_device(exc)
                    raise RuntimeError("SenseDial heartbeat lost; reconnect the device") from exc
                return {
                    "connected": True,
                    "port": self.port,
                    "degraded": True,
                    "missed_heartbeats": self.heartbeat_failures,
                }

    def dial_state(self) -> dict[str, Any]:
        with self.lock:
            message = host.build_request_dial_state(
                self.pb2, self.nonces.take(), self.proto_version
            )
            return self._exchange(message, "dial_state", 0.5)

    def apply_config(self, config: dict[str, Any]) -> dict[str, Any]:
        with self.lock:
            ser = self.require_serial()
            nonce = self.nonces.take()
            message = host.build_host_dial_config(
                self.pb2,
                nonce,
                self.proto_version,
                config,
                self.position_nonce,
            )
            self.position_nonce = (self.position_nonce + 1) & 0xFFFFFFFF
            if self.position_nonce == 0:
                self.position_nonce = 1
            host.send_frame(ser, host.cobs_frame(host.encode_message(message)))
            deadline = time.monotonic() + 2.0
            apply_logs: list[str] = []
            for frame in host.iter_frames(ser, deadline):
                incoming = host.decode_to_host_frame(frame, self.pb2)
                if host.payload_name(incoming) == "log":
                    apply_logs.append(incoming.log.msg)
                    print(f"[apply-log] {incoming.log.msg}", flush=True)
                    continue
                if host.payload_name(incoming) == "ack" and incoming.ack.nonce == nonce:
                    expected = message.dial_config.position_nonce
                    verified_state: dict[str, Any] | None = None
                    shared_config: dict[str, Any] = {}
                    try:
                        dial_state = self.dial_state()
                        shared_config = dial_state.get("dial_state", {}).get("config", {})
                    except Exception as exc:
                        print(f"[apply] dial_state read failed: {exc}", flush=True)
                    last_lowside: dict[str, Any] = {}
                    verify_deadline = time.monotonic() + 2.5
                    last_verify_log = 0.0
                    while time.monotonic() < verify_deadline:
                        state_request = host.build_request_state(
                            self.pb2,
                            self.nonces.take(),
                            self.proto_version,
                            False,
                            True,
                            False,
                        )
                        try:
                            now = time.monotonic()
                            log_prefix = "[verify-log]" if now - last_verify_log >= 0.5 else None
                            state = self._exchange(state_request, "host_state", 0.35, log_prefix)
                            if log_prefix is not None:
                                last_verify_log = now
                        except TimeoutError:
                            continue
                        lowside = state.get("host_state", {}).get("lowside", {})
                        last_lowside = lowside
                        verified_state = state
                        applied = int(lowside.get("applied_config_nonce", 0))
                        ready = bool(lowside.get("ready", False))
                        fault_active = bool(lowside.get("fault_active", False))
                        calibrated = bool(lowside.get("calibrated", False))
                        if applied == expected:
                            print(
                                "[apply] verified=True "
                                f"expected={expected} "
                                f"applied={applied} "
                                f"shared={shared_config.get('position_nonce')} "
                                f"ready={ready} "
                                f"fault={fault_active} "
                                f"calibrated={calibrated}",
                                flush=True,
                            )
                            return {
                                "ok": True,
                                "verified": True,
                                "position_nonce": expected,
                                "state": state,
                                "shared_config": shared_config,
                                "logs": apply_logs,
                            }
                    print(
                        "[apply] verified=False "
                        f"expected={expected} "
                        f"applied={int(last_lowside.get('applied_config_nonce', 0))} "
                        f"shared={shared_config.get('position_nonce')} "
                        f"ready={bool(last_lowside.get('ready', False))} "
                        f"fault={bool(last_lowside.get('fault_active', False))} "
                        f"calibrated={bool(last_lowside.get('calibrated', False))}",
                        flush=True,
                    )
                    return {
                        "ok": True,
                        "verified": False,
                        "position_nonce": expected,
                        "state": verified_state,
                        "shared_config": shared_config,
                        "logs": apply_logs,
                    }
            raise TimeoutError("No configuration ACK received")

    def _command(self, name: str, timeout: float = 1.5) -> None:
        ser = self.require_serial()
        nonce = self.nonces.take()
        message = host.build_host_command(
            self.pb2, nonce, self.proto_version, name, "lowside"
        )
        host.send_frame(ser, host.cobs_frame(host.encode_message(message)))
        deadline = time.monotonic() + timeout
        for frame in host.iter_frames(ser, deadline):
            incoming = host.decode_to_host_frame(frame, self.pb2)
            if host.payload_name(incoming) == "ack" and incoming.ack.nonce == nonce:
                return
        raise TimeoutError(f"No ACK received for {name}")

    def persist_and_reboot(self) -> dict[str, Any]:
        with self.lock:
            self._command("save-configuration")
            time.sleep(0.45)
            self._command("reboot")
            self.close()
            return {"ok": True, "rebooting": True}

    def restore_defaults_and_reboot(self) -> dict[str, Any]:
        with self.lock:
            self._command("restore-defaults")
            time.sleep(0.45)
            self._command("reboot")
            self.close()
            return {"ok": True, "rebooting": True, "factory_defaults": True}


BRIDGE = SenseDialBridge()


def shutdown_bridge(*_: Any) -> None:
    BRIDGE.close()


def handle_process_signal(signum: int, _frame: Any) -> None:
    shutdown_bridge()
    raise SystemExit(128 + signum)


atexit.register(shutdown_bridge)
signal.signal(signal.SIGTERM, handle_process_signal)
signal.signal(signal.SIGINT, handle_process_signal)


class ApiHandler(BaseHTTPRequestHandler):
    server_version = "SenseDialStudio/0.1"

    def log_message(self, fmt: str, *args: Any) -> None:
        if urlparse(self.path).path in {"/api/status", "/api/dial-state"}:
            return
        print(f"[api] {fmt % args}", flush=True)

    def _json(self, status: int, value: Any) -> None:
        encoded = json.dumps(value).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(encoded)))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.end_headers()
        try:
            self.wfile.write(encoded)
        except (BrokenPipeError, ConnectionResetError):
            pass

    def _body(self) -> dict[str, Any]:
        length = int(self.headers.get("Content-Length", "0"))
        return json.loads(self.rfile.read(length) or b"{}")

    def do_OPTIONS(self) -> None:  # noqa: N802
        self._json(HTTPStatus.NO_CONTENT, {})

    def do_GET(self) -> None:  # noqa: N802
        try:
            path = urlparse(self.path).path
            if path == "/api/health":
                self._json(HTTPStatus.OK, {"ok": True, "connected": BRIDGE.serial is not None})
            elif path == "/api/ports":
                self._json(HTTPStatus.OK, {"ports": BRIDGE.ports(), "connected": BRIDGE.port})
            elif path == "/api/status":
                self._json(HTTPStatus.OK, BRIDGE.status())
            elif path == "/api/dial-state":
                self._json(HTTPStatus.OK, BRIDGE.dial_state())
            else:
                self._json(HTTPStatus.NOT_FOUND, {"error": "Not found"})
        except Exception as exc:
            print(f"[api-error] GET {self.path}: {exc}", flush=True)
            self._json(HTTPStatus.BAD_REQUEST, {"error": str(exc)})

    def do_POST(self) -> None:  # noqa: N802
        try:
            path = urlparse(self.path).path
            body = self._body()
            if path == "/api/connect":
                self._json(HTTPStatus.OK, BRIDGE.connect(str(body["port"])))
            elif path == "/api/disconnect":
                BRIDGE.close()
                self._json(HTTPStatus.OK, {"ok": True})
            elif path == "/api/shutdown":
                BRIDGE.close()
                self._json(HTTPStatus.OK, {"ok": True})
                # shutdown() must run outside the request-serving thread.
                threading.Thread(target=self.server.shutdown, daemon=True).start()
            elif path == "/api/config":
                self._json(HTTPStatus.OK, BRIDGE.apply_config(body))
            elif path == "/api/persist-reboot":
                self._json(HTTPStatus.OK, BRIDGE.persist_and_reboot())
            elif path == "/api/restore-defaults":
                self._json(HTTPStatus.OK, BRIDGE.restore_defaults_and_reboot())
            else:
                self._json(HTTPStatus.NOT_FOUND, {"error": "Not found"})
        except Exception as exc:
            print(f"[api-error] POST {self.path}: {exc}", flush=True)
            self._json(HTTPStatus.BAD_REQUEST, {"error": str(exc)})


class ReusableThreadingHTTPServer(ThreadingHTTPServer):
    allow_reuse_address = True


def main() -> None:
    port = int(os.environ.get("SENSEDIAL_BACKEND_PORT", "8765"))
    server = ReusableThreadingHTTPServer(("127.0.0.1", port), ApiHandler)
    print(f"SenseDial backend listening on http://127.0.0.1:{port}", flush=True)
    try:
        server.serve_forever()
    finally:
        BRIDGE.close()


if __name__ == "__main__":
    main()
