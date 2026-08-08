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

Every firmware build runs [`validator`](VALIDATOR.md) before compilation. It
reports objective errors in red and review warnings in orange, including the
file, line, correction, and implementation-guide section. Convention findings
do not stop compilation. Run `make validate` for the same check without building,
or `make build VALIDATOR_QUIET=1` to run it without printing its report.

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
| `make validate` | Check firmware writing conventions without compiling |
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
├── src/                                    application entry point
├── include/spaghetti/                      public firmware contracts
├── subsys/                                 common subsystem implementations
├── spaghetti_modules/                      removable-module drivers
├── boards/                                 board definitions and overlays
├── dts/bindings/spaghetti/                 project Devicetree schemas
├── templates/firmware/                     copyable implementation skeletons
├── validator                               pre-build firmware convention checker
├── FILE_MAP.md                             what to read before each kind of change
├── prj.conf                                Zephyr/Kconfig settings
├── CMakeLists.txt                          build configuration
├── Dockerfile                              Zephyr development image
├── compose.yaml                            common container configuration
├── compose.linux.yaml                      Linux USB passthrough
└── Makefile                                command shortcuts
```

The `build/` directory is generated locally and can be safely recreated.

## Documentation

Start with the architecture overview, then open a component document only when
you need its detailed contract.

| Guide | Use it for |
|---|---|
| [Firmware architecture](ARCHITECTURE.md) | Generic model, ownership, data flow, and practical examples |
| [Implementation guide](FIRMWARE_IMPLEMENTATION_GUIDE.md) | Mandatory coding rules, decisions, workflow, and copyable templates |
| [File map](FILE_MAP.md) | What each file contains and what to read before each kind of task |
| [Firmware validator](VALIDATOR.md) | Pre-build checks, commands, severities, scope, and corrections |
| [Public interfaces](include/spaghetti/README.md) | Shared types and public API boundaries |
| [Board support](boards/spaghettilab/README.md) | Core variants and static hardware descriptions |
| [Devicetree bindings](dts/bindings/spaghetti/README.md) | Spaghetti-specific hardware schemas |
| [Module implementations](spaghetti_modules/README.md) | External sensor and actuator drivers |
| [Optional services](subsys/services/README.md) | Replaceable timing, persistence, or transport capabilities |

### Subsystem reference

| Foundation | Runtime model | Boundaries |
|---|---|---|
| [Core](subsys/core/README.md) | [Module Manager](subsys/module_manager/README.md) | [Config](subsys/config/README.md) |
| [Port](subsys/port/README.md) | [Data](subsys/data/README.md) | [Communication adapters](subsys/communication/README.md) |
| [Driver Registry](subsys/driver_registry/README.md) | [Runtime](subsys/runtime/README.md) | [Optional Discovery](subsys/discovery/README.md) |

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

### The validator reports convention findings

Review each `ERROR` and `WARNING` using the reported guide section, then run:

```sh
make validate
```

Neither severity blocks a normal build. To scan without displaying the
convention report, use `make build VALIDATOR_QUIET=1`. See
[`VALIDATOR.md`](VALIDATOR.md) for colors, strict mode, scope, and selected-file
commands.
