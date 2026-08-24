# Sense Dial Firmware

Firmware workspace for the two-board Sense Dial architecture.

## Overview

The firmware is split into two targets:

- `lowside`
  Raspberry Pi Pico / RP2040 side.
  This board is the motor-control side. It is intended to run the FOC loop, talk to the host, and exchange control/status messages with `highside`.

- `highside`
  ESP32 side.
  This board is intended to handle connectivity, UI/display, and higher-level application logic.

The two boards communicate over a serial link using protobuf-defined messages.

## Waveshare Round AMOLED High-Side

The `highside` PlatformIO environment targets the Waveshare
ESP32-S3-Touch-AMOLED-1.43 (466 x 466, SH8601 or CO5300). It is completely
separate from the RP2350 `lowside` environment.

| Waveshare ESP32-S3 | SenseDial low-side |
| --- | --- |
| GPIO 43 (TX) | GPIO 9 (Serial2 RX) |
| GPIO 44 (RX) | GPIO 8 (Serial2 TX) |
| GND | GND |

Use crossed 3.3 V UART signals and a common ground. Do not connect the motor
supply to the ESP32-S3.

```bash
# Build only
./tools/build_and_flash_highside.sh --no-flash

# Build and flash the ESP32-S3
./tools/build_and_flash_highside.sh
```

The display requests protobuf `DialState` at 20 Hz and renders the physical
position, dynamic detents, endstops, endstop force and motor/link status. It
does not require changes to the low-side firmware.

### Build and update both processors

The first firmware containing the OTA partition table must be flashed once to
the ESP32-S3 over USB:

```bash
./tools/build_and_flash_highside.sh
```

Subsequent complete device updates require USB only on the RP2350. The script
builds both images, flashes the low-side, then streams the ESP32 application
through the low-side UART with per-chunk ACK, image-size and CRC32 validation:

```bash
./tools/build_and_flash_device.sh
# If more than one USB serial device is present:
./tools/build_and_flash_device.sh --port /dev/cu.usbmodemXXXX
```

## Intended System Architecture

### Low-Side

`lowside` is the real-time side of the system.

Responsibilities:

- motor driver / FOC execution
- host-facing interface
- low-latency control path
- execution of commands coming from `highside`
- status/fault reporting back to `highside` and to the host

Typical data flow:

- receives commands or configuration from `highside`
- applies motor-control logic locally
- reports state, readiness, calibration state, and faults
- exposes a host link for external control/debug tools

### High-Side

`highside` is the application and connectivity side.

Responsibilities:

- connectivity
- display/UI management
- orchestration / business logic
- translation between user-facing state and motor-side actions

Typical data flow:

- gathers UI or connectivity events
- sends requests/configuration/commands to `lowside`
- receives status and faults from `lowside`
- presents state to the user or remote clients

## Message Exchange

The project uses protobuf schemas stored outside this folder:

- `../proto/sensedial_lowside.proto`

Generated outputs are written to:

- `../proto/generated/`

Current protocol split:

- `lowside` canonical protocol
  Contains both `Host <-> LowSide` and `LowSide <-> HighSide`

The pre-build step generates:

- `sensedial_lowside.pb.c/.h`
- `sensedial_proto_identity.h`

`sensedial_proto_identity.h` contains the canonical low-side protocol version/hash used to detect schema mismatches between boards.

## Why The Proto Files Live Outside `firmware`

This repository does not use the default "put proto files wherever the library expects them" workflow.

Instead, the custom generation step keeps:

- `.proto` files in `../proto/`
- generated C/H files in `../proto/generated/`

This was chosen to:

- keep schemas in a shared, stable location
- make the protocol reusable outside the firmware build
- keep generated files predictable
- allow custom generated metadata like `sensedial_proto_identity.h`

## Build System

PlatformIO is the build system.

Configuration lives in [platformio.ini](/Users/andreapiccini/dev/sense-dial/firmware/platformio.ini:1).

Key points:

- default environment is `lowside`
- source root is `src`
- a pre-build script regenerates protobuf sources
- the same pre-build script registers generated nanopb `.pb.c` files as external compilation units
- `lowside` and `highside` are separate PlatformIO environments

### Pre-build Proto Generation

Proto generation is handled by:

- [scripts/generate_nanopb_sources.py](/Users/andreapiccini/dev/sense-dial/firmware/scripts/generate_nanopb_sources.py:1)

It is hooked into PlatformIO with:

- `pre:scripts/generate_nanopb_sources.py`

What it does:

- ensures Python package `nanopb==0.4.9.1` is available
- runs the nanopb generator on the `.proto` files
- writes generated files into `../proto/generated`
- writes `sensedial_proto_identity.h`
- patches `nanopb-arduino` for the RP2040 Arduino Mbed core
- adds the generated `.pb.c` files to the PlatformIO build

This is separate from the embedded nanopb runtime used by the firmware itself.

## Libraries

### `eric-wieser/nanopb-arduino@^1.1.0`

Used on both firmware targets to bridge nanopb streams with Arduino `Print` and `Stream`.

What it provides:

- `as_pb_ostream(Print&)`
- `as_pb_istream(Stream&)`
- a small Arduino-facing compatibility layer around nanopb

Why it is needed:

- the firmware exchanges protobuf messages over Arduino serial streams
- the stock upstream package needs a small pre-build patch on RP2040 Arduino Mbed

Runtime note:

- `nanopb-arduino` pulls in `Nanopb` transitively
- that transitive `Nanopb` package provides `pb.h`, `pb_encode`, `pb_decode`, and `pb_common`
- the Python generator alone is not enough for firmware compilation

### `askuric/Simple FOC@^2.4.0`

Used on `lowside`.

What it is for:

- field-oriented control support
- motor abstractions
- control primitives for the motor side

Expected role in this project:

- drive the motor from the low-side RP2040
- implement the real-time control loop

### `eric-wieser/PacketIO@^0.3.0`

Used for serial packet framing.

What it is for:

- COBS framing helpers for stream-based transport
- packet-oriented IO over UART/serial links

Note:

This is the framing layer currently used around the protobuf payloads.

## Source Layout

- `src/lowside/`
  Low-side firmware entrypoint and low-side-specific code

- `src/highside/`
  High-side firmware entrypoint and high-side-specific code

- `src/common/`
  Shared firmware sources

- `scripts/`
  Build-time helper scripts

- `tools/`
  Local tooling, including custom flash helpers

## Current Low-Side Receive Architecture

The low-side receive path is organized into five layers:

1. `src/lowside/main.cpp`
2. `lib/app_layer/`
3. `lib/shared_memory/`
4. `lib/proto_pack/`
5. `lib/link_layer/`

The goal is to keep the real-time main loop small and keep protocol details
in the layers that own them.

### `main.cpp`: high-level orchestration only

The low-side `main.cpp` should stay small.

At the moment its loop only does:

- call `process_incoming_links()`
- run future high-level low-side logic, such as sharing data with the FOC core

It should **not** know:

- how protobuf frames are decoded
- how COBS framing works
- how the protocol handshake is validated
- how host/high-side readiness is tracked
- how incoming messages are routed to handlers

### `link_layer`: transport + protocol gating

`lib/link_layer` owns the wire-level behavior for both links:

- COBS framing/unframing
- nanopb encode/decode
- protocol handshake via `protocol_info`
- version/hash validation against `sensedial_proto_identity.h`
- per-link readiness gating

`link_layer` does not own protobuf message construction anymore.
It uses shared helpers from `lib/proto_pack/` to emit protocol-level
messages such as ACKs or protocol requests.

Important current behavior:

- the host link is **host-driven**
- the high-side link is **high-side-driven**
- low-side does not need to keep sending `request_protocol_info` as the main flow
- a normal application message is only returned to upper layers after that link has completed a valid `protocol_info` exchange
- if an authenticated link is considered disconnected, its authenticated session is dropped and the next peer must authenticate again

That means the gating happens in `receive_from_host()` and `receive_from_highside()`:

- if `protocol_info` arrives, `link_layer` validates it internally and sends the ACK internally
- if the link is not ready yet, the message never reaches the application handlers

### `app_layer`: application receive layer

`lib/app_layer` sits above `link_layer`.

Its responsibilities are:

- poll both links
- refresh the shared runtime snapshot used by the control-plane and the
  real-time core
- dispatch already-authenticated messages to application handlers
- use shared packing helpers to emit application-level replies such as `pack(to_host::state(...))`

It intentionally hides its internal state from `main.cpp`.

So, from the point of view of the application layer:

- `handle_from_host(...)` receives only valid, already-authenticated host messages
- `handle_from_highside(...)` receives only valid, already-authenticated high-side messages

In practice this means:

- if you want to implement the behavior of a received host message, work inside the `handle_host_*` helpers
- if you want to implement the behavior of a received high-side message, work inside the `handle_highside_*` helpers
- if you want to change transport, framing, handshake, or readiness rules, work in `link_layer`

### `shared_memory`: cross-core runtime snapshot

`lib/shared_memory` owns the small piece of shared memory that can be read and
written by both low-side cores.

It is used for data that should survive beyond a single handler call, such as:

- link readiness flags
- shared status snapshots
- dial state
- firmware update status

Access is always done through helper functions that take care of the race
between reader and writer using a cross-core critical section.

### `proto_pack`: protobuf packing helpers

`lib/proto_pack` owns the shared `pack(...)`, `unpack(...)`, `to_shared::...`,
`to_host::...`, and `to_highside::...` helpers.

This keeps message construction in one place while avoiding an inverted
dependency like `link_layer -> app_layer`.

In practice:

- `link_layer` uses it for protocol/control-plane payloads such as ACKs
- `app_layer` uses it for application payloads such as `host_state`
- `shared_memory` reads snapshots with `shared::read(unpack(from_shared::snapshot))`
- `shared_memory` writes translated values with `shared::write(pack(to_shared::...))`

### Current Mental Model

The simplest way to think about the current receive-side architecture is:

- `main.cpp` = runtime orchestration
- `app_layer` = application dispatch
- `shared_memory` = cross-core runtime snapshot
- `proto_pack` = shared protobuf packing helpers
- `link_layer` = transport + protocol validation

So when a new message arrives:

1. `link_layer` reads and decodes it
2. `link_layer` blocks it if that link is not authenticated yet
3. `app_layer` receives it only if it is valid for the application layer
4. the specific `handle_host_*` or `handle_highside_*` helper performs the behavior

## Current State

The low-side runtime is intentionally layered:

- `main.cpp` stays small and only orchestrates initialization plus the top-level loop
- `link_layer` owns protocol gating and wire handling
- `app_layer` owns application dispatch
- `shared_memory` owns the cross-core snapshot

The high-side entrypoint is still a placeholder while that side of the system is being built out.

That means:

- the architecture documented here is the intended design
- the proto generation pipeline is active
- the low-side control-plane path is already split into dedicated layers
- the high-side runtime is still being filled in

## Proto Compilation Integration

Generated nanopb `.c` files are compiled into the firmware by the pre-build script:

- [scripts/generate_nanopb_sources.py](/Users/andreapiccini/dev/sense-dial/firmware/scripts/generate_nanopb_sources.py:1)

The script:

- generates `sensedial_lowside.pb.c/.h`
- adds the generated `.pb.c` files to the PlatformIO build as external sources
- avoids the old `proto_compile.c` include-wrapper workaround

## Building

Build the default environment:

```bash
platformio run
```

Build `lowside` explicitly:

```bash
platformio run -e lowside
```

Build `highside` explicitly:

```bash
platformio run -e highside
```

## Flashing `lowside`

`lowside` uses a custom upload flow:

- [tools/build_and_flash_lowside.sh](/Users/andreapiccini/dev/sense-dial/firmware/tools/build_and_flash_lowside.sh:1)

This script exists to make RP2040 flashing more reliable and to handle repeated reflashing without manually unplugging the board each time.

It supports:

- build + flash
- build only
- flash only
- automatic `picotool` usage
- BOOTSEL switching
- memory usage reporting
- snapshot writing for the low-side build

Examples:

```bash
./tools/build_and_flash_lowside.sh
./tools/build_and_flash_lowside.sh --no-flash
./tools/build_and_flash_lowside.sh --flash-only
```

From PlatformIO, `lowside` upload is wired to that script through `upload_command`.

## Memory Report

Memory reporting is handled by:

- [scripts/fw_memory_report.py](/Users/andreapiccini/dev/sense-dial/firmware/scripts/fw_memory_report.py:1)

It reads the generated ELF and reports:

- flash usage
- static RAM usage

It also writes a snapshot file here by default:

- `src/lowside/.fw_memory_snapshot.json`

## Prerequisites

For a fresh clone, you generally need:

- PlatformIO
- the PlatformIO-managed libraries from `platformio.ini`
- Python available to PlatformIO
- `picotool` if you want to flash `lowside` through the custom script

The Python nanopb generator package is installed automatically by `generate_nanopb_sources.py` when needed.

## Recommended Workflow

1. Edit `.proto` files in `../proto/` when message schemas change.
2. Build with PlatformIO.
3. Let the pre-build step regenerate the nanopb sources automatically.
4. Use the custom low-side flash flow for RP2040 uploads.
5. Keep low-side and high-side protocol changes in sync.

## Notes

- `lowside` is the motor-control side.
- `highside` is the connectivity/display side.
- Both firmware targets are expected to stay protocol-compatible through the generated proto identity header.
- The current implementation is intentionally in transition, but the build tooling is already structured around the final architecture.
