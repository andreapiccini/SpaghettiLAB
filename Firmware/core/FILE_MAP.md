# Firmware file map and reading guide

[← Project README](README.md) · [Architecture](ARCHITECTURE.md) ·
[Implementation guide](FIRMWARE_IMPLEMENTATION_GUIDE.md)

This document answers three questions for every important project file or file
family:

1. What does it contain?
2. When must it be read?
3. Why is it relevant to the current task?

Use it to choose the minimum complete reading set before making a change. Do not
open every file for every task.

## Mandatory reading before any firmware task

Read these in order:

1. The current task file: defines scope, expected result, exclusions, and test.
2. [`ARCHITECTURE.md`](ARCHITECTURE.md): identifies the correct owner and boundary.
3. [`FIRMWARE_IMPLEMENTATION_GUIDE.md`](FIRMWARE_IMPLEMENTATION_GUIDE.md): defines
   how code and contracts must be written.
4. The target component's `README.md`: defines functions, data, inputs, outputs,
   errors, concurrency, and examples.
5. The existing public header and implementation named by the task.
6. [`templates/firmware/change_contract.md.template`](templates/firmware/change_contract.md.template)
   for a non-trivial new API, state transition, thread, queue, or shared object.

```mermaid
flowchart TD
    TASK["What must change? <br/> current task"] --> OWNER["Who owns it? <br/> architecture"]
    OWNER --> RULES["How is it written? <br/> implementation guide"]
    RULES --> CONTRACT["What is the exact contract? <br/> component README + public header"]
    CONTRACT --> CODE["How does it work now? <br/> implementation + tests"]
    CODE --> CHECK["Does it comply? <br/> validator + build + tests"]
```

## Read by task type

| You are about to… | Read first | Why |
|---|---|---|
| Change any ownership or dependency | `ARCHITECTURE.md`, both component READMEs | Prevent cross-layer state leakage |
| Add/change a public function | Implementation guide, `include/spaghetti/README.md`, component README, header template | Choose signature, ownership, Doxygen, and errors |
| Implement a `.c` function | Current public header, component README, implementation guide | Make the body satisfy the declared contract |
| Add a component | Architecture, component/service/module overview, all firmware templates | Create the standard file/build/documentation set |
| Add a module driver | `spaghetti_modules/README.md`, Module/Driver/Port headers, concrete module README | Preserve generic driver/Port boundaries |
| Add or change a thread | Runtime/service README, thread section of implementation guide, thread template | Justify ownership, stack, priority, queue, stop policy |
| Share data across files | Implementation guide “Sharing data”, Data README, private-header template | Select snapshot, copied message, callback, ID, or private header |
| Add logs | Implementation guide “Logging”, component Kconfig/source files | Register exactly one module and choose correct level |
| Change physical wiring | Board README, binding README, schematic/datasheet, overlay/DTS | Keep only verified static hardware in Devicetree |
| Add a Devicetree property | Binding README, relevant YAML binding, board DTS | Define schema before consuming generated macros |
| Add a Kconfig option | Implementation guide, local Kconfig, `prj.conf` | Separate build choice from runtime Config |
| Add persistence | Storage README, Config README, partition DTS, notices | Preserve versioning, bounds, flash ownership |
| Add communication/MQTT | Communication README, service README, Data/Config contracts | Keep transports as replaceable adapters |
| Change build commands/environment | Root README, Makefile, compose files, Dockerfile, CMakeLists | Understand host/container boundary |
| Prepare a release | README licensing section, `THIRD_PARTY_NOTICES.md`, license files | Generate/review applicable third-party material |
| Review a validation finding | `VALIDATOR.md`, reported guide section, reported source | Understand severity and correction |
| Diagnose a failed build | Root README, compiler output, CMake/Kconfig/DTS inputs | Separate source, configuration, and generated evidence |

## Root files

| File | Contains | Read before / modify when |
|---|---|---|
| `README.md` | Supported hosts, Docker workflow, build/flash commands, navigation, licensing summary | First checkout; environment, build, flash, or documentation navigation changes |
| `tools/device.py` | Cross-platform serial-port discovery, Zephyr runner selection, host flashing, and console launch | Changing `make flash`, `make screen`, port detection, or support for another flash runner |
| `ARCHITECTURE.md` | Generic ownership, boundaries, static/runtime split, data/control flow | Any new component, dependency, shared state, protocol adapter, or lifecycle change |
| `FIRMWARE_IMPLEMENTATION_GUIDE.md` | Normative code/API/type/memory/thread/logging/testing rules | Before writing or reviewing firmware code |
| `FILE_MAP.md` | This reading map and file-purpose catalog | When deciding what must be read for a task |
| `VALIDATOR.md` | Validator commands, colors, scope, rules, severities, quiet/strict modes, and limitations | When a finding appears or validation behavior changes |
| `validator` | Executable Python rule engine; read-only against source | Only when implementing/debugging a validation rule |
| `CMakeLists.txt` | Zephyr application declaration, pre-build validator, compiled source/directory integration | Adding/removing source or changing build integration |
| `prj.conf` | Application-level Zephyr Kconfig selections | Enabling/configuring a Zephyr subsystem for this application |
| `Makefile` | Portable shortcuts around Docker Compose and West | Changing developer commands; not firmware behavior |
| `Dockerfile` | Versioned Zephyr workspace, SDK dependencies, blobs, container defaults | Changing Zephyr/toolchain/dependency versions |
| `compose.yaml` | Source mount, image, environment, ccache, interactive container | Changing common container execution on all hosts |
| `compose.linux.yaml` | Optional USB passthrough for manual container flashing on Linux | Changing advanced Linux container/device behavior |
| `.env.example` | Documented local environment-variable examples without secrets | Adding a developer-selectable port/board setting |
| `.gitignore` | Files that Git must not track | Adding a generated, secret, cache, editor, or build artifact family |
| `.dockerignore` | Files excluded from Docker build context | Changing what the image build needs from the repository |
| `THIRD_PARTY_NOTICES.md` | Zephyr/module/blob attribution workflow and SPDX release procedure | Before redistribution or dependency changes |
| `LICENSES/Apache-2.0.txt` | Local copy of Zephyr's primary license text | Release packaging/licensing review; never edit casually |

## Application entry and public contracts

| File | Contains | Read before / modify when |
|---|---|---|
| `src/main.c` | Minimal application entry: call Core, report boot result, then yield/return as designed | Changing only the top-level boot handoff; never put subsystem logic here |
| `include/spaghetti/README.md` | Rules and map for public firmware boundaries | Adding/changing any public header |
| `include/spaghetti/core.h` | Overall startup/state contract | Calling or changing Core initialization/state |
| `include/spaghetti/port.h` | Stable physical Port IDs, capabilities, and accessors | Drivers need board-independent bus/GPIO access |
| `include/spaghetti/module.h` | Runtime module identity, state, and common value types | Creating or referencing a live module instance |
| `include/spaghetti/module_driver.h` | Immutable driver operations and descriptor contract | Implementing/registering a module type |
| `include/spaghetti/driver_registry.h` | Lookup contract from type ID to driver descriptor | Adding lookup or registration behavior |
| `include/spaghetti/module_manager.h` | Module lifecycle, assignment, read, command, and snapshots | Configuring/removing/using module instances |
| `include/spaghetti/config.h` | Desired-state validation, application, generation, and snapshots | Changing runtime/user/product configuration |
| `include/spaghetti/data.h` | Generic messages, publish/subscribe, and statistics | Producing or consuming values/events |
| `include/spaghetti/runtime.h` | Autonomous task/rule lifecycle | Adding periodic sampling or product behavior |
| `include/spaghetti/communication.h` | Generic request/response dispatch boundary | Adding an input/output transport adapter |
| `include/spaghetti/discovery.h` | Normalized module-discovery proposal/provider boundary | Adding manual, memory, or probe discovery |
| `include/spaghetti/power.h` | Optional shared-resource coordination contract | Only when verified switchable/shared power hardware exists |

Public headers contain contracts, not implementation state. Read the header
before its `.c`; it tells you what the implementation is required to preserve.

## Common subsystem files

Each subsystem follows the same three-file reading pattern:

1. `README.md` for responsibility, API behavior, examples, threading, and errors.
2. `include/spaghetti/<name>.h` for the compiler-visible public contract.
3. `subsys/<name>/<name>.c` for private state and implementation.

| Component | Documentation | Implementation | Read when |
|---|---|---|---|
| Core | `subsys/core/README.md` | `subsys/core/core.c` | Boot order, overall state, dependency startup |
| Port | `subsys/port/README.md` | `subsys/port/port.c` | Mapping static board hardware to stable runtime Ports |
| Driver Registry | `subsys/driver_registry/README.md` | `subsys/driver_registry/driver_registry.c` | Driver descriptor lookup and validation |
| Module Manager | `subsys/module_manager/README.md` | `subsys/module_manager/module_manager.c` | Instance ownership, assignment, rollback, read/command |
| Config | `subsys/config/README.md` | `subsys/config/config.c` | Validate/apply desired state and generation control |
| Data | `subsys/data/README.md` | `subsys/data/data.c` | Generic messages, queues/zbus, delivery and backpressure |
| Runtime | `subsys/runtime/README.md` | `subsys/runtime/runtime.c` | Periodic work, rules, worker context and lifecycle |
| Communication | `subsys/communication/README.md` | `subsys/communication/communication.c` | Transport-neutral dispatch and status |
| Discovery | `subsys/discovery/README.md` | `subsys/discovery/discovery.c` | Normalize/validate identification proposals |
| Power | `subsys/power/README.md` | `subsys/power/power.c` | Coordinate a verified real shared power resource |

Do not read or modify a subsystem implementation merely because another
component calls its public API. Read the called component's README/header; open
its `.c` only when changing its owned behavior or diagnosing an internal defect.

## Services

| Path | Contains | Read when |
|---|---|---|
| `subsys/services/README.md` | Rules for optional replaceable services | Adding any service/backend |
| `subsys/services/timer/README.md` | Wake-up/timing service contract | Scheduling work without placing logic in timer callbacks |
| `subsys/services/storage/README.md` | Bounded persistence, Settings/NVS, versioning, partition example | Saving/loading configuration or state |
| `subsys/services/mqtt/README.md` | Optional MQTT adapter and worker/network ownership | Product requirements explicitly choose MQTT |

Services support owners; they do not own product rules or module instances.

## Module drivers

| Path | Contains | Read when |
|---|---|---|
| `spaghetti_modules/README.md` | Common module-driver lifecycle, operation table, config/build template | Before every new sensor/actuator driver |
| `spaghetti_modules/ina219/README.md` | Practical I2C bus-voltage/current/power driver contract | Implementing or testing INA219 behavior |
| `spaghetti_modules/relay/README.md` | Practical logical-output/safe-state driver contract | Implementing or testing a relay/output behavior |

A new module directory owns only its protocol, per-instance private state, and
translation to generic values/commands. It does not own Port wiring, Manager
instances, Runtime policy, or transports.

## Hardware description

| Path | Contains | Read when |
|---|---|---|
| `boards/esp32c3_devkitm_esp32c3.overlay` | Verified application additions to the selected development board DTS | Changing console or verified development-board wiring |
| `boards/spaghettilab/README.md` | Board/Core variant file layout and templates | Creating or reviewing a Spaghetti LAB board definition |
| `dts/bindings/spaghetti/README.md` | Custom binding purpose, schema, and matching DTS example | Adding/changing a `spaghettilab,*` compatible/property |
| `dts/bindings/spaghetti/*.yaml` | Machine-validated custom Devicetree schemas when present | Consuming or changing a custom hardware property |

Before editing hardware files, obtain the schematic/datasheet and verify the
actual controller, pins, address, polarity, interrupt, and flash region. Generated
`build/zephyr/zephyr.dts` is evidence of the merged result, never an input to edit.

## Templates

Start at [`templates/firmware/README.md`](templates/firmware/README.md). It tells
you which templates to copy and in which order.

| Template | Use |
|---|---|
| `change_contract.md.template` | Decide owner/API/types/errors/context before coding |
| `public_api.h.template` | Create a documented public contract |
| `private_header.h.template` | Share private types/helpers only between sibling `.c` files |
| `component.c.template` | Create bounded private state and synchronous operations |
| `thread_component.c.template` | Create a justified application-lifetime worker |
| `CMakeLists.txt.template` | Add component-owned sources |
| `Kconfig.template` | Add bounded build/resource/log choices |
| `test_component.c.template` | Start success/invalid/output-preservation ztests |

Templates are starting points, not build inputs. Copy only the template required
by the current task, replace every placeholder, and delete unused behavior.

## Task documents

`roadmap/<phase>/TASK-*.md` files are execution instructions. When following this
workflow, read only:

1. the current task;
2. its explicitly linked dependency when its result is unclear;
3. the next task only after the current completion gate passes.

A task controls **scope**. Architecture controls **ownership**. The implementation
guide controls **writing rules**. Component documentation controls **behavioral
contract**. No one document replaces the others.

## Generated build files

Do not read generated files during normal implementation. Use them for a specific
diagnostic question:

| Generated path | Read only to answer |
|---|---|
| `build/zephyr/.config` | Which Kconfig value was actually selected? |
| `build/zephyr/zephyr.dts` | Which Devicetree nodes/properties survived merging? |
| `build/compile_commands.json` | Which compiler command/include/define built a source? |
| `build/zephyr/zephyr.map` | Where did code/data land and what consumes memory? |
| `build/zephyr/zephyr.elf` | What symbols/debug information are in the image? |
| `build/zephyr/zephyr.bin` | Which binary is flashed? Do not inspect as source. |

Generated files can be deleted and recreated. Never edit or commit them.

## Rule for every new file

Before adding a file, be able to write one sentence answering:

> This file owns or documents **X**, and must be read when changing **Y**.

If its purpose overlaps another file, choose the existing owner or redesign the
boundary. After adding it:

- add it to the relevant component README file table;
- add it here when developers need it to choose a reading path;
- add it to CMake/Kconfig only when it is a real build input;
- add generated/local output to `.gitignore`, not to this map;
- validate, build, and test the behavior it introduces.
