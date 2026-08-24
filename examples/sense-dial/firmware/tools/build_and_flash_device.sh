#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
PYTHON="${PYTHON:-python3}"
LOWSIDE_SERIAL_PORT="${LOWSIDE_SERIAL_PORT:-}"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --port)
      shift
      LOWSIDE_SERIAL_PORT="${1:?--port requires a serial device}"
      ;;
    --port=*) LOWSIDE_SERIAL_PORT="${1#--port=}" ;;
    -h|--help)
      echo "Usage: ./tools/build_and_flash_device.sh [--port /dev/cu.usbmodem...]"
      exit 0
      ;;
    *) echo "Unknown option: $1" >&2; exit 1 ;;
  esac
  shift
done

echo "Building low-side..."
"$SCRIPT_DIR/build_and_flash_lowside.sh" --no-flash
echo "Building high-side..."
"$SCRIPT_DIR/build_and_flash_highside.sh" --no-flash

echo "Flashing low-side over USB..."
"$SCRIPT_DIR/build_and_flash_lowside.sh" --flash-only

echo "Waiting for low-side USB serial..."
sleep 2
args=("$ROOT/.pio/build/highside/firmware.bin")
[[ -n "$LOWSIDE_SERIAL_PORT" ]] && args+=(--port "$LOWSIDE_SERIAL_PORT")
"$PYTHON" "$SCRIPT_DIR/flash_highside_via_lowside.py" "${args[@]}"
echo "SenseDial low-side and high-side update completed."
