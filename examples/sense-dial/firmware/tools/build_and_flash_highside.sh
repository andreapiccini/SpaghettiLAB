#!/usr/bin/env bash
# Build with PlatformIO and flash ESP32-S3 highside firmware.
#
# Usage:
#   ./build_and_flash_highside.sh              # build + flash
#   ./build_and_flash_highside.sh --no-flash   # build only
#   ./build_and_flash_highside.sh --flash-only # flash existing artifacts only
#
# Optional:
#   PIO_ENV=highside
#   FLASH_SERIAL_PORT=/dev/cu.usbmodem*
#   ESPTOOL=/path/to/esptool.py
#   ESPTOOL_BAUD=921600
#   FLASH_LOAD_TIMEOUT
set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
PIO_ENV="${PIO_ENV:-highside}"
FW_DIR="$ROOT"
BUILD_DIR="${BUILD_DIR:-$FW_DIR/.pio/build/$PIO_ENV}"

BOOTLOADER="${FLASH_BOOTLOADER_PATH:-$BUILD_DIR/bootloader.bin}"
PARTITIONS="${FLASH_PARTITIONS_PATH:-$BUILD_DIR/partitions.bin}"
BOOT_APP0="${FLASH_BOOT_APP0_PATH:-$BUILD_DIR/boot_app0.bin}"
FIRMWARE="${FLASH_FIRMWARE_PATH:-$BUILD_DIR/firmware.bin}"

DO_BUILD=1
DO_FLASH=1
HOST_OS="$(uname -s)"
FLASH_SERIAL_PORT="${FLASH_SERIAL_PORT:-${UPLOAD_PORT:-}}"
FLASH_LOAD_TIMEOUT_SEC="${FLASH_LOAD_TIMEOUT:-8}"
ESPTOOL_BAUD="${ESPTOOL_BAUD:-921600}"

if [[ -t 1 ]]; then
  COLOR_INFO=$'\033[1;94m'
  COLOR_WARN=$'\033[1;96m'
  COLOR_ERR=$'\033[1;31m'
  COLOR_RESET=$'\033[0m'
else
  COLOR_INFO=""
  COLOR_WARN=""
  COLOR_ERR=""
  COLOR_RESET=""
fi

while [[ $# -gt 0 ]]; do
  case "$1" in
    --no-flash) DO_FLASH=0 ;;
    --flash-only) DO_BUILD=0 ;;
    --port)
      shift
      FLASH_SERIAL_PORT="${1:?--port requires an argument}"
      ;;
    --port=*) FLASH_SERIAL_PORT="${1#--port=}" ;;
    -h|--help)
      cat <<EOF
Usage:
  ./build_and_flash_highside.sh
  ./build_and_flash_highside.sh --no-flash
  ./build_and_flash_highside.sh --flash-only

Environment:
  PIO_ENV=highside
  FLASH_SERIAL_PORT=/dev/cu.usbmodem1234
  ESPTOOL=/path/to/esptool.py
  ESPTOOL_BAUD=921600
  FLASH_FIRMWARE_PATH=/path/to/firmware.bin
  FLASH_BOOTLOADER_PATH=/path/to/bootloader.bin
  FLASH_PARTITIONS_PATH=/path/to/partitions.bin
  FLASH_BOOT_APP0_PATH=/path/to/boot_app0.bin
  FLASH_LOAD_TIMEOUT=8
EOF
      exit 0
      ;;
    *)
      echo "Unknown option: $1" >&2
      exit 1
      ;;
  esac
  shift
done

find_platformio() {
  if command -v platformio >/dev/null 2>&1; then
    command -v platformio
    return 0
  fi
  if command -v pio >/dev/null 2>&1; then
    command -v pio
    return 0
  fi
  if [[ -x "${HOME}/.platformio/penv/bin/platformio" ]]; then
    echo "${HOME}/.platformio/penv/bin/platformio"
    return 0
  fi
  if [[ -x "${HOME}/.platformio/penv/bin/pio" ]]; then
    echo "${HOME}/.platformio/penv/bin/pio"
    return 0
  fi
  return 1
}

find_esptool() {
  if [[ -n "${ESPTOOL:-}" && -f "$ESPTOOL" ]]; then
    echo "$ESPTOOL"
    return 0
  fi

  local candidates=(
    "${HOME}/.platformio/packages/tool-esptoolpy/esptool.py"
    "${HOME}/.platformio/packages/tool-esptoolpy/esptool/__main__.py"
  )

  local candidate
  for candidate in "${candidates[@]}"; do
    [[ -f "$candidate" ]] && echo "$candidate" && return 0
  done

  if command -v esptool.py >/dev/null 2>&1; then
    command -v esptool.py
    return 0
  fi

  if command -v esptool >/dev/null 2>&1; then
    command -v esptool
    return 0
  fi

  return 1
}

find_platformio_python() {
  if [[ -x "${HOME}/.platformio/penv/bin/python" ]]; then
    echo "${HOME}/.platformio/penv/bin/python"
    return 0
  fi

  if command -v python3 >/dev/null 2>&1; then
    command -v python3
    return 0
  fi

  return 1
}

run_build() {
  local PIO
  PIO="$(find_platformio)" || {
    echo "PlatformIO CLI not found." >&2
    echo "Install PlatformIO or add it to PATH." >&2
    exit 1
  }

  echo "Using PlatformIO: $PIO"
  echo "Building env: $PIO_ENV"
  echo "Firmware dir: $FW_DIR"

  "$PIO" run -d "$FW_DIR" -e "$PIO_ENV" || exit 1

  for artifact in "$BOOTLOADER" "$PARTITIONS" "$FIRMWARE"; do
    if [[ ! -f "$artifact" ]]; then
      echo "Build completed but artifact not found: $artifact" >&2
      exit 1
    fi
  done

  echo "Build completed."
  echo "Bootloader: $BOOTLOADER"
  echo "Partitions: $PARTITIONS"
  [[ -f "$BOOT_APP0" ]] && echo "Boot app0: $BOOT_APP0"
  echo "Firmware: $FIRMWARE"
}

list_usb_serial_ports() {
  local candidates=()
  local port

  if [[ -n "${FLASH_SERIAL_PORT:-}" ]]; then
    if [[ -e "${FLASH_SERIAL_PORT}" ]]; then
      printf '%s\n' "${FLASH_SERIAL_PORT}"
      return 0
    fi
  fi

  while IFS= read -r port; do
    [[ -n "$port" ]] || continue
    candidates+=("$port")
  done < <(ls -1 \
    /dev/cu.usbmodem* /dev/tty.usbmodem* \
    /dev/cu.usbserial* /dev/tty.usbserial* \
    /dev/ttyACM* /dev/ttyUSB* \
    2>/dev/null || true)

  if [[ ${#candidates[@]} -eq 0 ]]; then
    return 1
  fi

  printf '%s\n' "${candidates[@]}"
}

pick_serial_port() {
  local ports=()
  local port

  while IFS= read -r port; do
    [[ -n "$port" ]] || continue
    ports+=("$port")
  done < <(list_usb_serial_ports 2>/dev/null || true)

  if [[ ${#ports[@]} -eq 0 ]]; then
    return 1
  fi

  # When multiple ports exist, prefer the last one (highest number).
  # The ESP32-S3 enumerates after the RP2040 lowside, so it gets the higher port number.
  local selected="${ports[-1]}"
  if [[ ${#ports[@]} -gt 1 ]]; then
    echo "Detected multiple USB serial ports; using ${selected} (last enumerated)" >&2
  fi
  printf '%s\n' "$selected"
}

flash_with_esptool() {
  local ESPTOOL_BIN
  ESPTOOL_BIN="$(find_esptool)" || {
    echo "esptool not found. Set ESPTOOL=/path/to/esptool.py or install PlatformIO packages." >&2
    exit 1
  }

  local PORT="${FLASH_SERIAL_PORT:-}"
  if [[ -z "$PORT" ]]; then
    PORT="$(pick_serial_port)" || {
      echo "No USB serial port found. Set FLASH_SERIAL_PORT or connect the board." >&2
      exit 1
    }
  fi

  local cmd=()
  if [[ "$ESPTOOL_BIN" == *.py ]]; then
    cmd=("$(find_platformio_python)" "$ESPTOOL_BIN")
  else
    cmd=("$ESPTOOL_BIN")
  fi

  local flash_args=(
    --chip esp32s3
    --port "$PORT"
    --baud "$ESPTOOL_BAUD"
    --before default_reset
    --after hard_reset
    write_flash
    -z
    --flash_mode dio
    --flash_freq 80m
    --flash_size detect
    0x0 "$BOOTLOADER"
    0x8000 "$PARTITIONS"
  )

  if [[ -f "$BOOT_APP0" ]]; then
    flash_args+=(0xe000 "$BOOT_APP0")
  fi

  flash_args+=(0x10000 "$FIRMWARE")

  echo "Using esptool: $ESPTOOL_BIN"
  echo "Serial port: $PORT"
  echo "Baud rate: $ESPTOOL_BAUD"
  echo "Flashing ESP32-S3 firmware..."

  if command -v timeout >/dev/null 2>&1; then
    timeout --preserve-status "${FLASH_LOAD_TIMEOUT_SEC}s" "${cmd[@]}" "${flash_args[@]}"
  else
    "${cmd[@]}" "${flash_args[@]}"
  fi
}

if [[ "$DO_BUILD" -eq 1 ]]; then
  run_build
fi

if [[ "$DO_FLASH" -eq 1 ]]; then
  flash_with_esptool
fi

echo "Done."
