# Zephyr on ESP32-C3

A Docker-based development environment for the Zephyr 4.4.0 firmware running on
`spaghettilab_core_v1/esp32c3`.

Docker provides Zephyr, West, the RISC-V toolchain, modules, and dependencies.
The source code and generated `build/` directory stay on the host computer.

## Requirements

- Docker Desktop with Docker Compose
- An ESP32-C3 board connected over USB
- About 15 GB of free disk space for the first Docker image build
- `make` on Linux, macOS, or Windows for the common shortcuts below
- The host flashing program required by the Zephyr runner selected for the board
- `screen` for the raw console on Linux/macOS
- PySerial and Rich for the styled cross-platform monitor

The current ESP32-C3 build uses `esptool`. Install it on macOS:

```sh
brew install esptool
```

Install it on Windows from PowerShell:

```powershell
py -m pip install esptool
```

On Linux, install it with your package manager or in a Python environment:

```sh
python3 -m pip install esptool
```

The first styled-monitor run creates an ignored `.venv/` and installs its host-only
dependencies there automatically:

```sh
make monitor
```

To prepare the virtual environment without opening the serial port, run
`make host-tools`. Nothing is installed in the global Python environment.

## Quick start

Build the Docker image once:

```sh
make image
```

Then build the firmware:

```sh
make build
```

The default target is the physical Core V1. Build the simulated second topology
without changing common firmware code with:

```sh
docker compose run --rm --entrypoint sh dev -lc \
  'west build -p always -b spaghettilab_core_v2_build_only/esp32c3 -d build-v2 .'
```

Core V2 is build-only: its pin and connector assignments are intentionally simulated
and it intentionally defines no default flash runner.

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

## Flash and serial console

The same commands work on Linux, macOS, and Windows when `make` is available:

```sh
make flash
make monitor
```

The commands select the port automatically when exactly one supported USB serial
port is connected. List the detected ports with:

```sh
make ports
```

If more than one port is present, or automatic detection cannot identify it,
provide the port explicitly. The same override is accepted by both commands:

```sh
make flash PORT=/dev/cu.usbserial-110
make monitor PORT=/dev/cu.usbserial-110
```

To keep the selection, copy `.env.example` to `.env` and set `PORT` there.
A value passed on the command line takes precedence over `.env`.

Linux example:

```sh
make flash PORT=/dev/ttyACM0
make monitor PORT=/dev/ttyACM0
```

Windows example from a terminal that provides `make`:

```powershell
make flash PORT=COM3
make monitor PORT=COM3
```

Override the console or flashing speed only when necessary:

```sh
make monitor BAUD=9600
make flash FLASH_BAUD=115200
```

`make monitor` shows a calm Rich header, color-coded Zephyr levels and aligned
module names. Structured Shell output such as `wifi scan` is rendered as a responsive
Rich table with signal-strength colors. It preserves interactive input, reconnects
after a USB reset, and exits
with `Ctrl-X` (`Ctrl-]` also works on compatible layouts); `Ctrl-C` is forwarded to
the Zephyr Shell. `make screen` remains the
unformatted fallback: on Linux and macOS, exit it with `Ctrl-A`, then `\`, then `y`;
on Windows, miniterm exits with `Ctrl-]`. Only one program can use the serial port at
a time, so close either console before flashing.

On connection, the styled monitor sends `Ctrl-C` so an already-running Zephyr Shell
immediately redraws `uart:~$` without adding an empty command to its history. For a
future binary serial protocol, use
`.venv/bin/python tools/device.py monitor --no-wake` to open the port without
transmitting that byte, or use the raw `make screen` path.

`tools/device.py` reads `build/zephyr/runners.yaml`; the microcontroller and
flash parameters therefore come from the active Zephyr build rather than from
the Makefile. It directly supports the generated Espressif runner. Other
Zephyr runners are delegated to a compatible host `west` installation and may
require their own host utility or debug-probe driver. A board without a serial
console can still be flashed by its runner, but `make screen` naturally requires
a serial port.

On Linux, your user may need serial-port access. On many distributions, add the
user to the `dialout` group and then sign out and back in:

```sh
sudo usermod -aG dialout "$USER"
```

## Common commands

| Command | Description |
|---|---|
| `make image` | Build the Docker development image |
| `make validate` | Check firmware writing conventions without compiling |
| `make build` | Run an incremental firmware build |
| `make pristine` | Reconfigure and rebuild from scratch |
| `make shell` | Open a shell in the Zephyr environment |
| `make ports` | List host USB serial ports detected automatically |
| `make flash [PORT=...]` | Flash using the runner selected by the build |
| `make screen [PORT=...]` | Open the raw serial console at 115200 baud |
| `make monitor [PORT=...]` | Open the styled, reconnecting Rich monitor |
| `make host-tools` | Create `.venv/` and install monitor dependencies |
| `make clean` | Remove the CMake build artifacts |

Useful Windows equivalents:

```powershell
# Flash and open the console without make
py -3 tools/device.py flash
py -3 tools/device.py screen
py -3 tools/device.py monitor

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
├── tools/device.py                         host port detection, flash, and console helper
├── FILE_MAP.md                             what to read before each kind of change
├── prj.conf                                Zephyr/Kconfig settings
├── CMakeLists.txt                          build configuration
├── Dockerfile                              Zephyr development image
├── compose.yaml                            common container configuration
├── compose.linux.yaml                      optional manual Linux USB passthrough
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

### No serial port is detected

Run `make ports`, reconnect the board with a data-capable USB cable, and try a
different direct USB port. If several devices are listed, select one with
`PORT=...`. Automatic detection deliberately refuses to guess between multiple
devices.

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

`make build` also detects an incomplete `build/` directory. If the directory
exists but `build/build.ninja` is missing, it removes only those generated build
artifacts and regenerates the build system. `make pristine` always performs the
same clean regeneration explicitly.

### The validator reports convention findings

Review each `ERROR` and `WARNING` using the reported guide section, then run:

```sh
make validate
```

Neither severity blocks a normal build. To scan without displaying the
convention report, use `make build VALIDATOR_QUIET=1`. See
[`VALIDATOR.md`](VALIDATOR.md) for colors, strict mode, scope, and selected-file
commands.
