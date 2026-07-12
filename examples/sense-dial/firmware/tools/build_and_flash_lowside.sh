#!/usr/bin/env bash
# Build with PlatformIO and flash RP2xxx low-side firmware.
#
# Usage:
#   ./build_and_flash_lowside.sh              # build + flash
#   ./build_and_flash_lowside.sh --no-flash   # build only
#   ./build_and_flash_lowside.sh --flash-only # flash existing artifacts only
#
# Optional:
#   PIO_ENV=lowside
#   PICOTOOL_SER=<serial>
#   PICOTOOL_BUS PICOTOOL_ADDRESS PICOTOOL_VID PICOTOOL_PID
#   FLASH_SERIAL_PORT=/dev/ttyACM0
#   FLASH_SNAPSHOT_DIR=/custom/path
#   FLASH_PREFER_UF2_VOLUME=1
#   FLASH_UF2_WAIT FLASH_UF2_BOOT_DELAY FLASH_UF2_POLL
#   FLASH_LOAD_TIMEOUT
set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
PIO_ENV="${PIO_ENV:-lowside}"
FW_DIR="$ROOT"
BUILD_DIR="${BUILD_DIR:-$FW_DIR/.pio/build/$PIO_ENV}"
SNAPSHOT_DIR_DEFAULT="$FW_DIR/src/$PIO_ENV"
SNAPSHOT_DIR="${FLASH_SNAPSHOT_DIR:-$SNAPSHOT_DIR_DEFAULT}"
FLASH_SERIAL_PORT="${FLASH_SERIAL_PORT:-${UPLOAD_PORT:-}}"

UF2_DEFAULT="$BUILD_DIR/firmware.uf2"
ELF_DEFAULT="$BUILD_DIR/firmware.elf"

UF2="${FLASH_UF2_PATH:-$UF2_DEFAULT}"
ELF="${FLASH_ELF_PATH:-$ELF_DEFAULT}"

DO_BUILD=1
DO_FLASH=1

WAIT_SEC="${FLASH_UF2_WAIT:-60}"
BOOT_DELAY="${FLASH_UF2_BOOT_DELAY:-0}"
POLL_INTERVAL="${FLASH_UF2_POLL:-0.05}"
SERIAL_WAIT_SEC="${FLASH_SERIAL_WAIT:-5}"
LOAD_TIMEOUT_SEC="${FLASH_LOAD_TIMEOUT:-8}"
HOST_OS="$(uname -s)"
SERIAL_MONITOR_WARNING="${SERIAL_MONITOR_WARNING:-}"

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

if [[ -z "${FW_MEMORY_FORCE_COLOR:-}" ]]; then
  if [[ -n "${PLATFORMIO_UPLOAD_PORT:-}" || -n "${UPLOAD_PORT:-}" || -n "${VSCODE_GIT_IPC_HANDLE:-}" || ( -n "${TERM_PROGRAM:-}" && "${TERM_PROGRAM}" == "vscode" ) ]]; then
    FW_MEMORY_FORCE_COLOR=1
    export FW_MEMORY_FORCE_COLOR
  fi
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
  ./build_and_flash_lowside.sh
  ./build_and_flash_lowside.sh --no-flash
  ./build_and_flash_lowside.sh --flash-only

Environment:
  PIO_ENV=lowside
  FLASH_UF2_PATH=/path/to/firmware.uf2
  FLASH_ELF_PATH=/path/to/firmware.elf
  PICOTOOL_SER=<serial>
  PICOTOOL_BUS=<bus>
  PICOTOOL_ADDRESS=<address>
  PICOTOOL_VID=<vid>
  PICOTOOL_PID=<pid>
  FLASH_SERIAL_PORT=/dev/ttyACM0
  FLASH_SNAPSHOT_DIR=/custom/path
  FLASH_PREFER_UF2_VOLUME=1
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

  if [[ ! -f "$UF2" ]]; then
    echo "Build completed but UF2 not found: $UF2" >&2
    exit 1
  fi

  if [[ ! -f "$ELF" ]]; then
    echo "Build completed but ELF not found: $ELF" >&2
    exit 1
  fi

  echo "Build completed."
  echo "UF2: $UF2"
  echo "ELF: $ELF"

  if command -v python3 >/dev/null 2>&1 && [[ -f "$ROOT/scripts/fw_memory_report.py" ]]; then
    python3 "$ROOT/scripts/fw_memory_report.py" "$ELF" 2>&1 || true
  fi
}

find_picotool() {
  if [[ -n "${PICOTOOL:-}" && -x "$PICOTOOL" ]]; then
    echo "$PICOTOOL"
    return 0
  fi

  local candidates=(
    "${HOME}/.pico-sdk/picotool/2.2.0-a4/picotool/picotool"
    "${HOME}/.pico-sdk/picotool/2.0.0/picotool/picotool"
  )

  local p
  for p in "${candidates[@]}"; do
    [[ -x "$p" ]] && echo "$p" && return 0
  done

  if [[ -d "${HOME}/.pico-sdk/picotool" ]]; then
    while IFS= read -r p; do
      [[ -x "$p" ]] && echo "$p" && return 0
    done < <(find "${HOME}/.pico-sdk/picotool" -name picotool -type f 2>/dev/null)
  fi

  if command -v picotool >/dev/null 2>&1; then
    command -v picotool
    return 0
  fi

  return 1
}

write_flash_memory_snapshot() {
  if command -v python3 >/dev/null 2>&1 && [[ -f "$ROOT/scripts/fw_memory_report.py" ]] && [[ -f "$ELF" ]]; then
    python3 "$ROOT/scripts/fw_memory_report.py" "$ELF" --write-flash-snapshot "$SNAPSHOT_DIR" --quiet 2>/dev/null || true
  fi
}

fw_memory_report() {
  if [[ ! -f "$ELF" ]]; then
    return 0
  fi
  if command -v python3 >/dev/null 2>&1 && [[ -f "$ROOT/scripts/fw_memory_report.py" ]]; then
    python3 "$ROOT/scripts/fw_memory_report.py" "$ELF" 2>&1 || true
  fi
}

run_flash() {
  if [[ ! -f "$UF2" ]]; then
    echo "UF2 not found: $UF2" >&2
    exit 1
  fi

  echo "Custom lowside upload via build_and_flash_lowside.sh"

  local PT
  PT="$(find_picotool)" || PT=""
  if [[ -z "$PT" ]]; then
    echo "picotool not found. Set PICOTOOL=/path/to/picotool or install picotool." >&2
    exit 1
  fi

  if [[ -z "${PICOTOOL_SER:-}" && -f "$ROOT/.picotool_serial" ]]; then
    PICOTOOL_SER="$(head -1 "$ROOT/.picotool_serial" | tr -d '[:space:]')"
  fi

  local pt_sel=()
  [[ -n "${PICOTOOL_SER:-}" ]] && pt_sel+=(--ser "$PICOTOOL_SER")
  [[ -n "${PICOTOOL_BUS:-}" ]] && pt_sel+=(--bus "$PICOTOOL_BUS")
  [[ -n "${PICOTOOL_ADDRESS:-}" ]] && pt_sel+=(--address "$PICOTOOL_ADDRESS")
  [[ -n "${PICOTOOL_VID:-}" ]] && pt_sel+=(--vid "$PICOTOOL_VID")
  [[ -n "${PICOTOOL_PID:-}" ]] && pt_sel+=(--pid "$PICOTOOL_PID")

  echo "Using picotool: $PT"
  echo "UF2: $UF2"
  [[ -f "$ELF" ]] && echo "ELF: $ELF"

  picotool_cmd() {
    if [[ ${#pt_sel[@]} -gt 0 ]]; then
      "$PT" "$@" "${pt_sel[@]}"
    else
      "$PT" "$@"
    fi
  }

  run_picotool_load() {
    local artifact="$1"

    if command -v timeout >/dev/null 2>&1; then
      if [[ ${#pt_sel[@]} -gt 0 ]]; then
        timeout --preserve-status "${LOAD_TIMEOUT_SEC}s" "$PT" load -x "$artifact" "${pt_sel[@]}"
      else
        timeout --preserve-status "${LOAD_TIMEOUT_SEC}s" "$PT" load -x "$artifact"
      fi
      return $?
    fi

    picotool_cmd load -x "$artifact"
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

  wait_for_usb_serial_ports() {
    local wait_sec="${1:-$SERIAL_WAIT_SEC}"
    local end detected
    end=$(( $(date +%s) + wait_sec ))

    while [[ $(date +%s) -lt $end ]]; do
      detected="$(list_usb_serial_ports 2>/dev/null | tr '\n' ' ' | sed 's/[[:space:]]*$//')"
      if [[ -n "$detected" ]]; then
        printf '%s\n' "$detected"
        return 0
      fi
      sleep 0.25
    done
    return 1
  }

  close_usb_serial_users() {
    local port pid cmd sent_any=false
    local pids=()

    while IFS= read -r port; do
      [[ -n "$port" ]] || continue

      while IFS= read -r pid; do
        [[ -n "$pid" ]] || continue
        [[ "$pid" == "$$" || "$pid" == "$PPID" ]] && continue
        pids+=("$pid")
      done < <(lsof -t -- "$port" 2>/dev/null | sort -u)
    done < <(list_usb_serial_ports 2>/dev/null || true)

    if [[ ${#pids[@]} -eq 0 ]]; then
      return 0
    fi

    for pid in "${pids[@]}"; do
      cmd="$(ps -p "$pid" -o command= 2>/dev/null | tr -d '\n')"
      [[ -z "$cmd" ]] && cmd="unknown"

      if [[ "$cmd" == *"device monitor"* || "$cmd" == *"miniterm"* ]]; then
        echo "Requesting serial monitor stop for process $pid ($cmd)..."
        kill -INT "$pid" 2>/dev/null || true
        sent_any=true
      elif [[ "${FLASH_FORCE_CLOSE_PORT:-0}" == "1" ]]; then
        if [[ "$cmd" == *"Cursor"* || "$cmd" == *"Code Helper"* || "$cmd" == *"codex"* || "$cmd" == *"Code"* ]]; then
          true
        else
          echo "Force-closing serial port holder $pid ($cmd)..."
          kill -TERM "$pid" 2>/dev/null || true
          sent_any=true
        fi
      fi
    done

    if [[ "$sent_any" == true ]]; then
      sleep 1
    fi
  }

  find_bootsel_volume() {
    local vol=""

    if [[ "$HOST_OS" == "Darwin" ]]; then
      [[ -d "/Volumes/RP2350" ]] && vol="/Volumes/RP2350"
      [[ -z "$vol" && -d "/Volumes/RPI-RP2" ]] && vol="/Volumes/RPI-RP2"
    else
      local p
      for p in \
        "/media/${USER}/RP2350" \
        "/media/RP2350" \
        "/run/media/${USER}/RP2350" \
        "/mnt/wsl/RP2350" \
        "/media/${USER}/RPI-RP2" \
        "/media/RPI-RP2" \
        "/run/media/${USER}/RPI-RP2" \
        "/mnt/wsl/RPI-RP2"; do
        [[ -d "$p" ]] && vol="$p" && break
      done

      if [[ -z "$vol" && -n "${FLASH_UF2_VOL:-}" && -d "$FLASH_UF2_VOL" ]]; then
        vol="$FLASH_UF2_VOL"
      fi
    fi

    [[ -n "$vol" ]] && printf '%s\n' "$vol"
    return 0
  }

  log_usb_state() {
    echo "${COLOR_INFO}USB state:${COLOR_RESET}"
    if command -v lsusb >/dev/null 2>&1; then
      lsusb | grep -Ei '2e8a|rp2040|rp2' || true
    fi
    picotool_cmd info >/dev/null 2>&1 || true
  }

  [[ -n "${FLASH_SERIAL_PORT:-}" ]] && echo "Requested serial port: $FLASH_SERIAL_PORT"

  if [[ ${#pt_sel[@]} -gt 0 ]]; then
    echo "Device filter: ${pt_sel[*]}"
  else
    echo "No filter (--ser / .picotool_serial): picotool uses the first compatible Pico."
  fi

  local detected_ports=""
  detected_ports="$(wait_for_usb_serial_ports "$SERIAL_WAIT_SEC" 2>/dev/null || true)"
  if [[ -n "$detected_ports" ]]; then
    echo "Detected USB serial ports: $detected_ports"
    close_usb_serial_users
  else
    echo "Detected USB serial ports: none"
  fi

  fw_memory_report

  touch_serial_to_bootsel() {
    local port="$1"

    echo "Trying USB CDC reset to BOOTSEL via $port (1200 baud touch)..."
    echo "${COLOR_WARN}[INFO] If flashing is stuck here, make sure the serial console is closed.${COLOR_RESET}" >&2

    if [[ "$HOST_OS" == "Darwin" ]]; then
      stty -f "$port" 1200 hupcl clocal cread >/dev/null 2>&1 || return 1
    else
      stty -F "$port" 1200 hupcl clocal cread >/dev/null 2>&1 || return 1
    fi

    sleep 1
    return 0
  }

  wait_for_bootsel_ready() {
    local tries="${1:-40}"
    local i
    for ((i = 0; i < tries; i++)); do
      if picotool_cmd info >/dev/null 2>&1; then
        return 0
      fi
      sleep 0.25
    done
    return 1
  }

  wait_for_bootsel_volume() {
    local tries="${1:-40}"
    local i vol
    for ((i = 0; i < tries; i++)); do
      vol="$(find_bootsel_volume)"
      if [[ -n "$vol" ]]; then
        echo "BOOTSEL volume detected at $vol."
        return 0
      fi
      sleep 0.25
    done
    return 1
  }

  ensure_bootsel_via_serial_touch() {
    local port
    local touched=false

    while IFS= read -r port; do
      [[ -n "$port" ]] || continue
      if touch_serial_to_bootsel "$port"; then
        touched=true
        if wait_for_bootsel_ready; then
          echo "Pico entered BOOTSEL mode after USB CDC reset."
          return 0
        fi
        if wait_for_bootsel_volume; then
          echo "Pico entered BOOTSEL mode after USB CDC reset (confirmed via UF2 volume)."
          return 0
        fi
        echo "USB CDC reset via $port did not expose BOOTSEL yet."
      fi
    done < <(list_usb_serial_ports 2>/dev/null || true)

    if [[ "$touched" != true ]]; then
      echo "No candidate USB serial ports found for the 1200 baud BOOTSEL reset." >&2
    fi
    return 1
  }

  ensure_bootsel_mode() {
    echo "Searching for a connected Pico and requesting BOOTSEL mode..."
    log_usb_state

    if wait_for_bootsel_ready 8; then
      echo "A Pico is already reachable in BOOTSEL mode."
      return 0
    fi

    if list_usb_serial_ports >/dev/null 2>&1; then
      if picotool_cmd reboot -u >/dev/null 2>&1; then
        echo "Requested BOOTSEL via picotool reboot -u."
        if wait_for_bootsel_ready 40; then
          echo "Pico switched to BOOTSEL mode."
          return 0
        fi
      fi

      echo "picotool reboot did not succeed; trying USB CDC reset..."
      if ensure_bootsel_via_serial_touch; then
        return 0
      fi
    fi

    if wait_for_bootsel_ready 60; then
      echo "Pico became reachable in BOOTSEL mode."
      return 0
    fi

    return 1
  }

  reset_to_application_mode() {
    local tries="${1:-20}"
    local i
    for ((i = 0; i < tries; i++)); do
      if picotool_cmd reboot -a >/dev/null 2>&1; then
        echo "Pico reset back to application mode."
        return 0
      fi
      sleep 0.25
    done
    echo "Warning: unable to confirm an application-mode reset via picotool." >&2
    return 1
  }

  local bootsel_ready=false
  if ensure_bootsel_mode; then
    bootsel_ready=true
  else
    echo "Could not switch a connected Pico into BOOTSEL with picotool." >&2
    echo "If the board is already mounted as RPI-RP2, the UF2 fallback may still work." >&2
  fi

  if [[ "${FLASH_PREFER_UF2_VOLUME:-0}" == "1" ]]; then
    echo "Skipping picotool load and using UF2 volume flashing."
  else
    local load_uf2_ok=false
    echo "Trying picotool load (UF2) with timeout ${LOAD_TIMEOUT_SEC}s..."
    if run_picotool_load "$UF2" 2>&1; then
      load_uf2_ok=true
    fi
    if [[ "$load_uf2_ok" == true ]]; then
      echo "OK — picotool load (UF2) completed."
      reset_to_application_mode || true
      write_flash_memory_snapshot
      return 0
    fi
    echo "picotool load (UF2) failed or timed out after ${LOAD_TIMEOUT_SEC}s."

    if [[ -f "$ELF" ]]; then
      local load_elf_ok=false
      echo "Trying picotool load (ELF) with timeout ${LOAD_TIMEOUT_SEC}s..."
      if run_picotool_load "$ELF" 2>&1; then
        load_elf_ok=true
      fi
      if [[ "$load_elf_ok" == true ]]; then
        echo "OK — picotool load (ELF) completed."
        reset_to_application_mode || true
        write_flash_memory_snapshot
        return 0
      fi
      echo "picotool load (ELF) failed or timed out after ${LOAD_TIMEOUT_SEC}s."
    fi

    echo "picotool load failed; trying UF2 volume fallback..."
  fi

  if [[ "$bootsel_ready" != true ]]; then
    if [[ -n "${SERIAL_MONITOR_WARNING:-}" ]]; then
      echo "${COLOR_INFO}============================================================${COLOR_RESET}" >&2
      echo "${COLOR_INFO}${SERIAL_MONITOR_WARNING}${COLOR_RESET}" >&2
      echo "${COLOR_INFO}============================================================${COLOR_RESET}" >&2
    fi
    echo "picotool could not place the board in BOOTSEL mode: connect the Pico via USB (data cable)." >&2
    exit 1
  fi

  echo "Rebooted to UF2 mode; waiting for RP2350/RPI-RP2 (max ${WAIT_SEC}s, poll ${POLL_INTERVAL}s)..."
  if awk -v d="${BOOT_DELAY:-0}" 'BEGIN { exit !(d > 0) }'; then
    sleep "$BOOT_DELAY"
  fi

  local end VOL=""
  end=$(( $(date +%s) + WAIT_SEC ))

  while [[ $(date +%s) -lt $end ]]; do
    VOL="$(find_bootsel_volume)"
    [[ -n "$VOL" ]] && break
    sleep "$POLL_INTERVAL"
  done

  if [[ -z "${VOL:-}" || ! -d "$VOL" ]]; then
    echo "Timeout: RP2350/RPI-RP2 volume not found." >&2
    echo "Try physical BOOTSEL (hold button while plugging in USB)." >&2
    exit 1
  fi

  local bn dst
  bn="$(basename "$UF2")"
  dst="$VOL/$bn"
  echo "Copying $bn -> $VOL/"

  if [[ ! -w "$VOL" ]]; then
    echo "BOOTSEL volume is mounted but not writable: $VOL" >&2
    if [[ "$HOST_OS" == "Darwin" ]]; then
      echo "macOS may be blocking removable-volume writes for the current app/session." >&2
      echo "Grant Full Disk Access to Terminal/Cursor and retry from a newly started shell." >&2
    else
      echo "On Linux/WSL, verify the volume is mounted inside the Linux environment and is writable." >&2
    fi
  fi

  copy_uf2_to_volume() {
    local src="$1" d="$2"
    rm -f "$d" 2>/dev/null || true
    if cp "$src" "$d"; then
      return 0
    fi
    if [[ "$HOST_OS" == "Darwin" ]] && command -v ditto >/dev/null 2>&1 && ditto "$src" "$d"; then
      return 0
    fi
    if dd if="$src" of="$d" bs=65536 conv=fsync 2>/dev/null; then
      return 0
    fi
    return 1
  }

  if ! copy_uf2_to_volume "$UF2" "$dst"; then
    echo "ERROR: cannot write $dst (cp/ditto/dd failed)." >&2
    if [[ "$HOST_OS" == "Darwin" ]]; then
      echo "On macOS: grant Full Disk Access to Terminal/Cursor (Settings -> Privacy & Security -> Full Disk Access)." >&2
      echo "After changing permissions, fully restart the app that launched this shell before retrying." >&2
    fi
    exit 1
  fi

  sync 2>/dev/null || true
  reset_to_application_mode || true
  echo "OK — UF2 copied."
  write_flash_memory_snapshot
}

if [[ "$DO_BUILD" -eq 1 ]]; then
  run_build
fi

if [[ "$DO_FLASH" -eq 1 ]]; then
  run_flash
fi

echo "Done."
