# Spaghetti LAB Board Support

[← Project README](../../README.md) · [Architecture](../../ARCHITECTURE.md)

> [!NOTE]
> This is a design contract. See the roadmap for current implementation status.

## Purpose

This directory will contain out-of-tree Zephyr board definitions for physical
Spaghetti LAB Core variants. Board support absorbs MCU and wiring differences so
higher firmware remains common.

## Responsibility

Describe MCU/SoC selection, physical peripherals, memory/flash, connectivity,
console/debug, port count/capabilities, fixed power/presence hardware, and board
defaults.

## Non-responsibility

Never describe which removable module is currently connected, user logic,
backend assignments, MQTT endpoint, or runtime discovery result.

## Files

Expected future layout, following Zephyr's board model:

```text
boards/spaghettilab/
├── spaghetti_core_c3/
│   ├── board.yml
│   ├── Kconfig.spaghetti_core_c3
│   ├── Kconfig.defconfig
│   ├── spaghetti_core_c3_defconfig
│   └── spaghetti_core_c3_<qualifier>.dts
├── spaghetti_core_s3/
└── future_core/
```

Exact required names/qualifiers must follow the Zephyr version used when the
board is implemented. No production board files are created by this document.

## Data structures to implement

No runtime C object is owned here. Build-time metadata and Devicetree generate
constants/specifiers consumed by Core and Port. Port then owns runtime objects.

## Functions to implement

There are no board runtime functions. Planned interaction is build-time:

### Board selection/build processing

- **Purpose:** select SoC, DTS, defaults, and runners for one Core.
- **Called by:** CMake/West/Zephyr build system.
- **Trigger:** `west build -b <board>/<qualifier>`.
- **Invocation mechanism:** BUILD-TIME PROCESSING, not a C call.
- **Execution context:** host build tools.
- **Inputs:** board name, DTS, Kconfig/defconfig, optional runner metadata.
- **Outputs:** generated Devicetree/Kconfig configuration and firmware.
- **State modified:** build artifacts only.
- **Failure cases:** invalid board metadata, unsupported SoC, invalid DTS/binding.
- **Called next:** Devicetree compiler, Kconfig, CMake/link.

## Interaction diagram

```text
board.yml + board DTS + defconfig
              |
              | BUILD-TIME PROCESSING
              v
Zephyr generated DT/Kconfig
              |
              v
Core/Port compiled descriptors -> common Manager/Runtime/Data
```

## State / lifecycle

Board selection happens once per build. It has no runtime lifecycle.

## Concurrency considerations

None at board-definition level. Concurrency belongs to generated-device consumers.

## Zephyr concepts involved

- A Zephyr board is a concrete hardware target built on a supported SoC.
- Devicetree describes hardware instances and wiring.
- Kconfig selects software/defaults; use it for features, not pin mappings.
- defconfig supplies board defaults that application `prj.conf` can override where
  appropriate.
- board runner files configure flash/debug tooling, not firmware behavior.

## Implementation steps

1. Freeze a real Core schematic, MCU, flash, and revision strategy.
2. Decide whether to extend an existing Zephyr board or define a full board.
3. Create minimal board metadata/DTS and boot console.
4. Add one physical Port using the validated Spaghetti binding.
5. Inspect final generated DTS and test the Port descriptor.
6. Add additional ports/capabilities one at a time.
7. Add the second Core variant and build the same application for both.

## Expected result

The same common firmware builds for C3/S3/future Cores and enumerates each
variant's actual ports/capabilities without MCU conditionals above Port.

## Minimal test

Build/boot one board, inspect `build/zephyr/zephyr.dts`, and enumerate one port.

## Dependencies

Zephyr support for the selected SoC and a defined Spaghetti Port binding/model.

## Not yet

No custom board until hardware facts are known; no real GPIO values in examples;
no removable module child nodes.

## Conceptual Devicetree template

This is documentation only. Uppercase tokens are symbolic placeholders and are
not valid final mappings.

```dts
/ {
    spaghetti_ports {
        compatible = "spaghettilab,ports"; /* conceptual only */

        port0: port@0 {
            compatible = "spaghettilab,port"; /* conceptual only */
            reg = <0>;
            power-gpios = <&gpio0 PORT0_POWER_GPIO GPIO_ACTIVE_HIGH>;
            /* Example only: future binding may reference a bus/capabilities. */
        };
    };
};
```

A second Core can contain more or fewer `port@N` nodes and different controller
references. It must not require changes to Module Manager or Runtime.

## Structured file templates

### `board.yml`

Zephyr processes it during board discovery. It contains board identity, SoC, and
variants—not ports, runtime assignments, or application configuration.

```yaml
board:
  name: spaghetti_core_<variant>
  # SoC/variant metadata goes here according to the active Zephyr board schema.
```

### Board DTS

Processed at build time. It includes the supported SoC DTS and describes real
static wiring. The conceptual Port example above belongs here after real bindings
and hardware mappings exist. Runtime module type does not.

### `Kconfig.<board>` and `Kconfig.defconfig`

Processed by Kconfig. They select the SoC and provide hardware-appropriate
software defaults. Conceptual form:

```kconfig
# source/include the appropriate Zephyr board/SoC Kconfig contracts
# define board-specific defaults only where the hardware justifies them
```

Do not encode pin numbers or per-port removable module assignments in Kconfig.

### `<board>_defconfig`

Provides minimal default `CONFIG_...` settings required by the board. Application
features such as Runtime/MQTT should normally remain application choices.

```ini
# CONFIG_<REAL_REQUIRED_BOARD_FEATURE>=y
```

### Board `CMakeLists.txt` / `board.cmake`

CMake is processed during configure/build; `board.cmake` selects supported flash
and debug runners. Add either only if the concrete board needs it. Never place
runtime product policy there.

| Build element | Triggered by | Trigger | Mechanism | Context | Produces/calls |
|---|---|---|---|---|---|
| board discovery | West/CMake | configure | BUILD-TIME | host | board metadata |
| DTS processing | CMake | build configure | BUILD-TIME | host | generated DT macros |
| Kconfig processing | CMake | build configure | BUILD-TIME | host | `.config` macros |
| runner config | `west flash/debug` | deploy/debug | HOST TOOL | host | flash/debug runner |
