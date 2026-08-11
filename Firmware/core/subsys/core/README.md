# Core

[← Project README](../../README.md) · [Architecture](../../ARCHITECTURE.md)

Core is the firmware startup coordinator. It initializes required components in dependency order and exposes one board-independent view of overall readiness.

## What this component owns

- Overall boot state and immutable firmware/Core information.
- Operational mode selection and the independent MCUboot image state.
- Initialization and start ordering.
- Propagation of mandatory dependency failures.

## What this component does not own

- Ports, module instances, sensor protocols, product rules, or transport state.
- Board-specific pins or MCU-name branches.

## Files

| File | Role |
|---|---|
| `include/spaghetti/core.h` | Public Core state, info, and function declarations. |
| `subsys/core/core.c` | Private state and startup sequence. |
| `subsys/core/core_boot_backend.c` | Board-independent bootstrap/reboot backend boundary. |
| `src/main.c` | Calls Core and handles its final boot result. |

## Data model

| Type / object | Owner | Meaning |
|---|---|---|
| `spaghetti_core_state` | Core | UNINITIALIZED, INITIALIZING, READY, RUNNING, or FAILED. |
| `spaghetti_core_mode` | Core | UNPROVISIONED, NORMAL, or MAINTENANCE policy for this boot. |
| `spaghetti_core_image_state` | Update/MCUboot, copied by Core | CONFIRMED or TRIAL, independent from mode. |
| `spaghetti_core_info` | Core | Bounded caller-copied state, mode, slot, confirmation and signed version. |
| Startup Config copy | Core | Valid persisted candidate retained between init and start. |
| Initialization flags | Core | Private state preventing invalid repeated transitions. |

## API contract

### `int spaghetti_core_init(void)`

**Purpose:** Initialize every mandatory component in documented dependency order.

**Parameters**

| Parameter | Meaning |
|---|---|
| None | No input parameters. |

**Returns:** `0` when Core reaches READY; first negative dependency error otherwise.

**Errors:** Invalid static hardware, unavailable mandatory dependency, or repeated invalid initialization.

**Execution context:** Zephyr main thread; bounded blocking is allowed.

**Calls:** Port, optional Power, Registry, Manager, Data, Runtime, MQTT, Storage,
Update, Discovery, Config, Wi-Fi Profiles and Communication in dependency order.

### `int spaghetti_core_start(void)`

**Purpose:** Apply the retained Config and enter RUNNING after construction.

**Parameters**

| Parameter | Meaning |
|---|---|
| None | No input parameters. |

**Returns:** `0` when Core reaches RUNNING; negative start error otherwise.

**Errors:** `-EACCES` when called outside READY. A stored removable Module that is
absent is logged while the empty state and Communication remain available.

**Execution context:** Zephyr main thread.

**Calls:** Only selected components that have a distinct start operation.

### `enum spaghetti_core_state spaghetti_core_get_state(void)`

**Purpose:** Return the current overall state without changing it.

**Parameters**

| Parameter | Meaning |
|---|---|
| None | No input parameters. |

**Returns:** Current enum value.

**Errors:** None.

**Execution context:** Any documented thread context; implementation must provide a coherent read.

**Calls:** None.

### `int spaghetti_core_get_info(struct spaghetti_core_info *out)`

**Purpose:** Copy boot policy and image information for diagnostics.

**Parameters**

| Parameter | Meaning |
|---|---|
| `out` | Caller-owned destination. |

**Returns:** `0` with state, mode, image state, active slot, confirmation and version.

**Errors:** `-EINVAL` for null output; `-EAGAIN` before initialization if info is unavailable.

**Execution context:** Calling thread.

**Calls:** None.

## How it works

```mermaid
sequenceDiagram
    participant Main as main()
    participant Core
    participant Storage
    participant Update
    participant Engine
    participant Communication
    Main->>Core: init()
    Core->>Storage: load Config and consume one-shot marker
    Core->>Update: read image state and active slot
    Core->>Core: select operational mode
    opt mode is NORMAL
        Core->>Engine: initialize runtime services
    end
    Core->>Communication: initialize Shell
    Core-->>Main: READY
    Main->>Core: start()
    opt mode is NORMAL
        Core->>Engine: apply retained Config, if present
    end
    Core-->>Main: RUNNING
    opt image is TRIAL
        Core->>Core: wait bounded health window
        Core->>Update: confirm running image
    end
```

## Practical example

If Port initialization returns `-ENODEV`, Core stops the sequence, enters FAILED, returns that error to `main`, and never reports READY. It does not hide the failure and continue with invalid hardware.

## Zephyr integration

- `main()` already runs in a Zephyr thread.
- Use one Zephyr logging module for structured boot diagnostics.
- Kconfig controls which optional components are compiled; Core coordinates only those present.

## Configuration templates

### `CMakeLists.txt`

```cmake
target_include_directories(app PRIVATE include)

target_sources(app PRIVATE
  src/main.c
  subsys/core/core.c
)
```

### `prj.conf`

```ini
CONFIG_LOG=y
CONFIG_SERIAL=y
CONFIG_CONSOLE=y
```

### Minimal `main.c` usage

```c
int main(void)
{
    int err = spaghetti_core_init();
    if (err < 0) {
        return err;
    }

    return spaghetti_core_start();
}
```

## Ownership and concurrency

Initialization and start transitions are serialized in the main thread. Getters return copied or atomically coherent state. Core owns no worker thread solely for coordination.

## Contract guarantees

- READY means every dependency required by the selected mode initialized successfully.
- Mode and image state are orthogonal: `NORMAL + TRIAL` is a valid temporary state.
- UNPROVISIONED and MAINTENANCE never start Runtime, MQTT, Discovery or Wi-Fi Profiles.
- Only Core may confirm a trial image after reaching RUNNING and surviving the health window.
- The first meaningful error is preserved for diagnostics.
- No higher component must branch on a concrete MCU or board name.
