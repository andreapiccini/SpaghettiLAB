#!/bin/sh
# Host-side USB Protocol V1 bridge for Safari / browsers without Web Serial.
# Docker on macOS cannot see /dev/cu.usbmodem*; the browser talks to
# ws://127.0.0.1:8766 on this machine. Started by `make up-d`.
set -e

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname "$0")" && pwd)
CORE=$(CDPATH= cd -- "$SCRIPT_DIR/../../../Firmware/core" && pwd)
RUN="$CORE/.run"
PIDFILE="$RUN/usb-bridge.pid"
LOG="$RUN/usb-bridge.log"
LISTEN_HOST=127.0.0.1
LISTEN_PORT=8766

port_open() {
	python3 -c "import socket; s=socket.socket(); s.settimeout(0.4); s.connect(('$LISTEN_HOST', $LISTEN_PORT))" 2>/dev/null
}

python_bin() {
	if [ -x "$CORE/.venv/bin/python" ]; then
		printf '%s\n' "$CORE/.venv/bin/python"
		return 0
	fi
	if [ -x "$CORE/.venv/Scripts/python.exe" ]; then
		printf '%s\n' "$CORE/.venv/Scripts/python.exe"
		return 0
	fi
	return 1
}

cmd_status() {
	if port_open; then
		printf 'USB bridge listening on ws://%s:%s\n' "$LISTEN_HOST" "$LISTEN_PORT"
		return 0
	fi
	printf 'USB bridge is not running\n'
	return 1
}

cmd_stop() {
	if [ -f "$PIDFILE" ]; then
		pid=$(cat "$PIDFILE" 2>/dev/null || true)
		if [ -n "$pid" ] && kill -0 "$pid" 2>/dev/null; then
			kill "$pid" 2>/dev/null || true
			i=0
			while [ "$i" -lt 20 ] && kill -0 "$pid" 2>/dev/null; do
				sleep 0.1
				i=$((i + 1))
			done
			kill -9 "$pid" 2>/dev/null || true
		fi
		rm -f "$PIDFILE"
	fi
	if port_open; then
		printf 'USB bridge port %s is still in use by another process\n' "$LISTEN_PORT" >&2
		return 1
	fi
	printf 'USB bridge stopped\n'
}

cmd_start() {
	if port_open; then
		printf 'USB bridge already on ws://%s:%s\n' "$LISTEN_HOST" "$LISTEN_PORT"
		return 0
	fi
	mkdir -p "$RUN"
	make -C "$CORE" host-tools
	py=$(python_bin) || {
		printf 'host Python venv missing after make host-tools\n' >&2
		return 1
	}
	(
		CDPATH= cd -- "$CORE" || exit 1
		export PYTHONPATH="$CORE${PYTHONPATH:+:$PYTHONPATH}"
		exec "$py" -m tools.usb_bridge --listen "$LISTEN_HOST:$LISTEN_PORT"
	) >>"$LOG" 2>&1 &
	echo $! >"$PIDFILE"
	i=0
	while [ "$i" -lt 50 ]; do
		if port_open; then
			printf 'USB bridge on ws://%s:%s\n' "$LISTEN_HOST" "$LISTEN_PORT"
			return 0
		fi
		sleep 0.1
		i=$((i + 1))
	done
	printf 'USB bridge did not open %s:%s; see %s\n' "$LISTEN_HOST" "$LISTEN_PORT" "$LOG" >&2
	return 1
}

case "${1:-start}" in
start) cmd_start ;;
stop) cmd_stop ;;
restart)
	cmd_stop || true
	cmd_start
	;;
status) cmd_status ;;
*)
	printf 'usage: %s start|stop|restart|status\n' "$0" >&2
	exit 2
	;;
esac
