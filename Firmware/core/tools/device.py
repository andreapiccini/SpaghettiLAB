#!/usr/bin/env python3
"""Cross-platform host helper for Zephyr flashing and serial consoles."""

from __future__ import annotations

import argparse
import glob
from pathlib import Path
import platform
import re
import shutil
import subprocess
import sys


ROOT = Path(__file__).resolve().parent.parent
BUILD = ROOT / "build"
RUNNERS_FILE = BUILD / "zephyr" / "runners.yaml"
CONFIG_FILE = BUILD / "zephyr" / ".config"


class ToolError(RuntimeError):
    """An actionable host-tool error."""


def windows_ports() -> list[str]:
    """Read serial port names from the Windows registry."""
    try:
        import winreg
    except ImportError:
        return []

    ports: list[str] = []
    key_path = r"HARDWARE\DEVICEMAP\SERIALCOMM"
    try:
        with winreg.OpenKey(winreg.HKEY_LOCAL_MACHINE, key_path) as key:
            index = 0
            while True:
                try:
                    ports.append(str(winreg.EnumValue(key, index)[1]))
                    index += 1
                except OSError:
                    break
    except OSError:
        pass
    return ports


def serial_ports() -> list[str]:
    """Return likely physical USB serial ports for the current host."""
    system = platform.system()
    if system == "Windows":
        return sorted(set(windows_ports()))

    if system == "Darwin":
        patterns = (
            "/dev/cu.usbmodem*",
            "/dev/cu.usbserial*",
            "/dev/cu.SLAB_USBtoUART*",
            "/dev/cu.wchusbserial*",
        )
    else:
        by_id = sorted(glob.glob("/dev/serial/by-id/*"))
        if by_id:
            return by_id
        patterns = ("/dev/ttyACM*", "/dev/ttyUSB*")

    return sorted({port for pattern in patterns for port in glob.glob(pattern)})


def selected_port(explicit: str | None) -> str:
    """Use an explicit port or require one unambiguous detected port."""
    if explicit:
        return explicit

    ports = serial_ports()
    if not ports:
        raise ToolError(
            "No USB serial port detected. Connect the board with a data cable, "
            "run 'make ports', or pass PORT=<device>."
        )
    if len(ports) > 1:
        choices = "\n  ".join(ports)
        raise ToolError(
            "More than one USB serial port was detected. Select one with "
            f"PORT=<device>:\n  {choices}"
        )
    return ports[0]


def read_required(path: Path, purpose: str) -> str:
    """Read a generated build file or explain how to create it."""
    try:
        return path.read_text(encoding="utf-8")
    except FileNotFoundError as exc:
        raise ToolError(
            f"Missing {purpose}: {path.relative_to(ROOT)}. Run 'make build' first."
        ) from exc


def zephyr_runner() -> tuple[str, str]:
    """Return the selected flash runner and generated runners file text."""
    text = read_required(RUNNERS_FILE, "Zephyr runner configuration")
    match = re.search(r"(?m)^flash-runner:\s*(\S+)\s*$", text)
    if not match:
        raise ToolError("The Zephyr build does not define a default flash runner.")
    return match.group(1), text


def yaml_argument(text: str, name: str, default: str | None = None) -> str:
    """Read one scalar runner argument from Zephyr's generated YAML."""
    match = re.search(rf"(?m)^\s*-\s+--{re.escape(name)}=(.*)$", text)
    if match:
        return match.group(1).strip()
    if default is not None:
        return default
    raise ToolError(f"The Zephyr runner did not provide --{name}.")


def kconfig_string(name: str) -> str:
    """Read a quoted Kconfig value from the active build."""
    text = read_required(CONFIG_FILE, "Zephyr build configuration")
    match = re.search(rf'(?m)^{re.escape(name)}="([^"]+)"$', text)
    if not match:
        raise ToolError(f"The Zephyr build does not define {name}.")
    return match.group(1)


def esptool_prefix() -> list[str]:
    """Find the host esptool command."""
    command = shutil.which("esptool") or shutil.which("esptool.py")
    if command:
        return [command]
    try:
        __import__("esptool")
        return [sys.executable, "-m", "esptool"]
    except ImportError as exc:
        raise ToolError(
            "The Espressif runner requires esptool on the host. Install it and retry."
        ) from exc


def esp32_command(port: str, baud: int, runner_text: str) -> list[str]:
    """Build an esptool command from the generated Zephyr runner settings."""
    chip = kconfig_string("CONFIG_SOC")
    image = BUILD / "zephyr" / "zephyr.bin"
    if not image.is_file():
        raise ToolError("Missing build/zephyr/zephyr.bin. Run 'make build' first.")

    return [
        *esptool_prefix(),
        "--chip",
        chip,
        "--port",
        port,
        "--baud",
        str(baud),
        "write-flash",
        "--flash-mode",
        yaml_argument(runner_text, "esp-flash-mode", "keep"),
        "--flash-freq",
        yaml_argument(runner_text, "esp-flash-freq", "keep"),
        "--flash-size",
        yaml_argument(runner_text, "esp-flash-size", "detect"),
        yaml_argument(runner_text, "esp-app-address", "0x0"),
        str(image),
    ]


def generic_west_command() -> list[str]:
    """Delegate non-Espressif runners to a host Zephyr installation."""
    west = shutil.which("west")
    if not west:
        raise ToolError(
            "This build uses a non-Espressif runner. Install a compatible Zephyr "
            "host environment (including west and the runner utility), then retry."
        )
    return [west, "flash", "-d", str(BUILD)]


def run_flash(args: argparse.Namespace) -> int:
    """Flash with the runner selected by the active Zephyr build."""
    runner, runner_text = zephyr_runner()
    if runner == "esp32":
        port = selected_port(args.port)
        command = esp32_command(port, args.baud, runner_text)
    else:
        command = generic_west_command()
        if args.port:
            print(
                f"Note: runner '{runner}' controls device selection; PORT is not a "
                "portable Zephyr runner option.",
                file=sys.stderr,
            )

    print(f"Flash runner: {runner}")
    print("Command: " + " ".join(command))
    if args.dry_run:
        return 0
    return subprocess.call(command, cwd=ROOT)


def run_screen(args: argparse.Namespace) -> int:
    """Open the selected serial port with the native host monitor."""
    port = selected_port(args.port)
    if platform.system() == "Windows":
        command = [
            sys.executable,
            "-m",
            "serial.tools.miniterm",
            port,
            str(args.baud),
        ]
    else:
        screen = shutil.which("screen")
        if not screen:
            raise ToolError("The serial console requires 'screen' on this host.")
        command = [screen, port, str(args.baud)]

    print(f"Opening {port} at {args.baud} baud.")
    return subprocess.call(command)


def build_parser() -> argparse.ArgumentParser:
    """Create the command-line parser."""
    parser = argparse.ArgumentParser(
        description="Detect, flash, and monitor a Zephyr board from the host."
    )
    subparsers = parser.add_subparsers(dest="command", required=True)

    subparsers.add_parser("ports", help="list detected USB serial ports")

    flash = subparsers.add_parser("flash", help="flash the active Zephyr build")
    flash.add_argument("--port", help="serial device override")
    flash.add_argument("--baud", type=int, default=460800)
    flash.add_argument("--dry-run", action="store_true")

    screen = subparsers.add_parser("screen", help="open the serial console")
    screen.add_argument("--port", help="serial device override")
    screen.add_argument("--baud", type=int, default=115200)
    return parser


def main() -> int:
    """Run the requested host operation."""
    args = build_parser().parse_args()
    try:
        if args.command == "ports":
            ports = serial_ports()
            if ports:
                print("\n".join(ports))
            else:
                print("No USB serial ports detected.")
            return 0
        if args.command == "flash":
            return run_flash(args)
        return run_screen(args)
    except ToolError as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        return 2
    except KeyboardInterrupt:
        return 130


if __name__ == "__main__":
    raise SystemExit(main())
