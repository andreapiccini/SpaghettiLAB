# SenseDial Host Test Tool

`host_test_tool.py` is a small developer CLI for talking to the SenseDial low-side firmware over USB serial.

It acts strictly as the Host side:

- sends `SenseDial.LowSide.FromHost`
- receives and decodes `SenseDial.LowSide.ToHost`
- uses protobuf payloads framed with COBS and terminated by `0x00`

Current handshake model:

- the low-side passively waits for `FromHost.protocol_info`
- the host sends `protocol_info` when it wants to connect
- the low-side validates version/hash and replies with `ToHost.ack`
- the recommended CLI entrypoint is `connect`

## Host system requisites

A protobuf compiler will be needed.
For Linux users:

```bash
sudo apt update
sudo apt install protobuf-compiler
protoc --version # Optional to verify installation
```

For Windows users:

1. Download the latest release from:
   https://github.com/protocolbuffers/protobuf/releases

2. Download the archive:
protoc-<version>-win64.zip

3. Extract it to a folder, for example:
C:\protoc

4. Add the `bin` directory to your PATH:
C:\protoc\bin

5. Verify installation:
```powershell
protoc --version
```

## Install

Local virtualenv inside `firmware/tools`:

```bash
cd firmware/tools
python3 -m venv .venv
source .venv/bin/activate
python3 -m pip install --upgrade pip
python3 -m pip install -r requirements.txt
```

If you prefer without a virtualenv:

```bash
python3 -m pip install -r firmware/tools/requirements.txt
```

## Flash Helpers

This folder also contains custom flash helpers used by PlatformIO:

- `build_and_flash_lowside.sh` for RP2040 / Pico-style flashing
- `build_and_flash_highside.sh` for ESP32-S3 flashing

Both scripts support the same basic modes:

- build + flash
- build only
- flash only

## Generate Python protobuf bindings

```bash
python3 firmware/tools/host_test_tool.py generate-python
```

From the local virtualenv:

```bash
cd firmware/tools
source .venv/bin/activate
python3 host_test_tool.py generate-python
```

This writes `sensedial_lowside_pb2.py` under `firmware/tools/_generated/`.

The generator uses the checked-in repo schema:

- `proto/sensedial_lowside.proto`

and resolves `nanopb.proto` from either:

- the local PlatformIO libdeps tree
- the installed Python `nanopb` package

## High-Side Flashing

The high-side helper expects the `highside` PlatformIO environment to be configured for the ESP32-S3 target and Arduino framework.

Examples:

```bash
./firmware/tools/build_and_flash_highside.sh
./firmware/tools/build_and_flash_highside.sh --no-flash
./firmware/tools/build_and_flash_highside.sh --flash-only
```

From PlatformIO, `highside` upload is wired to that script through `upload_command`.

## High-Side Protocol Probe

The host-side serial tool includes a probe that checks the end-to-end `protocol_info` path:

```bash
python3 firmware/tools/host_test_tool.py probe-highside --port /dev/cu.usbmodem1234
```

The probe:

- authenticates the host link with the low-side
- lets the low-side request `protocol_info` from the high-side
- polls `host_state` until `highside.ready` becomes true, or times out

## Examples

Listen and decode incoming low-side messages:

```bash
python3 firmware/tools/host_test_tool.py --port /dev/cu.usbmodem1234 --listen
```
On Linux
```bash
python3 firmware/tools/host_test_tool.py --port /dev/ttyACM0 --listen
```

From inside `firmware/tools` with the local virtualenv:

```bash
cd firmware/tools
source .venv/bin/activate
python3 host_test_tool.py --port /dev/cu.usbmodem1234 --listen
```

Connect and keep listening:

```bash
python3 firmware/tools/host_test_tool.py connect --port /dev/cu.usbmodem1234
```

Open an interactive session with one persistent serial connection:

```bash
python3 firmware/tools/host_test_tool.py session --port /dev/cu.usbmodem1234
```

Connect with an explicit timeout for the ACK:

```bash
python3 firmware/tools/host_test_tool.py connect --port /dev/cu.usbmodem1234 --response-timeout 2.0
```

Send protocol info once and wait for ACK:

```bash
python3 firmware/tools/host_test_tool.py protocol-info --port /dev/cu.usbmodem1234
```

Send request-state once:

```bash
python3 firmware/tools/host_test_tool.py request-state --port /dev/cu.usbmodem1234
```

Auto-connect first, then send request-state:

```bash
python3 firmware/tools/host_test_tool.py request-state --port /dev/cu.usbmodem1234 --auto-connect
```

Send a reboot host command:

```bash
python3 firmware/tools/host_test_tool.py host-command --port /dev/cu.usbmodem1234 reboot
```

Auto-connect first, then send reboot:

```bash
python3 firmware/tools/host_test_tool.py host-command --port /dev/cu.usbmodem1234 reboot --auto-connect
```

Send a clear-faults host command:

```bash
python3 firmware/tools/host_test_tool.py host-command --port /dev/cu.usbmodem1234 clear-faults
```

Send a command and keep listening afterward:

```bash
python3 firmware/tools/host_test_tool.py host-command --port /dev/cu.usbmodem1234 reboot --listen-after
```

## Notes

- The tool reads protocol version and hash from `proto/generated/sensedial_proto_identity.h` when available.
- You can override protocol values on the CLI with `--proto-version` and `--proto-hash`.
- `connect`, `request-state`, and `host-command` can fail fast with `--response-timeout` instead of waiting forever.
- `request-state` and `host-command` support `--auto-connect` to authenticate the host link first.
- `session` keeps the serial port open, authenticates once, and provides a tiny interactive prompt for common test actions.
- Nonces are auto-incremented by default; pass `--nonce` only when you want to force a specific value.
- Output includes nonce and active `oneof payload` name for both sent and received frames.
- `protocol-info` is host-driven: it sends `FromHost.protocol_info` immediately instead of waiting for `request_protocol_info`.
