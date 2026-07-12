#!/usr/bin/env python3
from __future__ import annotations

import argparse
import importlib.util
import json
import os
import re
import signal
import sys
from pathlib import Path
from typing import Iterable, Optional
import time

import serial
from cobs import cobs
from google.protobuf.json_format import MessageToDict
from rich.console import Console, Group
from rich.panel import Panel
from rich.text import Text
from rich.tree import Tree


REPO_ROOT = Path(__file__).resolve().parents[2]
PROTO_DIR = REPO_ROOT / "proto"
GENERATED_DIR = PROTO_DIR / "generated"
IDENTITY_HEADER = GENERATED_DIR / "sensedial_proto_identity.h"
DEFAULT_PYTHON_OUT = Path(__file__).resolve().parent / "_generated"
PROTO_FILE = PROTO_DIR / "sensedial_lowside.proto"
PB2_MODULE_NAME = "sensedial_lowside_pb2"
DEFAULT_RESPONSE_TIMEOUT = 1.5
CONSOLE = Console(highlight=False)

PROTO_VERSION_RE = re.compile(r"#define\s+SENSEDIAL_LOWSIDE_PROTO_VERSION\s+(\d+)")
PROTO_HASH_RE = re.compile(r"#define\s+SENSEDIAL_LOWSIDE_PROTO_HASH\s+UINT64_C\(0x([0-9A-Fa-f]+)\)")

HOST_COMMANDS = {
    "reboot": "HOST_COMMAND_REBOOT",
    "enter-bootloader": "HOST_COMMAND_ENTER_BOOTLOADER",
    "clear-faults": "HOST_COMMAND_CLEAR_FAULTS",
    "save-configuration": "HOST_COMMAND_SAVE_CONFIGURATION",
    "restore-defaults": "HOST_COMMAND_RESTORE_DEFAULTS",
}

TARGETS = {
    "unspecified": "FIRMWARE_TARGET_UNSPECIFIED",
    "highside": "FIRMWARE_TARGET_HIGHSIDE",
    "lowside": "FIRMWARE_TARGET_LOWSIDE",
}

SESSION_COMMANDS = {
    "reboot": "reboot",
    "bootloader": "enter-bootloader",
    "clear-faults": "clear-faults",
}


class NonceGenerator:
    def __init__(self, start: int = 1):
        self._next = start

    def take(self) -> int:
        value = self._next
        self._next += 1
        return value


def now_str() -> str:
    return time.strftime("%H:%M:%S")


def key_style_for_depth(depth: int) -> str:
    palette = [
        "bold cyan",
        "bold bright_blue",
        "bold blue",
        "bold magenta",
    ]
    return palette[min(depth, len(palette) - 1)]


def _fix_protocol_hash(data: dict) -> None:
    if "protocol_info" in data and "protocol_hash" in data["protocol_info"]:
        h = int(data["protocol_info"]["protocol_hash"])
        data["protocol_info"]["protocol_hash"] = f"0x{h:016X}"
    if "forwarded_to_host" in data and "message" in data["forwarded_to_host"]:
        _fix_protocol_hash(data["forwarded_to_host"]["message"])
    if "forward_to_highside" in data and "message" in data["forward_to_highside"]:
        _fix_protocol_hash(data["forward_to_highside"]["message"])


def message_data(msg) -> dict:
    data = MessageToDict(msg, preserving_proto_field_name=True, use_integers_for_enums=False)
    _fix_protocol_hash(data)
    return data


def format_tree_scalar(value) -> Text:
    if isinstance(value, str):
        return Text(f'"{value}"', style="green")
    if isinstance(value, bool):
        return Text(str(value).lower(), style="magenta")
    if value is None:
        return Text("null", style="magenta")
    if isinstance(value, (int, float)):
        return Text(str(value), style="yellow")
    return Text(str(value), style="white")


def make_tree_label(name: str, value=None, depth: int = 0) -> Text:
    label = Text()
    label.append(str(name), style=key_style_for_depth(depth))
    if value is not None:
        label.append(": ", style="dim")
        label.append_text(format_tree_scalar(value))
    return label


def append_tree_nodes(tree: Tree, value, depth: int = 0) -> None:
    if isinstance(value, dict):
        for key, child in value.items():
            if isinstance(child, (dict, list)):
                branch = tree.add(make_tree_label(key, depth=depth))
                append_tree_nodes(branch, child, depth + 1)
            else:
                tree.add(make_tree_label(key, child, depth))
        return

    if isinstance(value, list):
        for index, child in enumerate(value):
            name = f"[{index}]"
            if isinstance(child, (dict, list)):
                branch = tree.add(make_tree_label(name, depth=depth))
                append_tree_nodes(branch, child, depth + 1)
            else:
                tree.add(make_tree_label(name, child, depth))
        return

    tree.add(format_tree_scalar(value))


def print_status(message: str, level: str = "info") -> None:
    palette = {
        "info": ("blue", "..."),
        "success": ("green", "+++"),
        "warning": ("yellow", "!!!"),
        "error": ("red", "xxx"),
    }
    color, marker = palette.get(level, ("white", "..."))
    text = Text()
    text.append(marker, style=f"bold {color}")
    text.append(" ")
    text.append(now_str(), style="dim")
    text.append(" ")
    text.append(message, style=color)
    CONSOLE.print(text)


def resolve_nonce(args, nonce_gen: NonceGenerator) -> int:
    if getattr(args, "nonce", None) is not None:
        return args.nonce
    return nonce_gen.take()


def decode_to_host_frame(frame: bytes, pb2):
    payload = cobs_unframe(frame)
    return decode_message(pb2.ToHost, payload)

def wait_for_ack(ser: serial.Serial, pb2, expected_nonce: int, response_timeout: float) -> int:
    deadline = time.monotonic() + response_timeout

    for frame in iter_frames(ser, deadline):
        try:
            msg = decode_to_host_frame(frame, pb2)
        except Exception as exc:
            print(f"Malformed incoming frame: {exc}", file=sys.stderr)
            print(f"  raw: {frame.hex()}", file=sys.stderr)
            continue

        print_message("RX", msg)

        if payload_name(msg) == "request_protocol_info":
            print_status(
                f"Ignoring request_protocol_info during host-driven handshake (nonce={msg.nonce})",
                "warning",
            )
            continue

        if payload_name(msg) == "ack" and msg.ack.nonce == expected_nonce:
            print_status("Handshake complete.", "success")
            return 0

    print_status(
        f"No ACK received within {response_timeout:.1f}s. "
        "The low-side may be disconnected or still waiting for valid protocol_info.",
        "error",
    )
    return 1

def parse_identity() -> tuple[Optional[int], Optional[int]]:
    if not IDENTITY_HEADER.exists():
        return None, None

    text = IDENTITY_HEADER.read_text(encoding="utf-8")
    version_match = PROTO_VERSION_RE.search(text)
    hash_match = PROTO_HASH_RE.search(text)

    version = int(version_match.group(1)) if version_match else None
    proto_hash = int(hash_match.group(1), 16) if hash_match else None
    return version, proto_hash


def find_grpc_tools_include() -> Optional[Path]:
    spec = importlib.util.find_spec("grpc_tools")
    if spec is None or spec.submodule_search_locations is None:
        return None
    for location in spec.submodule_search_locations:
        candidate = Path(location) / "_proto"
        if candidate.exists():
            return candidate
    return None


def find_nanopb_include() -> Optional[Path]:
    env_name = os.environ.get("PIOENV", "lowside")
    candidates = [
        REPO_ROOT / "firmware" / ".pio" / "libdeps" / env_name / "Nanopb" / "generator" / "proto",
    ]

    spec = importlib.util.find_spec("nanopb")
    if spec is not None and spec.submodule_search_locations:
        for location in spec.submodule_search_locations:
            candidates.append(Path(location) / "generator" / "proto")

    home = Path.home()
    candidates.extend(home.glob(".platformio/penv/lib/python*/site-packages/nanopb/generator/proto"))

    for candidate in candidates:
        if (candidate / "nanopb.proto").exists():
            return candidate
    return None


def generate_python_bindings(output_dir: Path) -> Path:
    grpc_tools_protoc = importlib.util.find_spec("grpc_tools.protoc")
    if grpc_tools_protoc is None:
        raise SystemExit(
            "Missing grpcio-tools. Install dependencies first:\n"
            "python3 -m pip install -r firmware/tools/requirements.txt"
        )

    nanopb_include = find_nanopb_include()
    if nanopb_include is None:
        raise SystemExit(
            "Could not find nanopb.proto for Python binding generation.\n"
            "Install the firmware dependencies once with PlatformIO or ensure the nanopb Python package is installed."
        )

    grpc_include = find_grpc_tools_include()
    if grpc_include is None:
        raise SystemExit("Could not locate grpc_tools bundled protobuf includes.")

    output_dir.mkdir(parents=True, exist_ok=True)

    from grpc_tools import protoc

    rc = protoc.main(
        [
            "grpc_tools.protoc",
            f"-I{PROTO_DIR}",
            f"-I{nanopb_include}",
            f"-I{grpc_include}",
            f"--python_out={output_dir}",
            str(nanopb_include / "nanopb.proto"),
            str(PROTO_FILE),
        ]
    )
    if rc != 0:
        raise SystemExit(f"Python protobuf generation failed with exit code {rc}.")

    generated = output_dir / f"{PROTO_FILE.stem}_pb2.py"
    if not generated.exists():
        raise SystemExit(f"Expected generated file not found: {generated}")

    return generated


def load_pb2(output_dir: Path):
    generated = output_dir / f"{PROTO_FILE.stem}_pb2.py"
    if not generated.exists():
        raise SystemExit(
            "Python protobuf bindings are missing.\n"
            f"Generate them with:\npython3 {Path(__file__).name} generate-python"
        )

    sys.path.insert(0, str(output_dir))

    spec = importlib.util.spec_from_file_location(PB2_MODULE_NAME, generated)
    if spec is None or spec.loader is None:
        raise SystemExit(f"Could not load protobuf bindings from {generated}")

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


def message_summary(msg) -> str:
    return json.dumps(message_data(msg), indent=2, sort_keys=True)


def format_message_flow(direction: str, msg) -> Text:
    text = Text()
    if direction == "TX":
        edge_style = "bold cyan"
        left_style = "bold cyan"
        right_style = "bold green"
        edge = "Request"
        left = "Host"
        right = "LowSide"
    elif direction == "RX":
        edge_style = "bold green"
        left_style = "bold green"
        right_style = "bold cyan"
        edge = "Response"
        left = "LowSide"
        right = "Host"
    elif direction == "LS->HS":
        edge_style = "bold yellow"
        left_style = "bold green"
        right_style = "bold yellow"
        edge = "Forward"
        left = "LowSide"
        right = "HighSide"
    elif direction == "HS->LS":
        edge_style = "bold yellow"
        left_style = "bold yellow"
        right_style = "bold green"
        edge = "Forward"
        left = "HighSide"
        right = "LowSide"
    else:
        edge_style = "bold white"
        left_style = "bold white"
        right_style = "bold white"
        edge = direction
        left = ""
        right = ""

    text.append("o ", style="dim")
    text.append(now_str(), style="dim")
    text.append(" ")
    text.append(edge, style=edge_style)
    if left or right:
        text.append("   ", style="dim")
        text.append(left, style=left_style)
        text.append("  ", style="dim")
        text.append("->", style="dim")
        text.append("  ")
        text.append(right, style=right_style)
    return text


def build_message_panel(msg, direction: str):
    meta_message = Text()
    meta_message.append("message", style="dim")
    meta_message.append(": ")
    meta_message.append(msg.DESCRIPTOR.name, style="bold white")

    meta_payload = Text()
    meta_payload.append("payload", style="dim")
    meta_payload.append(": ")
    meta_payload.append(payload_name(msg), style="magenta")

    tree = Tree(Text("body", style="bold white"), guide_style="dim")
    append_tree_nodes(tree, message_data(msg))

    border_style = "cyan" if direction == "TX" else "yellow" if direction in ("LS->HS", "HS->LS") else "green"
    return Panel.fit(
        Group(meta_message, meta_payload, tree),
        title=format_message_flow(direction, msg),
        border_style=border_style,
        padding=(0, 1),
    )


def print_message(direction: str, msg) -> None:
    payload = payload_name(msg)

    # For received forwarded messages show HS->LS inner panel first (it happened first in the chain).
    if direction == "RX" and payload == "forwarded_to_host":
        CONSOLE.print()
        CONSOLE.print(build_message_panel(msg.forwarded_to_host.message, "HS->LS"))

    CONSOLE.print()
    CONSOLE.print(build_message_panel(msg, direction))

    # For sent forwarded messages show LS->HS inner panel after (host sends, then LS forwards).
    if direction == "TX" and payload == "forward_to_highside":
        CONSOLE.print(build_message_panel(msg.forward_to_highside.message, "LS->HS"))


def build_protocol_info(pb2, nonce: int, protocol_version: int, protocol_hash: int):
    msg = pb2.FromHost()
    msg.protocol_version = protocol_version
    msg.nonce = nonce
    msg.protocol_info.protocol_version = protocol_version
    msg.protocol_info.protocol_hash = protocol_hash
    return msg

def build_request_state(pb2, nonce: int, protocol_version: int, include_highside_status: bool,
                        include_lowside_status: bool, include_fw_update_status: bool):
    msg = pb2.FromHost()
    msg.protocol_version = protocol_version
    msg.nonce = nonce
    msg.request_state.include_highside_status = include_highside_status
    msg.request_state.include_lowside_status = include_lowside_status
    msg.request_state.include_fw_update_status = include_fw_update_status
    return msg


def build_host_command(pb2, nonce: int, protocol_version: int, command_name: str, target_name: str):
    msg = pb2.FromHost()
    msg.protocol_version = protocol_version
    msg.nonce = nonce
    msg.host_command.command = getattr(pb2, HOST_COMMANDS[command_name])
    msg.host_command.target = getattr(pb2, TARGETS[target_name])
    return msg

def build_request_dial_state(pb2, nonce: int, protocol_version: int):
    msg = pb2.FromHost()
    msg.protocol_version = protocol_version
    msg.nonce = nonce
    msg.dial_state_request.SetInParent()
    return msg

def build_forward_to_highside(pb2, nonce: int, protocol_version: int):
    inner = pb2.ToHighSide()
    inner.protocol_version = protocol_version
    inner.nonce = nonce
    inner.request_protocol_info.SetInParent()
    msg = pb2.FromHost()
    msg.protocol_version = protocol_version
    msg.nonce = nonce
    msg.forward_to_highside.message.CopyFrom(inner)
    return msg


def build_host_dial_config(pb2, nonce: int, protocol_version: int, config: dict, position_nonce: int):
    msg = pb2.FromHost()
    msg.protocol_version = protocol_version
    msg.nonce = nonce

    dial = msg.dial_config
    dial.position = int(config.get("position", 0))
    dial.sub_position_unit = float(config.get("sub_position_unit", 0.0))
    dial.position_nonce = int(position_nonce)
    dial.min_position = int(config.get("min_position", 0))
    dial.max_position = int(config.get("max_position", 0))
    dial.position_width_radians = float(config.get("position_width_radians", 0.0))
    dial.detent_strength_unit = float(config.get("detent_strength_unit", 0.0))
    dial.endstop_strength_unit = float(config.get("endstop_strength_unit", 0.0))
    dial.snap_point = float(config.get("snap_point", 0.0))
    dial.snap_point_bias = float(config.get("snap_point_bias", 0.0))
    dial.led_hue = int(config.get("led_hue", 0))

    for value in config.get("detent_positions", [])[:5]:
        dial.detent_positions.append(int(value))

    for item in config.get("override_detents", [])[:8]:
        detent = dial.override_detents.add()
        detent.position = int(item.get("position", 0))
        detent.strength = float(item.get("strength", 0.0))

    motor = config.get("motor_control", {})
    dial.motor_control.pole_pairs = int(motor.get("pole_pairs", 7))
    dial.motor_control.sensor_type = getattr(
        pb2,
        f"MOTOR_SENSOR_TYPE_{motor.get('sensor_type', 'MAGNETIC_ENCODER')}",
        pb2.MOTOR_SENSOR_TYPE_MAGNETIC_ENCODER,
    )
    dial.motor_control.sensor_direction = getattr(
        pb2,
        f"MOTOR_SENSOR_DIRECTION_{motor.get('sensor_direction', 'AUTO')}",
        pb2.MOTOR_SENSOR_DIRECTION_AUTO,
    )
    dial.motor_control.motion_type = getattr(
        pb2,
        f"MOTOR_MOTION_TYPE_{motor.get('motion_type', 'TORQUE')}",
        pb2.MOTOR_MOTION_TYPE_TORQUE,
    )
    dial.motor_control.voltage_limit = float(motor.get("voltage_limit", 5.0))
    dial.motor_control.velocity_limit = float(motor.get("velocity_limit", 8.0))
    dial.motor_control.current_limit = float(motor.get("current_limit", 1.2))

    def fill_pid(dst, src: dict, defaults: tuple[float, float, float, float]) -> None:
        dst.p = float(src.get("p", defaults[0]))
        dst.i = float(src.get("i", defaults[1]))
        dst.d = float(src.get("d", defaults[2]))
        dst.output_ramp = float(src.get("output_ramp", defaults[3]))

    fill_pid(dial.motor_control.velocity_pid, motor.get("velocity_pid", {}), (0.2, 2.0, 0.0, 1000.0))
    dial.motor_control.velocity_lpf.time_constant = float(
        motor.get("velocity_lpf", {}).get("time_constant", 0.01)
    )
    fill_pid(dial.motor_control.current_pid, motor.get("current_pid", {}), (3.0, 300.0, 0.0, 0.0))
    dial.motor_control.current_lpf.time_constant = float(
        motor.get("current_lpf", {}).get("time_constant", 0.006)
    )

    haptic = motor.get("haptic_tuning", {})
    dial.motor_control.haptic_tuning.detent_gain = float(haptic.get("detent_gain", 0.16))
    dial.motor_control.haptic_tuning.endstop_gain = float(haptic.get("endstop_gain", 0.24))
    dial.motor_control.haptic_tuning.deadband_fraction = float(haptic.get("deadband_fraction", 0.035))
    dial.motor_control.haptic_tuning.torque_filter_time_constant = float(
        haptic.get("torque_filter_time_constant", 0.018)
    )
    dial.motor_control.haptic_tuning.torque_slew_rate = float(haptic.get("torque_slew_rate", 42.0))
    dial.motor_control.haptic_tuning.detent_settle_fraction = float(
        haptic.get("detent_settle_fraction", 0.16)
    )
    dial.motor_control.haptic_tuning.endstop_settle_fraction = float(
        haptic.get("endstop_settle_fraction", 0.035)
    )
    dial.motor_control.haptic_tuning.idle_release_ms = float(haptic.get("idle_release_ms", 85.0))
    return msg

def send_message(ser: serial.Serial, msg) -> None:
    frame = cobs_frame(encode_message(msg))
    print_message("TX", msg)
    send_frame(ser, frame)


def open_serial(port: str, baudrate: int, timeout: float) -> serial.Serial:
    try:
        return serial.Serial(port=port, baudrate=baudrate, timeout=timeout)
    except serial.SerialException as exc:
        raise SystemExit(f"Could not open serial port {port}: {exc}") from exc


def send_frame(ser: serial.Serial, frame: bytes) -> None:
    try:
        ser.write(frame)
        ser.flush()
    except serial.SerialException as exc:
        raise SystemExit(f"Serial write failed: {exc}") from exc


def iter_frames(ser: serial.Serial, deadline: Optional[float] = None) -> Iterable[bytes]:
    while True:
        if deadline is not None and time.monotonic() >= deadline:
            return

        try:
            raw = ser.read_until(b"\x00")
        except serial.SerialException as exc:
            print(f"Serial read failed: {exc}", file=sys.stderr)
            return

        if not raw:
            continue

        if not raw.endswith(b"\x00"):
            print(f"Ignoring partial frame: {raw.hex()}", file=sys.stderr)
            continue

        yield raw


def wait_for_expected_payload(
    ser: serial.Serial,
    pb2,
    expected_payload: str,
    response_timeout: float,
    expected_nonce: Optional[int] = None,
) -> int:
    deadline = time.monotonic() + response_timeout

    for frame in iter_frames(ser, deadline):
        try:
            msg = decode_to_host_frame(frame, pb2)
        except Exception as exc:
            print(f"Malformed incoming frame: {exc}", file=sys.stderr)
            print(f"  raw: {frame.hex()}", file=sys.stderr)
            continue

        print_message("RX", msg)
        if payload_name(msg) != expected_payload:
            continue
        if expected_nonce is not None and getattr(msg, "nonce", None) != expected_nonce:
            continue
        return 0

    print_status(
        f"No {expected_payload} response received within {response_timeout:.1f}s. "
        "The host link may not be authenticated yet..\n",
        "error",
    )
    return 1


def wait_for_host_state(
    ser: serial.Serial,
    pb2,
    response_timeout: float,
    expected_nonce: Optional[int] = None,
):
    deadline = time.monotonic() + response_timeout

    for frame in iter_frames(ser, deadline):
        try:
            msg = decode_to_host_frame(frame, pb2)
        except Exception as exc:
            print(f"Malformed incoming frame: {exc}", file=sys.stderr)
            print(f"  raw: {frame.hex()}", file=sys.stderr)
            continue

        print_message("RX", msg)
        if payload_name(msg) != "host_state":
            continue
        if expected_nonce is not None and getattr(msg, "nonce", None) != expected_nonce:
            continue
        return msg

    return None


def wait_for_host_state_or_forwarded(
    ser: serial.Serial,
    pb2,
    response_timeout: float,
    expected_nonce: Optional[int] = None,
):
    deadline = time.monotonic() + response_timeout
    for frame in iter_frames(ser, deadline):
        try:
            msg = decode_to_host_frame(frame, pb2)
        except Exception as exc:
            print(f"Malformed incoming frame: {exc}", file=sys.stderr)
            continue
        print_message("RX", msg)
        p = payload_name(msg)
        if p == "forwarded_to_host":
            return msg
        if p == "host_state":
            if expected_nonce is not None and getattr(msg, "nonce", None) != expected_nonce:
                continue
            return msg
    return None


def run_highside_protocol_probe(args, pb2, nonce: int, nonce_gen: NonceGenerator) -> int:
    with open_serial(args.port, args.baudrate, args.timeout) as ser:
        time.sleep(2.0)

        connect_msg = build_protocol_info(pb2, nonce, args.proto_version, args.proto_hash)
        send_message(ser, connect_msg)
        if wait_for_ack(ser, pb2, nonce, args.response_timeout) != 0:
            return 1

        print_status("Low-side handshake complete. Waiting for high-side bridge...", "success")

        deadline = time.monotonic() + args.response_timeout
        while time.monotonic() < deadline:
            request_nonce = nonce_gen.take()
            request = build_request_state(
                pb2,
                request_nonce,
                args.proto_version,
                True,
                False,
                False,
            )
            send_message(ser, request)
            host_state = wait_for_host_state(ser, pb2, min(args.response_timeout, max(0.1, deadline - time.monotonic())), request_nonce)
            if host_state is None:
                return 1

            if getattr(host_state, "host_state", None) and host_state.host_state.highside.ready:
                print_status("High-side handshake complete.", "success")
                return 0

            print_status("High-side not ready yet; retrying...", "info")
            time.sleep(0.25)

        print_status("High-side did not become ready before timeout.", "error")
        return 1


def listen_loop(ser: serial.Serial, pb2, once: bool = False, response_timeout: Optional[float] = None) -> int:
    received = 0
    deadline = None if response_timeout is None else time.monotonic() + response_timeout
    try:
        for frame in iter_frames(ser, deadline):
            try:
                msg = decode_to_host_frame(frame, pb2)
            except Exception as exc:
                print(f"Malformed incoming frame: {exc}", file=sys.stderr)
                print(f"  raw: {frame.hex()}", file=sys.stderr)
                continue

            print_message("RX", msg)
            received += 1
            if once:
                return received
    except KeyboardInterrupt:
        pass
    return received


def add_shared_serial_args(parser: argparse.ArgumentParser) -> None:
    parser.add_argument("--port", required=True, help="Serial port path, for example /dev/cu.usbmodem1234")
    parser.add_argument("--baudrate", type=int, default=115200, help="Serial baudrate")
    parser.add_argument("--timeout", type=float, default=0.2, help="Serial read timeout in seconds")
    parser.add_argument("--python-out", type=Path, default=DEFAULT_PYTHON_OUT, help="Directory for generated *_pb2.py")
    parser.add_argument(
        "--response-timeout",
        type=float,
        default=DEFAULT_RESPONSE_TIMEOUT,
        help="How long to wait for the expected ToHost response before failing",
    )
    parser.add_argument(
        "--listen-after",
        action="store_true",
        help="Keep listening for ToHost messages after sending the command",
    )


def add_protocol_identity_args(parser: argparse.ArgumentParser) -> None:
    identity_version, identity_hash = parse_identity()
    parser.add_argument("--nonce", type=int, help="Nonce to put into the FromHost frame, defaults to an auto-incrementing value")
    parser.add_argument(
        "--proto-version",
        type=int,
        default=identity_version if identity_version is not None else 1,
        help="Protocol version for the outer frame and protocol-info payload",
    )
    parser.add_argument(
        "--proto-hash",
        type=lambda value: int(value, 0),
        default=identity_hash if identity_hash is not None else 0,
        help="Protocol hash for protocol-info payload, accepts decimal or 0x-prefixed hex",
    )


def run_host_protocol_info_exchange(args, pb2) -> int:
    nonce_gen = NonceGenerator()
    with open_serial(args.port, args.baudrate, args.timeout) as ser:
        time.sleep(2.0)
        nonce = resolve_nonce(args, nonce_gen)
        message = build_protocol_info(pb2, nonce, args.proto_version, args.proto_hash)
        send_message(ser, message)

        rc = wait_for_ack(ser, pb2, nonce, args.response_timeout)
        if rc == 0 and (args.listen or getattr(args, "listen_after", False)):
            print_status("Listening for ToHost frames. Press Ctrl+C to stop.", "info")
            listen_loop(ser, pb2)
        return rc


def connect_on_open_serial(
    ser: serial.Serial,
    pb2,
    proto_version: int,
    proto_hash: int,
    nonce_gen: NonceGenerator,
    response_timeout: float,
) -> int:
    connect_nonce = nonce_gen.take()
    connect_message = build_protocol_info(pb2, connect_nonce, proto_version, proto_hash)
    send_message(ser, connect_message)
    return wait_for_ack(ser, pb2, connect_nonce, response_timeout)


def run_session(args, pb2) -> int:
    nonce_gen = NonceGenerator()
    proto_hash = args.proto_hash

    with open_serial(args.port, args.baudrate, args.timeout) as ser:
        time.sleep(2.0)
        rc = connect_on_open_serial(
            ser,
            pb2,
            args.proto_version,
            proto_hash,
            nonce_gen,
            args.response_timeout,
        )
        if rc != 0:
            return rc

        print_status("Session ready. Commands: state, dial-state, forward-state, reboot, bootloader, clear-faults, listen, help, quit", "success")

        while True:
            try:
                raw = input("<sense-dial-cli> ").strip()
            except EOFError:
                print()
                return 0
            except KeyboardInterrupt:
                print()
                return 0

            if not raw:
                continue

            if raw in {"quit", "exit"}:
                return 0

            if raw == "help":
                print_status("Commands: state, dial-state, forward-state, reboot, bootloader, clear-faults, listen, help, quit", "info")
                continue

            if raw == "listen":
                print_status("Listening for ToHost frames. Press Ctrl+C to return to the prompt.", "info")
                listen_loop(ser, pb2)
                continue

            if raw == "state":
                nonce = nonce_gen.take()
                message = build_request_state(
                    pb2,
                    nonce,
                    args.proto_version,
                    True,
                    True,
                    True,
                )
                send_message(ser, message)
                wait_for_expected_payload(ser, pb2, "host_state", args.response_timeout, nonce)
                continue
            
            if raw == "dial-state":
                nonce = nonce_gen.take()
                message = build_request_dial_state(pb2, nonce, args.proto_version)
                send_message(ser, message)
                wait_for_expected_payload(ser, pb2, "dial_state", args.response_timeout, nonce)
                continue

            if raw == "forward-state":
                nonce = nonce_gen.take()
                message = build_forward_to_highside(pb2, nonce, args.proto_version)
                send_message(ser, message)
                fwd = wait_for_host_state_or_forwarded(ser, pb2, args.response_timeout, nonce)
                if fwd is None:
                    print_status("No response from high-side within timeout.", "error")
                else:
                    inner = fwd.forwarded_to_host.message
                    if inner.HasField("protocol_info"):
                        ok = (inner.protocol_info.protocol_hash == args.proto_hash and
                              inner.protocol_info.protocol_version == args.proto_version)
                        if ok:
                            print_status("High-side auth OK — hash and version match.", "success")
                        else:
                            print_status(
                                f"High-side auth FAILED — hash={hex(inner.protocol_info.protocol_hash)} "
                                f"version={inner.protocol_info.protocol_version}", "error")
                continue

            if raw in SESSION_COMMANDS:
                nonce = nonce_gen.take()
                message = build_host_command(
                    pb2,
                    nonce,
                    args.proto_version,
                    SESSION_COMMANDS[raw],
                    "lowside",
                )
                send_message(ser, message)
                continue

            print_status(f"Unknown command: {raw}", "warning")


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="SenseDial LowSide host-side serial test tool")
    parser.add_argument("--port", help="Serial port path, for example /dev/cu.usbmodem1234")
    parser.add_argument("--baudrate", type=int, default=115200, help="Serial baudrate")
    parser.add_argument("--timeout", type=float, default=0.2, help="Serial read timeout in seconds")
    parser.add_argument("--python-out", type=Path, default=DEFAULT_PYTHON_OUT, help="Directory for generated *_pb2.py")
    parser.add_argument(
        "--listen",
        action="store_true",
        help="Listen and decode incoming ToHost frames. If used without a subcommand, listen only.",
    )

    subparsers = parser.add_subparsers(dest="command")

    generate_parser = subparsers.add_parser("generate-python", help="Generate Python protobuf bindings")
    generate_parser.add_argument("--python-out", type=Path, default=DEFAULT_PYTHON_OUT, help="Output directory")

    connect_parser = subparsers.add_parser(
        "connect",
        help="Host-driven connect: send FromHost.protocol_info, wait for ToHost.ack, then optionally listen",
    )
    add_shared_serial_args(connect_parser)
    add_protocol_identity_args(connect_parser)

    protocol_parser = subparsers.add_parser(
        "protocol-info",
        help="Send FromHost.protocol_info immediately and wait for ToHost.ack",
    )
    add_shared_serial_args(protocol_parser)
    add_protocol_identity_args(protocol_parser)

    session_parser = subparsers.add_parser(
        "session",
        help="Open one serial session, connect once, then run interactive test commands",
    )
    add_shared_serial_args(session_parser)
    add_protocol_identity_args(session_parser)

    request_state_parser = subparsers.add_parser("request-state", help="Send FromHost.request_state")
    add_shared_serial_args(request_state_parser)
    request_state_parser.add_argument("--nonce", type=int, help="Nonce to put into the FromHost frame, defaults to an auto-incrementing value")
    request_state_parser.add_argument("--proto-version", type=int, default=parse_identity()[0] or 1)
    request_state_parser.add_argument(
        "--auto-connect",
        action="store_true",
        help="First send protocol_info and wait for ACK before sending request_state",
    )
    request_state_parser.set_defaults(
        include_highside_status=True,
        include_lowside_status=True,
        include_fw_update_status=True,
    )
    request_state_parser.add_argument("--no-highside-status", action="store_false", dest="include_highside_status")
    request_state_parser.add_argument("--no-lowside-status", action="store_false", dest="include_lowside_status")
    request_state_parser.add_argument("--no-fw-update-status", action="store_false", dest="include_fw_update_status")

    probe_parser = subparsers.add_parser(
        "probe-highside",
        help="Validate host and high-side protocol_info handshakes through the low-side bridge",
    )
    add_shared_serial_args(probe_parser)
    add_protocol_identity_args(probe_parser)
    probe_parser.set_defaults(include_highside_status=True)

    host_command_parser = subparsers.add_parser("host-command", help="Send FromHost.host_command")
    add_shared_serial_args(host_command_parser)
    host_command_parser.add_argument("--nonce", type=int, help="Nonce to put into the FromHost frame, defaults to an auto-incrementing value")
    host_command_parser.add_argument("--proto-version", type=int, default=parse_identity()[0] or 1)
    host_command_parser.add_argument(
        "--auto-connect",
        action="store_true",
        help="First send protocol_info and wait for ACK before sending host_command",
    )
    host_command_parser.add_argument("host_command", choices=sorted(HOST_COMMANDS))
    host_command_parser.add_argument(
        "--target",
        choices=sorted(TARGETS),
        default="lowside",
        help="Firmware target for the host command",
    )

    return parser

def main() -> int:
    parser = build_parser()
    args = parser.parse_args()
    nonce_gen = NonceGenerator()

    print_status(f"Generating Python protobuf bindings from {PROTO_FILE}...", "info")
    generated = generate_python_bindings(args.python_out)
    print_status(f"Generated Python protobuf bindings: {generated}", "success")

    if args.command is None and not args.listen:
        parser.error("choose a subcommand or pass --listen with serial options")

    if args.command is None:
        if not args.port:
            parser.error("--listen requires --port")
        pb2 = load_pb2(args.python_out)
        with open_serial(args.port, args.baudrate, args.timeout) as ser:
            print_status("Listening for ToHost frames. Press Ctrl+C to stop.", "info")
            listen_loop(ser, pb2)
        return 0

    pb2 = load_pb2(args.python_out)

    message = None
    if args.command == "connect":
        if not args.listen_after:
            args.listen_after = True
        return run_host_protocol_info_exchange(args, pb2)
    elif args.command == "protocol-info":
        return run_host_protocol_info_exchange(args, pb2)
    elif args.command == "session":
        return run_session(args, pb2)
    elif args.command == "probe-highside":
        nonce = resolve_nonce(args, nonce_gen)
        return run_highside_protocol_probe(args, pb2, nonce, nonce_gen)
    elif args.command == "request-state":
        nonce = resolve_nonce(args, nonce_gen)
        message = build_request_state(
            pb2,
            nonce,
            args.proto_version,
            args.include_highside_status,
            args.include_lowside_status,
            args.include_fw_update_status,
        )
    elif args.command == "host-command":
        nonce = resolve_nonce(args, nonce_gen)
        message = build_host_command(pb2, nonce, args.proto_version, args.host_command, args.target)

    with open_serial(args.port, args.baudrate, args.timeout) as ser:
        time.sleep(2.0)  # dai tempo al micro di bootare dopo apertura porta
        if getattr(args, "auto_connect", False):
            rc = connect_on_open_serial(
                ser,
                pb2,
                args.proto_version,
                parse_identity()[1] or 0,
                nonce_gen,
                args.response_timeout,
            )
            if rc != 0:
                return rc

        if message is not None:
            send_message(ser, message)
            if args.command == "request-state":
                rc = wait_for_expected_payload(ser, pb2, "host_state", args.response_timeout, message.nonce)
                if rc != 0:
                    return rc

        if args.listen or getattr(args, "listen_after", False):
            print_status("Listening for ToHost frames. Press Ctrl+C to stop.", "info")
            listen_loop(ser, pb2)

    return 0


if __name__ == "__main__":
    signal.signal(signal.SIGINT, signal.default_int_handler)
    sys.exit(main())
