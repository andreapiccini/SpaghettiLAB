#!/usr/bin/env python3
from __future__ import annotations

import argparse
import glob
import sys
import time
import zlib
from pathlib import Path

import host_test_tool as host


def candidate_ports(requested: str | None) -> list[str]:
    if requested:
        return [requested]
    patterns = (
        "/dev/cu.usbmodem*", "/dev/tty.usbmodem*",
        "/dev/cu.usbserial*", "/dev/ttyACM*", "/dev/ttyUSB*",
    )
    return sorted({port for pattern in patterns for port in glob.glob(pattern)})


def connect_lowside(ports: list[str], pb2, timeout: float):
    version, proto_hash = host.parse_identity()
    for port in ports:
        try:
            ser = host.open_serial(port, 115200, 0.1)
            time.sleep(1.0)
            nonce = host.NonceGenerator()
            if host.connect_on_open_serial(
                ser, pb2, version or 1, proto_hash or 0, nonce, timeout
            ) == 0:
                return ser, port, nonce
            ser.close()
        except Exception as exc:
            print(f"Skipping {port}: {exc}", file=sys.stderr)
    raise SystemExit("No compatible SenseDial low-side serial port found.")


def send_acked(ser, pb2, msg, timeout: float) -> None:
    host.send_frame(ser, host.cobs_frame(host.encode_message(msg)))
    deadline = time.monotonic() + timeout
    for frame in host.iter_frames(ser, deadline):
        try:
            reply = host.decode_to_host_frame(frame, pb2)
        except Exception:
            continue
        if host.payload_name(reply) == "ack" and reply.ack.nonce == msg.nonce:
            return
    raise SystemExit(f"OTA stopped: no ACK for nonce {msg.nonce}")


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Flash ESP32-S3 high-side through the RP2350 UART bridge."
    )
    parser.add_argument("image", type=Path)
    parser.add_argument("--port")
    parser.add_argument("--timeout", type=float, default=3.0)
    args = parser.parse_args()

    image = args.image.read_bytes()
    if not image:
        raise SystemExit("High-side firmware image is empty.")
    host.generate_python_bindings(host.DEFAULT_PYTHON_OUT)
    pb2 = host.load_pb2(host.DEFAULT_PYTHON_OUT)
    ser, port, nonces = connect_lowside(candidate_ports(args.port), pb2, args.timeout)
    version = host.parse_identity()[0] or 1
    crc = zlib.crc32(image) & 0xFFFFFFFF
    print(f"Low-side: {port}")
    print(f"High-side image: {len(image)} bytes, CRC32={crc:08X}")

    try:
        start = pb2.FromHost(
            protocol_version=version, nonce=nonces.take(),
            firmware_update_start=pb2.HostFirmwareUpdateStart(
                target=pb2.FIRMWARE_TARGET_HIGHSIDE,
                image_size=len(image), chunk_size=256, expected_crc32=crc,
            ),
        )
        send_acked(ser, pb2, start, args.timeout)

        for offset in range(0, len(image), 256):
            chunk = image[offset:offset + 256]
            message = pb2.FromHost(
                protocol_version=version, nonce=nonces.take(),
                firmware_update_chunk=pb2.HostFirmwareUpdateChunk(
                    target=pb2.FIRMWARE_TARGET_HIGHSIDE,
                    offset=offset, data=chunk,
                ),
            )
            send_acked(ser, pb2, message, args.timeout)
            done = offset + len(chunk)
            if done == len(image) or done % (32 * 1024) < 256:
                print(f"Transferred {done}/{len(image)} bytes")

        finish = pb2.FromHost(
            protocol_version=version, nonce=nonces.take(),
            firmware_update_finish=pb2.HostFirmwareUpdateFinish(
                target=pb2.FIRMWARE_TARGET_HIGHSIDE,
            ),
        )
        send_acked(ser, pb2, finish, args.timeout)
        print("High-side image transferred; waiting for CRC verification and reboot...")
        time.sleep(4.0)
        verify_nonce = nonces.take()
        request = host.build_request_state(
            pb2, verify_nonce, version, True, True, False
        )
        host.send_frame(ser, host.cobs_frame(host.encode_message(request)))
        state = host.wait_for_host_state(ser, pb2, args.timeout, verify_nonce)
        if state is None or not state.host_state.highside.ready:
            raise SystemExit(
                "ESP32 did not reconnect after OTA. Connect its USB serial to inspect OTA logs."
            )
        print("High-side OTA verified: ESP32 rebooted and protobuf link is ready.")
    finally:
        ser.close()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
