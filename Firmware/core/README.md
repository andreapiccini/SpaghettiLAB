# Zephyr on ESP32-C3

A Docker-based development environment for the Zephyr 4.4.0 firmware running on
`esp32c3_devkitm/esp32c3`.

Docker provides Zephyr, West, the RISC-V toolchain, modules, and dependencies.
The source code and generated `build/` directory stay on the host computer.

## Requirements

- Docker Desktop with Docker Compose
- An ESP32-C3 board connected over USB
- About 15 GB of free disk space for the first Docker image build
- `make` on Linux and macOS (optional, but used by the shortcuts below)
- `esptool` on macOS and Windows for flashing from the host

Install `esptool` on macOS:

```sh
brew install esptool
```

Install it on Windows from PowerShell:

```powershell
py -m pip install esptool
```

## Quick start

Build the Docker image once:

```sh
make image
```

Then build the firmware:

```sh
make build
```

On Windows, where `make` may not be installed, use these PowerShell commands:

```powershell
docker compose build
docker compose run --rm dev sh -lc 'west build -p auto -b "$BOARD" -d build .'
```

The flashable firmware is generated at:

```text
build/zephyr/zephyr.bin
```

The first image build can take a while because it downloads Zephyr, the West
modules, the toolchain, and Espressif binary blobs. Docker caches completed
steps, so later builds are much faster.

## Flash and monitor

### Linux

Find the serial device:

```sh
ls /dev/ttyACM* /dev/ttyUSB* 2>/dev/null
```

The default is `/dev/ttyACM0`. To use another device, copy `.env.example` to
`.env` and change `ESP32_PORT`.

```sh
make flash
make monitor
```

Your user may need serial-port access. On many distributions, add the user to
the `dialout` group and then sign out and back in:

```sh
sudo usermod -aG dialout "$USER"
```

### macOS

Docker Desktop does not normally expose the USB serial device to the container,
so build in Docker and flash from macOS.

Find the port:

```sh
ls /dev/cu.usbmodem* /dev/cu.usbserial* 2>/dev/null
```

Flash the board, replacing the example port if needed:

```sh
esptool --chip esp32c3 --port /dev/cu.usbmodem1101 --baud 460800 \
  write-flash --flash-mode dio --flash-freq 80m --flash-size 4MB \
  0x0 build/zephyr/zephyr.bin
```

Open the serial console:

```sh
screen /dev/cu.usbmodem1101 115200
```

To exit `screen`, press `Ctrl-A`, then `K`, then `Y`.

### Windows

Build in Docker and flash from PowerShell. Find the board's COM port in
**Device Manager > Ports (COM & LPT)**, then replace `COM3` below if needed:

```powershell
py -m esptool --chip esp32c3 --port COM3 --baud 460800 write-flash --flash-mode dio --flash-freq 80m --flash-size 4MB 0x0 build/zephyr/zephyr.bin
```

Open the serial console:

```powershell
py -m serial.tools.miniterm COM3 115200
```

Press `Ctrl-]` to close the monitor.

Only one program can use the serial port at a time. Close the monitor before
flashing again.

## Common commands

| Command | Description |
|---|---|
| `make image` | Build the Docker development image |
| `make build` | Run an incremental firmware build |
| `make pristine` | Reconfigure and rebuild from scratch |
| `make shell` | Open a shell in the Zephyr environment |
| `make flash` | Flash the board from a native Linux host |
| `make monitor` | Open the serial monitor from a native Linux host |
| `make clean` | Remove the CMake build artifacts |

Useful Windows equivalents:

```powershell
# Open the Zephyr shell
docker compose run --rm dev

# Rebuild from scratch
docker compose run --rm dev sh -lc 'west build -p always -b "$BOARD" -d build .'

# Remove build artifacts
docker compose run --rm dev west build -d build -t pristine
```

## Project layout

```text
.
├── src/                                    application source code
├── prj.conf                                Zephyr/Kconfig settings
├── boards/esp32c3_devkitm_esp32c3.overlay  additional hardware settings
├── CMakeLists.txt                          build configuration
├── Dockerfile                              Zephyr development image
├── compose.yaml                            common container configuration
├── compose.linux.yaml                      Linux USB passthrough
└── Makefile                                command shortcuts
```

The `build/` directory is generated locally and can be safely recreated.

## Documentation

Start with the roadmap when implementing features and use the architecture and
component documents as design references.

| Guide | Use it for |
|---|---|
| [Implementation roadmap](IMPLEMENTATION_ROADMAP.md) | Ordered milestones, build gates, and hardware tests |
| [Firmware architecture](ARCHITECTURE.md) | Ownership, dependencies, control flow, and runtime model |
| [Public interfaces](include/spaghetti/README.md) | Shared types and public API boundaries |
| [Board support](boards/spaghettilab/README.md) | Core variants and static hardware descriptions |
| [Devicetree bindings](dts/bindings/spaghetti/README.md) | Spaghetti-specific hardware schemas |
| [Module implementations](spaghetti_modules/README.md) | External sensor and actuator drivers |
| [Subsystems](subsys/core/README.md) | Core, Port, Config, Runtime, Data, and other firmware layers |
| [Services](subsys/services/README.md) | MQTT, storage, and timer services |

### Subsystem reference

| Architecture | Lifecycle and I/O | Services |
|---|---|---|
| [Core](subsys/core/README.md) | [Module Manager](subsys/module_manager/README.md) | [MQTT](subsys/services/mqtt/README.md) |
| [Port](subsys/port/README.md) | [Discovery](subsys/discovery/README.md) | [Storage](subsys/services/storage/README.md) |
| [Driver Registry](subsys/driver_registry/README.md) | [Communication](subsys/communication/README.md) | [Timer](subsys/services/timer/README.md) |
| [Config](subsys/config/README.md) | [Data](subsys/data/README.md) | [Power](subsys/power/README.md) |
| [Runtime](subsys/runtime/README.md) | [SHT40 module](spaghetti_modules/sht40/README.md) | [Relay module](spaghetti_modules/relay/README.md) |

## Licensing and third-party software

This firmware uses the Zephyr Project RTOS, which is primarily licensed under
the Apache License 2.0. Zephyr also includes modules and optional binary blobs
that may use other licenses.

Before redistributing a firmware binary, Docker image, or product containing the
firmware, read [`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md) and include the
applicable license and attribution material with the distribution. A local copy
of Zephyr's primary license is provided in
[`LICENSES/Apache-2.0.txt`](LICENSES/Apache-2.0.txt).

The license for original SpaghettiLAB source code is separate from the licenses
of Zephyr and its dependencies; the third-party notices do not relicense that
code.

## Troubleshooting

### The serial port is busy

Close `screen`, miniterm, IDE serial monitors, and any other program using the
same port.

### `esptool` cannot connect

- Check that the selected serial port is still correct.
- Close any open serial monitor.
- Hold **BOOT**, press and release **RESET**, release **BOOT**, and retry.
- If necessary, change the flash baud rate from `460800` to `115200`.

### The serial console is empty

- Use `115200` baud.
- Press **RESET** after opening the monitor.
- Check the console and serial settings in the board overlay and `prj.conf`.

### A configuration change is ignored

Run a pristine build:

```sh
make pristine
```

On Windows, use the equivalent command shown above.
