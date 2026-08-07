# Spaghetti LAB firmware — guided implementation roadmap

Use this document while programming. Complete one step at a time and do not pass
a milestone stop condition with an unchecked item. The commands below match the
current Docker workflow: `make build`, `make pristine`, and, on macOS, host-side
`esptool` plus `screen`. The current target is
`esp32c3_devkitm/esp32c3`; the current overlay only selects `usb_serial` as the
console. All architectural `.c/.h` files are currently empty and only
`src/main.c` is compiled.

## Roadmap index

| Milestone | Visible result |
|---|---|
| 0 — Baseline | Existing Zephyr uptime firmware builds, flashes, and prints |
| 1 — Core | `main` boots through `spaghetti_core_init()` |
| 2 — Current-board I2C | Real I2C controller is ready on verified pins |
| 3 — First Port | Port 0 exposes that controller through the Port API |
| 4 — SHT40 vertical slice | Real temperature and humidity appear in the log |
| 5 — Module/driver model | SHT40 is callable through a module-driver operation table |
| 6 — Driver Registry | `sht40` lookup succeeds; unknown lookup fails cleanly |
| 7 — Module Manager | A direct call configures `Port 0 = SHT40` |
| 8 — Remove static SHT40 shortcut | Runtime-removable SHT40 uses Port + direct I2C |
| 9 — Internal Config | A C config applies Port 0 and sample period |
| 10 — Persistent Config | The internal config survives reboot |
| 11 — Data/zbus | One sample reaches logger and a second consumer |
| 12 — Runtime V0 | Runtime samples temperature every 1000 ms |
| 13 — Relay + Runtime V1 | `temperature > 25` commands a relay |
| 14 — Communication | USB-console shell adapter applies a local config command |
| 15 — CBOR | Tiny CBOR config decodes into `spaghetti_config` and applies |
| 16 — MQTT | One known temperature topic reaches a broker |
| 17 — Discovery | Manual discovery result feeds the unchanged Manager |
| 18 — Multiple Core variants | Common higher layers build without C3 pin/board checks |
| 19 — Power | One real, measured power resource has correct acquire/release behavior |

## Rules used throughout

- **TEMPORARY SHORTCUT** means deliberately disposable code. Remove it at the
  explicitly named removal milestone.
- Return `0` for success and negative errno-compatible values for failures.
- Prefer fixed-capacity storage before heap allocation.
- Control/lifecycle uses DIRECT CALL until real concurrency justifies a queue.
- Do not call blocking APIs from ISR, timer expiry, or low-level transport callback.
- Use `make build` normally; use `make pristine` after board/Devicetree/Kconfig
  changes or whenever generated configuration appears stale.

# MILESTONE 0 — Prove the existing baseline - DONE ✔

### Step 0.1 — Build the untouched application

**OPEN** `Makefile`, `compose.yaml`, `src/main.c` for reading only.

**WRITE / MODIFY** Nothing.

**PURPOSE** Prove Docker, Zephyr 4.4, board selection, and generated build are healthy.

**WHY NOW** Every later failure must be distinguishable from environment failure.

**CALLED / USED BY** Developer workflow.

**TRIGGER** BASELINE CHECK.

**MECHANISM** BUILD TIME.

**EXECUTION CONTEXT** Host invoking Docker Compose.

**CALLS / DEPENDS ON** Existing `make build` target and Docker image.

**EXPECTED INPUT** Existing application and board `esp32c3_devkitm/esp32c3`.

**EXPECTED OUTPUT** `build/zephyr/zephyr.bin` with a successful build.

**ERRORS TO HANDLE** Missing Docker image/daemon or stale generated build; use
`make image` only if the image is absent, then `make pristine` if needed.

**DO NOT IMPLEMENT YET** Any architecture file.

**COMPILE NOW?** YES: run `make build`.

**FLASH NOW?** NO; first confirm compilation.

**TEST** Confirm command exits zero and `build/zephyr/zephyr.bin` exists.

**EXPECTED RESULT** Incremental build succeeds.

**IF IT WORKS, NEXT** Step 0.2.

### Step 0.2 — Flash and observe the baseline

**OPEN** Root `README.md`, section “Deploy su macOS” or Linux equivalent.

**WRITE / MODIFY** Nothing.

**PURPOSE** Freeze a known-good hardware/deploy baseline.

**WHY NOW** Port/I2C work should start only after console and board reset work.

**CALLED / USED BY** Developer.

**TRIGGER** FIRMWARE DEPLOY.

**MECHANISM** HOST FLASH TOOL, then serial monitor.

**EXECUTION CONTEXT** Host OS.

**CALLS / DEPENDS ON** macOS: existing `esptool ... 0x0 build/zephyr/zephyr.bin`;
Linux: `make flash`, then `make monitor`.

**EXPECTED INPUT** Current serial port and built image.

**EXPECTED OUTPUT** Boot greeting and uptime every five seconds at 115200 baud.

**ERRORS TO HANDLE** Busy/wrong port and bootloader entry failure.

**DO NOT IMPLEMENT YET** I2C or new logging.

**COMPILE NOW?** NO; use Step 0.1 image.

**FLASH NOW?** YES, using the existing README workflow; do not create a new one.

**TEST** Reset board with serial monitor open.

**EXPECTED RESULT** `Hello from Zephyr on ESP32-C3!` and increasing uptime.

**IF IT WORKS, NEXT** Step 1.1.

## STOP HERE UNTIL

- [✔] `make build` succeeds.
- [✔] Firmware flashes through the existing workflow.
- [✔] Console output is readable at 115200 baud.
- [✔] Uptime increases without reset loops.

# MILESTONE 1 — Introduce the Core boot boundary

### Step 1.1 — Define the minimal Core public API

**OPEN** `include/spaghetti/core.h`.

**WRITE / MODIFY** Add an include guard; declare
`enum spaghetti_core_state { SPAGHETTI_CORE_UNINITIALIZED,
SPAGHETTI_CORE_READY, SPAGHETTI_CORE_ERROR };`,
`int spaghetti_core_init(void);`, and
`enum spaghetti_core_state spaghetti_core_get_state(void);`.

**PURPOSE** Create one application boot boundary and observable state.

**WHY NOW** All later subsystem initialization needs one coordinator.

**CALLED / USED BY** `src/main.c`; future Communication reads state.

**TRIGGER** BOOT.

**MECHANISM** DIRECT CALL.

**EXECUTION CONTEXT** Main Zephyr thread.

**CALLS / DEPENDS ON** No lower subsystem yet.

**EXPECTED INPUT** None.

**EXPECTED OUTPUT** Declaration contract only.

**ERRORS TO HANDLE** None in header; document negative errno convention.

**DO NOT IMPLEMENT YET** Capability flags, Wi-Fi/BLE, subsystem arrays, threads.

**COMPILE NOW?** NO; declaration is not linked yet.

**FLASH NOW?** NO.

**TEST** Review ownership: only Core may modify its state.

**EXPECTED RESULT** Small header with no board-specific field.

**IF IT WORKS, NEXT** Step 1.2.

### Step 1.2 — Implement Core initialization

**OPEN** `subsys/core/core.c`.

**WRITE / MODIFY** Implement `spaghetti_core_init()` and
`spaghetti_core_get_state()`. Register a Zephyr log module. `init` sets READY and
logs `Spaghetti Core ready`; getter returns the private state.

**PURPOSE** Establish the simplest complete Core implementation.

**WHY NOW** It must link and run before dependencies are added.

**CALLED / USED BY** `main` and future diagnostics.

**TRIGGER** BOOT.

**MECHANISM** DIRECT CALL.

**EXECUTION CONTEXT** Main thread/calling thread.

**CALLS / DEPENDS ON** Zephyr logging only.

**EXPECTED INPUT** None.

**EXPECTED OUTPUT** `0` and READY.

**ERRORS TO HANDLE** None yet; keep an ERROR path ready for future dependencies.

**DO NOT IMPLEMENT YET** Port or service initialization.

**COMPILE NOW?** NO; first add build integration.

**FLASH NOW?** NO.

**TEST** Static inspection: state is private and getter does not mutate it.

**EXPECTED RESULT** Minimal implementation without loops or threads.

**IF IT WORKS, NEXT** Step 1.3.

### Step 1.3 — Add Core to the application build

**OPEN** Root `CMakeLists.txt` and `prj.conf`.

**WRITE / MODIFY** Add `target_include_directories(app PRIVATE include)` and add
`subsys/core/core.c` to `target_sources(app PRIVATE ...)`. Add `CONFIG_LOG=y` to
`prj.conf`; keep existing console options.

**PURPOSE** Compile/link the public header and implementation.

**WHY NOW** Unlisted `.c` files are ignored by CMake.

**CALLED / USED BY** Zephyr build system.

**TRIGGER** BUILD.

**MECHANISM** BUILD TIME.

**EXECUTION CONTEXT** CMake/Ninja in Docker.

**CALLS / DEPENDS ON** Zephyr application target and logging Kconfig.

**EXPECTED INPUT** Existing target plus two new entries.

**EXPECTED OUTPUT** Core object linked into `zephyr.elf`.

**ERRORS TO HANDLE** Wrong relative path or include directory.

**DO NOT IMPLEMENT YET** Per-directory CMake/Kconfig.

**COMPILE NOW?** YES: `make pristine` because `prj.conf` changed.

**FLASH NOW?** NO; link first.

**TEST** Build has no undefined symbol/include error.

**EXPECTED RESULT** Successful build with Core compiled but not called.

**IF IT WORKS, NEXT** Step 1.4.

### Step 1.4 — Route main through Core

**OPEN** `src/main.c`.

**WRITE / MODIFY** Include `<spaghetti/core.h>`, call
`spaghetti_core_init()` once before the existing uptime loop, log/print its
negative return and stop/return on failure. Keep the uptime loop for proof.

**PURPOSE** Make Core the real boot entry point.

**WHY NOW** The boundary is useful only when exercised.

**CALLED / USED BY** Zephyr invokes `main`; `main` calls Core.

**TRIGGER** BOOT.

**MECHANISM** DIRECT CALL.

**EXECUTION CONTEXT** Main thread.

**CALLS / DEPENDS ON** `spaghetti_core_init()`.

**EXPECTED INPUT** None.

**EXPECTED OUTPUT** Core log then uptime.

**ERRORS TO HANDLE** Negative init result.

**DO NOT IMPLEMENT YET** Move the loop into Core or start other threads.

**COMPILE NOW?** YES: `make build`.

**FLASH NOW?** YES after successful build, using existing workflow.

**TEST** Reset and read console.

**EXPECTED RESULT** `Spaghetti Core ready`, then unchanged uptime behavior.

**IF IT WORKS, NEXT** Step 2.1.

## STOP HERE UNTIL

- [ ] Core header is minimal and board-independent.
- [ ] Core source is compiled by CMake.
- [ ] `spaghetti_core_init()` returns zero.
- [ ] Board boots and still prints uptime.

# MILESTONE 2 — Enable one verified physical I2C bus

### Step 2.1 — Resolve real hardware facts

**OPEN** Core/module schematics, current board pinout, and
`build/zephyr/zephyr.dts` for inspection.

**WRITE / MODIFY** Record outside production code which controller and SDA/SCL
pins physically reach the intended Spaghetti Port. Replace later placeholders
only with schematic-confirmed values.

**PURPOSE** Prevent invented GPIO mappings.

**WHY NOW** I2C cannot be safely enabled without real wiring.

**CALLED / USED BY** Board overlay work.

**TRIGGER** HARDWARE BRING-UP.

**MECHANISM** DESIGN/BUILD-TIME INPUT.

**EXECUTION CONTEXT** Developer review.

**CALLS / DEPENDS ON** Schematic and ESP32-C3 board DTS.

**EXPECTED INPUT** Real controller and pins; whether pull-ups/power exist.

**EXPECTED OUTPUT** Verified mapping, not guessed values.

**ERRORS TO HANDLE** Ambiguous revision/wiring: stop and resolve physically.

**DO NOT IMPLEMENT YET** Custom board or Spaghetti binding.

**COMPILE NOW?** NO.

**FLASH NOW?** NO.

**TEST** Continuity/schematic cross-check where appropriate.

**EXPECTED RESULT** Unambiguous bus mapping.

**IF IT WORKS, NEXT** Step 2.2.

### Step 2.2 — Enable I2C in the current overlay

**OPEN** `boards/esp32c3_devkitm_esp32c3.overlay`.

**WRITE / MODIFY** Add/override the real I2C controller and its real pinctrl.
Conceptual template only:

```dts
/* I2C_CONTROLLER and I2C_PINCTRL are placeholders resolved in Step 2.1. */
&I2C_CONTROLLER {
    status = "okay";
    clock-frequency = <I2C_BITRATE_STANDARD>;
    pinctrl-0 = <&I2C_PINCTRL>;
    pinctrl-names = "default";
};
```

Define the corresponding ESP32 pinctrl group using the syntax already used by
the installed ESP32-C3 DTS/bindings; do not copy pin numbers from another board.

**PURPOSE** Describe the static Core bus at build time.

**WHY NOW** Port needs a ready Zephyr controller device.

**CALLED / USED BY** Devicetree tools and Zephyr I2C driver.

**TRIGGER** BUILD.

**MECHANISM** BUILD TIME.

**EXECUTION CONTEXT** Devicetree compiler/C compiler.

**CALLS / DEPENDS ON** Existing SoC I2C/pinctrl bindings.

**EXPECTED INPUT** Verified controller and pin mapping.

**EXPECTED OUTPUT** Enabled I2C node in final DTS.

**ERRORS TO HANDLE** Unknown label, invalid pinctrl, pin conflict.

**DO NOT IMPLEMENT YET** SHT40 child node or removable-module identity.

**COMPILE NOW?** NO; enable Kconfig first.

**FLASH NOW?** NO.

**TEST** Check template contains no unresolved placeholder before building.

**EXPECTED RESULT** Overlay describes only static bus wiring.

**IF IT WORKS, NEXT** Step 2.3.

### Step 2.3 — Enable Zephyr I2C software

**OPEN** `prj.conf`.

**WRITE / MODIFY** Add `CONFIG_I2C=y`. This permanently compiles the generic
I2C controller API required by I2C-capable ports.

**PURPOSE** Include the driver/API selected by the enabled controller.

**WHY NOW** DTS describes hardware; Kconfig includes software support.

**CALLED / USED BY** Port and later SHT40.

**TRIGGER** BUILD.

**MECHANISM** BUILD TIME.

**EXECUTION CONTEXT** Kconfig/CMake.

**CALLS / DEPENDS ON** Installed ESP32 I2C driver.

**EXPECTED INPUT** `CONFIG_I2C=y`.

**EXPECTED OUTPUT** I2C API linked.

**ERRORS TO HANDLE** Unsatisfied controller dependency shown by Kconfig warning.

**DO NOT IMPLEMENT YET** `CONFIG_SENSOR`, zbus, MQTT.

**COMPILE NOW?** YES: `make pristine`.

**FLASH NOW?** NO until generated DTS is inspected.

**TEST** Find enabled controller and real pins in `build/zephyr/zephyr.dts`; find
`CONFIG_I2C=y` in `build/zephyr/.config`.

**EXPECTED RESULT** Build succeeds; controller node is `okay`.

**IF IT WORKS, NEXT** Step 3.1.

## STOP HERE UNTIL

- [ ] Controller/pins are confirmed from real hardware.
- [ ] No symbolic placeholder remains in production overlay.
- [ ] `make pristine` succeeds.
- [ ] Final DTS shows the intended I2C controller enabled.
- [ ] `.config` contains `CONFIG_I2C=y`.

# MILESTONE 3 — Implement the first Port

### Step 3.1 — Define minimal Port types and API

**OPEN** `include/spaghetti/port.h`.

**WRITE / MODIFY** Add guard/includes and only:

```c
typedef uint8_t spaghetti_port_id_t;
enum spaghetti_port_capability { SPAGHETTI_PORT_CAP_I2C = BIT(0) };
struct spaghetti_port;
int spaghetti_port_init_all(void);
size_t spaghetti_port_count(void);
const struct spaghetti_port *spaghetti_port_get(spaghetti_port_id_t id);
bool spaghetti_port_has_capability(const struct spaghetti_port *port,
                                   enum spaghetti_port_capability capability);
const struct device *spaghetti_port_i2c_device(const struct spaghetti_port *port);
```

**PURPOSE** Represent Port 0 and expose its bus without MCU checks above Port.

**WHY NOW** SHT40 code needs one verified abstraction immediately.

**CALLED / USED BY** Core, SHT40 test driver; later Manager.

**TRIGGER** BOOT/LOOKUP/MODULE OPERATION.

**MECHANISM** DIRECT CALL.

**EXECUTION CONTEXT** Main/calling thread.

**CALLS / DEPENDS ON** Zephyr `struct device` declaration and basic types.

**EXPECTED INPUT** Port ID/capability.

**EXPECTED OUTPUT** Opaque const Port or `NULL`; boolean/device pointer.

**ERRORS TO HANDLE** Invalid ID/null port/not initialized.

**DO NOT IMPLEMENT YET** SPI/GPIO/power, module occupancy, dynamic allocation.

**COMPILE NOW?** NO.

**FLASH NOW?** NO.

**TEST** Confirm no ESP32 or pin identifier is public.

**EXPECTED RESULT** Small API sufficient for one I2C vertical slice.

**IF IT WORKS, NEXT** Step 3.2.

### Step 3.2 — Implement one temporary Port descriptor

**OPEN** `subsys/port/port.c`.

**WRITE / MODIFY** Define private `struct spaghetti_port` fields `id`,
`capabilities`, and `const struct device *i2c`. Implement all Step 3.1 functions.
In `init_all`, obtain the verified controller using the correct
`DEVICE_DT_GET(DT_NODELABEL(...))` and reject it with `-ENODEV` if
`device_is_ready()` is false.

**TEMPORARY SHORTCUT** The single descriptor and DT node label are hardcoded in
`port.c`. Step 18 replaces this with generated Port nodes/capabilities.

**PURPOSE** Validate Port API and real controller before custom bindings.

**WHY NOW** Hardware feedback is more valuable than designing all Port variants.

**CALLED / USED BY** Core and SHT40 wrapper.

**TRIGGER** BOOT.

**MECHANISM** DIRECT CALL.

**EXECUTION CONTEXT** Main thread.

**CALLS / DEPENDS ON** Devicetree macros, `DEVICE_DT_GET`, `device_is_ready`.

**EXPECTED INPUT** Static compiled DTS.

**EXPECTED OUTPUT** One ready Port or `-ENODEV`.

**ERRORS TO HANDLE** Controller absent/not ready and invalid lookup.

**DO NOT IMPLEMENT YET** Mutex unless two actual users share multi-step access.

**COMPILE NOW?** NO; integrate next.

**FLASH NOW?** NO.

**TEST** Unit-level inspection of ID bounds/null behavior.

**EXPECTED RESULT** One private descriptor and no module knowledge.

**IF IT WORKS, NEXT** Step 3.3.

### Step 3.3 — Compile and boot Port

**OPEN** Root `CMakeLists.txt`, `subsys/core/core.c`.

**WRITE / MODIFY** Add `subsys/port/port.c` to `target_sources`. In Core init,
DIRECT CALL `spaghetti_port_init_all()`; propagate failure; log count and whether
Port 0 has I2C.

**PURPOSE** Exercise the Port on every boot.

**WHY NOW** SHT40 should not be added until Port reports the real controller ready.

**CALLED / USED BY** Build and Core.

**TRIGGER** BOOT.

**MECHANISM** BUILD TIME then DIRECT CALL.

**EXECUTION CONTEXT** Main thread.

**CALLS / DEPENDS ON** Port init/count/capability.

**EXPECTED INPUT** Enabled controller from Milestone 2.

**EXPECTED OUTPUT** `Port 0: I2C ready`-equivalent log.

**ERRORS TO HANDLE** Propagate negative Port error; no silent READY.

**DO NOT IMPLEMENT YET** SHT40 or registry.

**COMPILE NOW?** YES: `make build`; use `make pristine` if DTS cache is suspect.

**FLASH NOW?** YES using existing workflow.

**TEST** Boot normally, then temporarily disable the controller in a test branch
and confirm Port init fails; restore it immediately.

**EXPECTED RESULT** One port found; invalid ID returns `NULL`; I2C device ready.

**IF IT WORKS, NEXT** Step 4.1.

## STOP HERE UNTIL

- [ ] Port code is linked.
- [ ] Port 0 is found.
- [ ] Port 0 reports I2C capability.
- [ ] Underlying Zephyr device is ready.
- [ ] Invalid Port ID fails safely.

# MILESTONE 4 — Read the real SHT40 quickly

### Step 4.1 — Choose the temporary Zephyr SHT4x path

**OPEN** Installed Zephyr files inside `make shell`:
`drivers/sensor/sensirion/sht4x/`,
`dts/bindings/sensor/sensirion,sht4x.yaml`, and `samples/sensor/sht4x/`.

**WRITE / MODIFY** No production file in this step. Record the choice:

- OPTION A: installed Zephyr Sensor/SHT4x driver; fastest real reading but static
  Devicetree instance.
- OPTION B: direct I2C Spaghetti driver; compatible with runtime-removable modules
  but requires protocol implementation/testing.
- RECOMMENDATION: OPTION A for this milestone, OPTION B in Milestone 8.

**PURPOSE** Get hardware evidence before completing generic architecture.

**WHY NOW** The installed environment already has `CONFIG_SHT4X`,
`sensirion,sht4x`, and Sensor API support.

**CALLED / USED BY** SHT40 vertical slice.

**TRIGGER** DESIGN DECISION.

**MECHANISM** BUILD-TIME STATIC DEVICE for OPTION A.

**EXECUTION CONTEXT** Developer review.

**CALLS / DEPENDS ON** Zephyr Device/Sensor/I2C model.

**EXPECTED INPUT** Confirmed module wiring and address.

**EXPECTED OUTPUT** Deliberate temporary/static plan.

**ERRORS TO HANDLE** If the actual module is not SHT4x-compatible, stop.

**DO NOT IMPLEMENT YET** Direct-I2C protocol or generic module operations.

**COMPILE NOW?** NO.

**FLASH NOW?** NO.

**TEST** Confirm installed binding requires `repeatability` and I2C address.

**EXPECTED RESULT** No ambiguity about why the static node is temporary.

**IF IT WORKS, NEXT** Step 4.2.

### Step 4.2 — Add a temporary static SHT4x node

**OPEN** `boards/esp32c3_devkitm_esp32c3.overlay`.

**WRITE / MODIFY** Under the already enabled real I2C controller add:

```dts
/* TEMPORARY SHORTCUT: removed in Milestone 8. */
sht40_test: sht4x@44 {
    compatible = "sensirion,sht4x";
    reg = <0x44>;
    repeatability = <2>;
};
```

Use `0x44` only after verifying the actual module/address selection. The static
node is for bring-up, not the final removable-module model.

**PURPOSE** Let Zephyr instantiate its installed SHT4x driver.

**WHY NOW** Device Model needs a DT instance for the standard sensor driver.

**CALLED / USED BY** Zephyr SHT4x driver and temporary wrapper.

**TRIGGER** BUILD.

**MECHANISM** BUILD TIME.

**EXECUTION CONTEXT** Devicetree/CMake.

**CALLS / DEPENDS ON** Real I2C controller and installed binding.

**EXPECTED INPUT** Verified address and bus.

**EXPECTED OUTPUT** `DT_NODELABEL(sht40_test)` device instance.

**ERRORS TO HANDLE** Address conflict, missing required repeatability, wrong bus.

**DO NOT IMPLEMENT YET** A Spaghetti Port binding or runtime discovery.

**COMPILE NOW?** NO; enable Sensor first.

**FLASH NOW?** NO.

**TEST** No placeholder remains; comment clearly says temporary.

**EXPECTED RESULT** Valid static sensor node.

**IF IT WORKS, NEXT** Step 4.3.

### Step 4.3 — Enable Sensor API and create wrapper files

**OPEN** `prj.conf`; CREATE `spaghetti_modules/sht40/sht40.h` and
`spaghetti_modules/sht40/sht40.c`.

**WRITE / MODIFY** Add `CONFIG_SENSOR=y`; `CONFIG_SHT4X` should become `y`
automatically because the enabled compatible selects it. In `sht40.h`, declare
`int spaghetti_sht40_test_init(void);` and
`int spaghetti_sht40_test_read(struct sensor_value *temperature,
struct sensor_value *humidity);`. In `.c`, obtain
`DEVICE_DT_GET(DT_NODELABEL(sht40_test))`, check `device_is_ready`, then use
`sensor_sample_fetch` and `sensor_channel_get` for ambient temperature/humidity.

**TEMPORARY SHORTCUT** These names/API expose Zephyr sensor types and a static
device. Milestones 5 and 8 replace them.

**PURPOSE** Isolate the hardware test from `main` while remaining fast.

**WHY NOW** A working sensor result is the next vertical-slice proof.

**CALLED / USED BY** Temporary `main` test.

**TRIGGER** BOOT and periodic test call.

**MECHANISM** DIRECT CALL.

**EXECUTION CONTEXT** Main thread.

**CALLS / DEPENDS ON** Zephyr Device and Sensor APIs.

**EXPECTED INPUT** Two output pointers.

**EXPECTED OUTPUT** `0` and two sensor values.

**ERRORS TO HANDLE** `-EINVAL`, device not ready, fetch/get error.

**DO NOT IMPLEMENT YET** zbus, driver registry, own thread, heater.

**COMPILE NOW?** NO; integrate next.

**FLASH NOW?** NO.

**TEST** Review every lower call's return value.

**EXPECTED RESULT** Thin wrapper, no loop.

**IF IT WORKS, NEXT** Step 4.4.

### Step 4.4 — Link, call, build, and flash SHT40

**OPEN** Root `CMakeLists.txt` and `src/main.c`.

**WRITE / MODIFY** Add `spaghetti_modules/sht40/sht40.c` to target sources. In
`main`, after Core init, call temporary SHT40 init once and read every second;
print `sensor_value.val1` and six-digit absolute `val2` without requiring float
printf. Keep error logs and delay.

**PURPOSE** Produce the first physical measurement.

**WHY NOW** Do not proceed to abstractions without real bus/sensor proof.

**CALLED / USED BY** Main test harness.

**TRIGGER** BOOT/PERIODIC TEST LOOP.

**MECHANISM** DIRECT CALL and `k_sleep`, not `K_TIMER` yet.

**EXECUTION CONTEXT** Main thread.

**CALLS / DEPENDS ON** Temporary wrapper -> Sensor API -> I2C.

**EXPECTED INPUT** Connected powered SHT40.

**EXPECTED OUTPUT** Temperature and humidity once per second.

**ERRORS TO HANDLE** Init/read failure; log and retry only with a clear policy.

**DO NOT IMPLEMENT YET** Runtime scheduling, zbus, MQTT.

**COMPILE NOW?** YES: `make pristine`; verify `.config` contains
`CONFIG_SENSOR=y`, `CONFIG_SHT4X=y`, `CONFIG_I2C=y`.

**FLASH NOW?** YES via existing workflow.

**TEST** Observe plausible temperature/humidity; disconnect sensor and verify a
bounded error rather than crash/hang; reconnect/reset.

**EXPECTED RESULT** Real SHT40 values in serial log.

**IF IT WORKS, NEXT** Step 5.1.

## STOP HERE UNTIL

- [ ] Static SHT4x device is ready.
- [ ] Real temperature is printed.
- [ ] Real humidity is printed.
- [ ] Missing sensor produces a controlled error.
- [ ] Static node/wrapper are marked TEMPORARY SHORTCUT.

# MILESTONE 5 — Introduce Module and Module Driver incrementally

### Step 5.1 — Define the minimal module instance

**OPEN** `include/spaghetti/module.h`.

**WRITE / MODIFY** Add `typedef uint16_t spaghetti_module_id_t;`, minimal state
enum (`UNINITIALIZED`, `READY`, `ERROR`), and `struct spaghetti_module` containing
only ID, Port pointer, driver pointer, and private context pointer. Forward-declare
Port/driver types to avoid cyclic includes.

**PURPOSE** Separate one runtime instance from its implementation type.

**WHY NOW** Registry/Manager need a small common object, not the final huge model.

**CALLED / USED BY** Driver operations, Manager, Runtime later.

**TRIGGER** MODULE CONFIGURATION.

**MECHANISM** DIRECT CALL object passing.

**EXECUTION CONTEXT** Calling thread.

**CALLS / DEPENDS ON** Port/driver declarations only.

**EXPECTED INPUT** Manager-supplied fields.

**EXPECTED OUTPUT** Minimal runtime instance layout.

**ERRORS TO HANDLE** None in type; document invalid/null relationships.

**DO NOT IMPLEMENT YET** Names, discovery metadata, data queues, MQTT state.

**COMPILE NOW?** NO.

**FLASH NOW?** NO.

**TEST** Ownership checklist: CREATED/OWNED/MODIFIED/DESTROYED by Manager; READ by
driver/Runtime/Communication.

**EXPECTED RESULT** Instance and type are clearly distinct.

**IF IT WORKS, NEXT** Step 5.2.

### Step 5.2 — Define the smallest driver operation table

**OPEN** `include/spaghetti/module_driver.h`.

**WRITE / MODIFY** Define stable type ID as bounded string or enum; for the first
iteration prefer `const char *type_id`. Define:

```c
struct spaghetti_module_driver_ops {
    int (*init)(struct spaghetti_module *module);
    int (*read)(struct spaghetti_module *module,
                struct spaghetti_sample *sample);
    int (*deinit)(struct spaghetti_module *module);
};
struct spaghetti_module_driver {
    const char *type_id;
    enum spaghetti_port_capability required_capabilities;
    const struct spaghetti_module_driver_ops *ops;
};
```

Forward-declare `spaghetti_sample`; define its temporary minimal temperature/
humidity form locally or in `data.h` only when needed. Do not generalize channels.

**PURPOSE** Let Manager call any module type through one contract.

**WHY NOW** SHT40 must prove the operation table before Registry exists.

**CALLED / USED BY** SHT40 implementation and future Manager.

**TRIGGER** MODULE LIFECYCLE/READ.

**MECHANISM** DIRECT CALL through function pointers.

**EXECUTION CONTEXT** Caller thread.

**CALLS / DEPENDS ON** Module and Port capability types.

**EXPECTED INPUT** Module pointer and sample output.

**EXPECTED OUTPUT** `0` or negative errno.

**ERRORS TO HANDLE** Null ops/module, unsupported capability, I/O failure.

**DO NOT IMPLEMENT YET** Command/configure/probe/power callback or ABI version.

**COMPILE NOW?** NO.

**FLASH NOW?** NO.

**TEST** Review that driver does not own the module instance.

**EXPECTED RESULT** Three-operation contract only.

**IF IT WORKS, NEXT** Step 5.3.

### Step 5.3 — Adapt temporary SHT40 wrapper to the operation table

**OPEN** `spaghetti_modules/sht40/sht40.h`, `sht40.c`, `src/main.c`.

**WRITE / MODIFY** Export an immutable
`const struct spaghetti_module_driver spaghetti_sht40_driver`. Implement its
`init/read/deinit` using the already working static Zephyr SHT4x device. In main,
construct one TEMPORARY module object and invoke only `driver.ops`.

**TEMPORARY SHORTCUT** Module object lives in main; sensor device is still static.
Manager removes the first shortcut in Milestone 7; Milestone 8 removes the second.

**PURPOSE** Prove polymorphic call flow without changing proven hardware code.

**WHY NOW** Registry should store a tested driver descriptor.

**CALLED / USED BY** Temporary main harness.

**TRIGGER** BOOT/PERIODIC READ.

**MECHANISM** DIRECT CALL through operation table.

**EXECUTION CONTEXT** Main thread.

**CALLS / DEPENDS ON** Temporary SHT4x Sensor wrapper.

**EXPECTED INPUT** Module with Port 0 and output sample.

**EXPECTED OUTPUT** Same real values as Milestone 4.

**ERRORS TO HANDLE** Missing op, incompatible Port, prior sensor errors.

**DO NOT IMPLEMENT YET** Registry/Manager lookup or zbus.

**COMPILE NOW?** YES: `make build`.

**FLASH NOW?** YES.

**TEST** Ensure main never calls `sensor_*` or SHT40 concrete functions directly;
it calls operation pointers.

**EXPECTED RESULT** Measurements unchanged through generic driver contract.

**IF IT WORKS, NEXT** Step 6.1.

## STOP HERE UNTIL

- [ ] Module ownership is documented.
- [ ] Driver descriptor has only required initial operations.
- [ ] Main reads through the operation table.
- [ ] Real measurement still works.

# MILESTONE 6 — Add the Driver Registry

### Step 6.1 — Declare Registry lookup API

**OPEN** `include/spaghetti/driver_registry.h`.

**WRITE / MODIFY** Declare `int spaghetti_driver_registry_init(void);`,
`const struct spaghetti_module_driver *spaghetti_driver_registry_find(const char
*type_id);`, and optionally `size_t spaghetti_driver_registry_count(void);`.

**PURPOSE** Resolve a module type without Manager referencing SHT40 symbols.

**WHY NOW** The tested SHT40 descriptor is ready to register.

**CALLED / USED BY** Core initializes; Manager finds; Communication later counts.

**TRIGGER** BOOT/MODULE CONFIGURATION.

**MECHANISM** DIRECT CALL.

**EXECUTION CONTEXT** Main/calling thread.

**CALLS / DEPENDS ON** Module Driver type.

**EXPECTED INPUT** Null-terminated bounded type ID.

**EXPECTED OUTPUT** Const descriptor or `NULL` for unknown.

**ERRORS TO HANDLE** Null/empty key and duplicate descriptors during init.

**DO NOT IMPLEMENT YET** Runtime registration, hash table, iterable sections.

**COMPILE NOW?** NO.

**FLASH NOW?** NO.

**TEST** API review: Registry never initializes the driver.

**EXPECTED RESULT** Minimal immutable lookup contract.

**IF IT WORKS, NEXT** Step 6.2.

### Step 6.2 — Implement fixed Registry

**OPEN** `subsys/driver_registry/driver_registry.c`.

**WRITE / MODIFY** Create a private const pointer array containing
`&spaghetti_sht40_driver`; validate non-null IDs/ops and duplicates in init;
implement linear exact-string lookup and count.

**PURPOSE** Use predictable static memory and simple debugging.

**WHY NOW** One driver does not justify linker magic or a hash table.

**CALLED / USED BY** Core/Manager.

**TRIGGER** BOOT/LOOKUP.

**MECHANISM** DIRECT CALL.

**EXECUTION CONTEXT** Caller thread; immutable after init.

**CALLS / DEPENDS ON** SHT40 descriptor and standard bounded string comparison.

**EXPECTED INPUT** `"sht40"` or another ID.

**EXPECTED OUTPUT** SHT40 pointer or `NULL`.

**ERRORS TO HANDLE** Duplicate/invalid table; unknown lookup is normal.

**DO NOT IMPLEMENT YET** Locking; frozen lookup needs none.

**COMPILE NOW?** NO; integrate next.

**FLASH NOW?** NO.

**TEST** Local test path for known and unknown IDs.

**EXPECTED RESULT** Deterministic linear registry.

**IF IT WORKS, NEXT** Step 6.3.

### Step 6.3 — Link and test Registry from Core/main

**OPEN** Root `CMakeLists.txt`, `subsys/core/core.c`, temporary test in `main`.

**WRITE / MODIFY** Add `subsys/driver_registry/driver_registry.c`; Core calls
registry init after Port. Temporarily assert/log that `find("sht40")` is non-null
and `find("does-not-exist")` is null, then continue existing read path.

**PURPOSE** Prove both success and clean failure on-device.

**WHY NOW** Manager must receive a trustworthy Registry.

**CALLED / USED BY** Core/test.

**TRIGGER** BOOT.

**MECHANISM** DIRECT CALL.

**EXECUTION CONTEXT** Main thread.

**CALLS / DEPENDS ON** Registry APIs.

**EXPECTED INPUT** Known/unknown strings.

**EXPECTED OUTPUT** Exact pointer/null behavior.

**ERRORS TO HANDLE** Registry init error stops Core readiness.

**DO NOT IMPLEMENT YET** Manager or dynamic configuration.

**COMPILE NOW?** YES: `make build`.

**FLASH NOW?** YES.

**TEST** Observe known success/unknown rejection and continued sensor reading.

**EXPECTED RESULT** No crash or fallback for unknown ID.

**IF IT WORKS, NEXT** Step 7.1.

## STOP HERE UNTIL

- [ ] Registry initializes once.
- [ ] `find("sht40")` returns the SHT40 descriptor.
- [ ] `find("does-not-exist")` returns `NULL`.
- [ ] Registry performs no driver lifecycle call.

# MILESTONE 7 — Configure `Port 0 = SHT40` through Module Manager

### Step 7.1 — Declare Manager's first lifecycle API

**OPEN** `include/spaghetti/module_manager.h`.

**WRITE / MODIFY** Declare `int spaghetti_module_manager_init(void);`,
`int spaghetti_module_manager_configure(spaghetti_port_id_t port_id, const char
*type_id, spaghetti_module_id_t *out_id);`,
`const struct spaghetti_module *spaghetti_module_manager_get_by_port(...)`, and
`int spaghetti_module_manager_read(spaghetti_module_id_t id, struct
spaghetti_sample *out);`.

**PURPOSE** Own one live instance and route its first operation.

**WHY NOW** The Port and Registry are independently proven.

**CALLED / USED BY** Core/main test; Runtime later.

**TRIGGER** BOOT TEST/MODULE CONFIGURATION/READ REQUEST.

**MECHANISM** DIRECT CALL.

**EXECUTION CONTEXT** Caller thread.

**CALLS / DEPENDS ON** Port, Registry, driver ops.

**EXPECTED INPUT** Port 0, `"sht40"`, output ID/sample.

**EXPECTED OUTPUT** READY instance and real sample.

**ERRORS TO HANDLE** Invalid port/type, occupied port, no slot, init/read failure.

**DO NOT IMPLEMENT YET** Remove/replace, mutex, dynamic pool, discovery.

**COMPILE NOW?** NO.

**FLASH NOW?** NO.

**TEST** Ownership: CREATED/OWNED/MODIFIED/DESTROYED by Manager.

**EXPECTED RESULT** API limited to one configuration case.

**IF IT WORKS, NEXT** Step 7.2.

### Step 7.2 — Implement one-slot Manager

**OPEN** `subsys/module_manager/module_manager.c`.

**WRITE / MODIFY** Create one private module slot plus used flag. `init` clears it.
`configure` calls `spaghetti_port_get`, Registry find, capability validation, fills
slot, calls driver `init`, and commits READY only on success. `read` validates ID/
READY and calls driver `read`. On init failure clear the slot.

**PURPOSE** Build the exact first lifecycle transaction.

**WHY NOW** One slot makes failure/ownership visible before adding complexity.

**CALLED / USED BY** Main test/Runtime.

**TRIGGER** MODULE CONFIGURATION/READ.

**MECHANISM** DIRECT CALL chain.

**EXECUTION CONTEXT** Main/calling thread.

**CALLS / DEPENDS ON** `port_get` -> `registry_find` -> `driver->init/read`.

**EXPECTED INPUT** Valid IDs and output pointers.

**EXPECTED OUTPUT** Instance ID and sample.

**ERRORS TO HANDLE** `-EINVAL`, `-ENOENT`, `-ENOTSUP`, `-EBUSY`, driver errno.

**DO NOT IMPLEMENT YET** Threads, queues, replacement, callbacks.

**COMPILE NOW?** NO; integrate next.

**FLASH NOW?** NO.

**TEST** Mentally trace rollback before compiling.

**EXPECTED RESULT** No partially READY instance after failure.

**IF IT WORKS, NEXT** Step 7.3.

### Step 7.3 — Replace main-owned instance with Manager

**OPEN** Root `CMakeLists.txt`, `subsys/core/core.c`, `src/main.c`.

**WRITE / MODIFY** Add Manager source. Core initializes it after Registry. In main,
remove the temporary module object and call configure for Port 0/SHT40 once, then
Manager read in the existing loop.

**TEMPORARY SHORTCUT** The assignment and sampling loop are still hardcoded in
main; Milestones 9 and 12 remove them.

**PURPOSE** Establish the required final control chain early.

**WHY NOW** Internal Config can later call exactly this Manager API.

**CALLED / USED BY** Main test.

**TRIGGER** BOOT/PERIODIC LOOP.

**MECHANISM** DIRECT CALL.

**EXECUTION CONTEXT** Main thread.

**CALLS / DEPENDS ON** Manager -> Registry -> driver -> current static sensor.

**EXPECTED INPUT** Port 0, `sht40`.

**EXPECTED OUTPUT** Instance READY and values.

**ERRORS TO HANDLE** Log exact configure/read errno.

**DO NOT IMPLEMENT YET** Config struct or CBOR.

**COMPILE NOW?** YES: `make build`.

**FLASH NOW?** YES.

**TEST** Also request unknown type and occupied Port in controlled test, then
restore valid path.

**EXPECTED RESULT** Real values now pass through Manager.

**IF IT WORKS, NEXT** Step 8.1.

## STOP HERE UNTIL

- [ ] Manager owns the only module instance.
- [ ] Configure calls Port, Registry, then driver in that order.
- [ ] Port 0/SHT40 reaches READY.
- [ ] Unknown type and occupied Port fail cleanly.
- [ ] Real read works through Manager.

# MILESTONE 8 — REMOVE TEMPORARY SHORTCUT: runtime-removable SHT40

### Step 8.1 — Define SHT40 runtime configuration

**OPEN** `spaghetti_modules/sht40/sht40.h` and the module-driver init contract.

**WRITE / MODIFY** Define minimal private/public configuration containing only a
verified I2C address, e.g. `struct spaghetti_sht40_config { uint16_t address; };`.
Extend Manager configure only enough to pass a bounded config pointer/length or a
typed initial config. Prefer a generic bounded config view if it remains clear.

**PURPOSE** Move address from static sensor node into runtime instance config.

**WHY NOW** Removable modules cannot rely on one pre-instantiated Zephyr sensor.

**CALLED / USED BY** Manager creates; SHT40 init/read consumes.

**TRIGGER** MODULE CONFIGURATION.

**MECHANISM** DIRECT CALL.

**EXECUTION CONTEXT** Manager/caller thread.

**CALLS / DEPENDS ON** Module/driver config contract.

**EXPECTED INPUT** Verified address such as 0x44 from configuration.

**EXPECTED OUTPUT** Per-instance context has address and Port.

**ERRORS TO HANDLE** Invalid/out-of-range address and wrong config size/type.

**DO NOT IMPLEMENT YET** Full channel schema, EEPROM, alternate addresses guessed.

**COMPILE NOW?** NO.

**FLASH NOW?** NO.

**TEST** Config validation accepts verified address and rejects invalid values.

**EXPECTED RESULT** No driver-global runtime address.

**IF IT WORKS, NEXT** Step 8.2.

### Step 8.2 — Replace Sensor API with Port + direct I2C

**OPEN** `spaghetti_modules/sht40/sht40.c` and the exact SHT40 datasheet.

**WRITE / MODIFY** Reimplement driver `init/read` using
`spaghetti_port_i2c_device()` plus Zephyr `i2c_write`, `i2c_read`, or
`i2c_write_read`. Implement only the measurement mode needed. Validate response
CRC and convert raw temperature/humidity into the current sample type. Keep each
protocol constant traceable to the datasheet.

**PURPOSE** Support a module chosen at runtime on a static Core bus.

**WHY NOW** The standard Zephyr SHT4x driver requires static DT instantiation.

**CALLED / USED BY** Manager through driver ops.

**TRIGGER** MODULE INIT/READ.

**MECHANISM** DIRECT CALL.

**EXECUTION CONTEXT** Manager/Runtime thread; bounded sleep if datasheet requires.

**CALLS / DEPENDS ON** Port API and Zephyr I2C API.

**EXPECTED INPUT** Port, runtime address, output sample.

**EXPECTED OUTPUT** Same real values as static driver path.

**ERRORS TO HANDLE** NACK, timeout, CRC, invalid raw response, removal during read.

**DO NOT IMPLEMENT YET** Async I2C, heater modes, automatic probing.

**COMPILE NOW?** YES while static node still exists as comparison: `make build`.

**FLASH NOW?** YES; compare readings before removing shortcut.

**TEST** Real reading and disconnected-sensor error; compare plausible values with
Milestone 4 output.

**EXPECTED RESULT** Driver no longer calls Sensor API.

**IF IT WORKS, NEXT** Step 8.3.

### Step 8.3 — Remove the static SHT4x device

**OPEN** Board overlay, `prj.conf`, SHT40 source/header.

**WRITE / MODIFY** Delete only the temporary `sht40_test` node. Remove
`CONFIG_SENSOR=y` if nothing else uses Sensor API; keep `CONFIG_I2C=y`. Delete
temporary test API and all `DEVICE_DT_GET(DT_NODELABEL(sht40_test))`/
`sensor_*` use. Keep runtime address passed through Manager.

**PURPOSE** Complete transition to removable-module model.

**WHY NOW** Both paths were compared on real hardware.

**CALLED / USED BY** Build and final SHT40 driver.

**TRIGGER** REFACTOR AFTER HARDWARE PROOF.

**MECHANISM** BUILD TIME plus DIRECT CALL runtime path.

**EXECUTION CONTEXT** Build/main thread.

**CALLS / DEPENDS ON** Port I2C only.

**EXPECTED INPUT** Runtime Port/address.

**EXPECTED OUTPUT** Same values with no static module DT node.

**ERRORS TO HANDLE** Kconfig/source still depending on Sensor API.

**DO NOT IMPLEMENT YET** Custom Port DT binding.

**COMPILE NOW?** YES: `make pristine`.

**FLASH NOW?** YES.

**TEST** Search source/final DTS for `sht40_test` and static compatible; confirm
none, then verify measurement.

**EXPECTED RESULT** Port 0/SHT40 is runtime-configured and working.

**IF IT WORKS, NEXT** Step 9.1.

## STOP HERE UNTIL

- [ ] No removable SHT40 node remains in Devicetree.
- [ ] SHT40 uses Port + Zephyr I2C API.
- [ ] Address is instance configuration, not driver global.
- [ ] CRC/I2C errors are handled.
- [ ] Real measurements still work.

# MILESTONE 9 — Build the internal configuration path before CBOR

### Step 9.1 — Define the smallest internal config model

**OPEN** `include/spaghetti/config.h`.

**WRITE / MODIFY** Define fixed limits and only the fields required now:

```c
struct spaghetti_module_config {
    spaghetti_port_id_t port_id;
    const char *type_id;
    uint16_t i2c_address;
};
struct spaghetti_runtime_sampling_config {
    spaghetti_port_id_t port_id;
    uint32_t period_ms;
};
struct spaghetti_config {
    uint32_t version;
    size_t module_count;
    struct spaghetti_module_config modules[SPAGHETTI_CONFIG_MAX_MODULES];
    struct spaghetti_runtime_sampling_config sampling;
};
```

Replace borrowed `const char *` with a bounded owned string if config must outlive
input; document ownership now. Declare `spaghetti_config_validate` and
`spaghetti_config_apply`.

**PURPOSE** Give all firmware layers C structures independent of serialization.

**WHY NOW** CBOR must fill a proven model, not define architecture.

**CALLED / USED BY** Main test, future decoder/Communication, Manager/Runtime.

**TRIGGER** CONFIG COMMAND/BOOT TEST.

**MECHANISM** DIRECT CALL.

**EXECUTION CONTEXT** Caller thread.

**CALLS / DEPENDS ON** Port/module IDs.

**EXPECTED INPUT** Version, Port 0/SHT40/address, 1000 ms.

**EXPECTED OUTPUT** Valid internal configuration.

**ERRORS TO HANDLE** Wrong version/count, duplicate port, empty type, zero period.

**DO NOT IMPLEMENT YET** CBOR, MQTT fields, discovery policy, giant union.

**COMPILE NOW?** NO.

**FLASH NOW?** NO.

**TEST** Ownership/lifetime review for type strings and arrays.

**EXPECTED RESULT** Small bounded config.

**IF IT WORKS, NEXT** Step 9.2.

### Step 9.2 — Implement validation and apply

**OPEN** `subsys/config/config.c`.

**WRITE / MODIFY** Implement pure validation first. Implement `apply` as: validate
entire config; for each initial module DIRECT CALL Manager configure; only then
hand sampling config to Runtime later. For this milestone apply only module config
and report sampling as stored/not yet active. Preserve first failure code/index.

**PURPOSE** Establish the real configuration-to-Manager boundary.

**WHY NOW** Main hardcode can be replaced without serialization.

**CALLED / USED BY** Main now; Communication/decoder later.

**TRIGGER** CONFIG COMMAND.

**MECHANISM** DIRECT CALL.

**EXECUTION CONTEXT** Main/calling thread.

**CALLS / DEPENDS ON** Module Manager configure.

**EXPECTED INPUT** Complete internal config.

**EXPECTED OUTPUT** Applied module(s) or exact validation/apply error.

**ERRORS TO HANDLE** Partial apply. For one module, rollback is simple; document
transaction strategy before multiple modules.

**DO NOT IMPLEMENT YET** Persistent state, CBOR, async config worker.

**COMPILE NOW?** NO; integrate next.

**FLASH NOW?** NO.

**TEST** Validate valid config plus bad version, duplicate/invalid Port, zero period.

**EXPECTED RESULT** Invalid config never calls Manager.

**IF IT WORKS, NEXT** Step 9.3.

### Step 9.3 — Replace main's assignment with a hardcoded C config

**OPEN** Root `CMakeLists.txt`, `subsys/core/core.c` or `src/main.c` test harness.

**WRITE / MODIFY** Add `subsys/config/config.c`. Construct one
`struct spaghetti_config` with Port 0, `sht40`, verified address, period 1000 ms;
call `spaghetti_config_apply`. Remove direct Manager configure from main; retain
temporary Manager read loop until Runtime.

**TEMPORARY SHORTCUT** Config contents are hardcoded C. CBOR replaces their source
in Milestone 15; Runtime removes the read loop in Milestone 12.

**PURPOSE** Exercise the final internal path before external encoding.

**WHY NOW** It isolates semantic config failures from future decoder failures.

**CALLED / USED BY** Main/Core test.

**TRIGGER** BOOT TEST.

**MECHANISM** DIRECT CALL.

**EXECUTION CONTEXT** Main thread.

**CALLS / DEPENDS ON** Config validate/apply -> Manager.

**EXPECTED INPUT** Hardcoded internal object.

**EXPECTED OUTPUT** SHT40 instance and real readings.

**ERRORS TO HANDLE** Log config validation/apply error distinctly.

**DO NOT IMPLEMENT YET** Encode/decode or storage.

**COMPILE NOW?** YES: `make build`.

**FLASH NOW?** YES.

**TEST** Change test period invalid to 0 and verify no Manager call; restore 1000.

**EXPECTED RESULT** `Config -> Manager -> Registry -> SHT40` works.

**IF IT WORKS, NEXT** Step 10.1.

## STOP HERE UNTIL

- [ ] Config is bounded and owns/controls string lifetime.
- [ ] Validation occurs before Manager calls.
- [ ] Main does not directly configure Manager.
- [ ] Hardcoded C config produces a real sample.
- [ ] Invalid config is rejected with exact error.

# MILESTONE 10 — Persist only the proven internal config

### Step 10.1 — Define Storage's minimal synchronous API

**OPEN / CREATE** `subsys/services/storage/storage.h` and `storage.c`.

**WRITE / MODIFY** Declare/implement `spaghetti_storage_init`,
`spaghetti_storage_read_config`, and `spaghetti_storage_write_config` using a
versioned fixed record. Initially a fake RAM backend is acceptable for API tests.

**PURPOSE** Separate Config schema from Zephyr persistent backend.

**WHY NOW** Internal model is proven and small enough to version.

**CALLED / USED BY** Core/Config only.

**TRIGGER** BOOT/VALID CONFIG UPDATE.

**MECHANISM** DIRECT CALL.

**EXECUTION CONTEXT** Main/calling thread; never ISR.

**CALLS / DEPENDS ON** Initially memory; later Zephyr Settings.

**EXPECTED INPUT** Config record/destination.

**EXPECTED OUTPUT** Found/not-found/corrupt/status.

**ERRORS TO HANDLE** Missing record is normal; wrong size/version/corruption.

**DO NOT IMPLEMENT YET** Measurement history or arbitrary blobs.

**COMPILE NOW?** YES after adding storage source to root CMake: `make build`.

**FLASH NOW?** NO for RAM-only backend.

**TEST** Write/read equality and wrong-version rejection.

**EXPECTED RESULT** Config can depend on Storage contract, not flash API.

**IF IT WORKS, NEXT** Step 10.2.

### Step 10.2 — Add real Zephyr Settings backend

**OPEN** `prj.conf`, verified board flash layout/overlay, `storage.c`, root CMake.

**WRITE / MODIFY** Add `CONFIG_SETTINGS=y` and select one installed non-filesystem
backend (`CONFIG_SETTINGS_NVS=y` is a practical first choice) only after defining
a real `storage` fixed partition that does not overlap firmware. Register a
Settings handler; load records through SETTINGS CALLBACK; save through Settings.

**PURPOSE** Survive reboot using Zephyr's persistent configuration facade.

**WHY NOW** Config read/write semantics already work without flash.

**CALLED / USED BY** Core/Config.

**TRIGGER** BOOT/CONFIG COMMIT.

**MECHANISM** DIRECT CALL + SETTINGS CALLBACK.

**EXECUTION CONTEXT** Main/calling thread during synchronous load/save.

**CALLS / DEPENDS ON** Zephyr Settings, chosen backend, real fixed partition.

**EXPECTED INPUT** Valid record and safe flash region.

**EXPECTED OUTPUT** Record restored after power cycle.

**ERRORS TO HANDLE** Missing/corrupt/full/I/O; never erase unrelated flash.

**DO NOT IMPLEMENT YET** Invent a partition size/address; derive from real flash.

**COMPILE NOW?** YES: `make pristine`.

**FLASH NOW?** YES after inspecting final partitions in generated DTS/map.

**TEST** Save assignment, power-cycle, load/apply; corrupt/version-mismatch test
through a controlled test record, not random flash writes.

**EXPECTED RESULT** Config persists or falls back explicitly.

**IF IT WORKS, NEXT** Step 11.1.

## STOP HERE UNTIL

- [ ] Storage partition is verified non-overlapping.
- [ ] Settings backend initializes.
- [ ] Config survives a real power cycle.
- [ ] Missing/corrupt record has controlled behavior.
- [ ] No measurement history or secrets were added.

# MILESTONE 11 — Distribute samples through Data/zbus

### Step 11.1 — Define one immutable temperature sample message

**OPEN** `include/spaghetti/data.h`.

**WRITE / MODIFY** Define `struct spaghetti_temperature_sample` with source
module ID, fixed-point/micro-unit temperature, humidity if needed, uptime timestamp,
sequence, and validity flags. Declare `int spaghetti_data_init(void);` and
`int spaghetti_data_publish_temperature(const ... *, k_timeout_t timeout);`.

**PURPOSE** Create one bounded message with explicit ownership.

**WHY NOW** A real sensor works; three future consumers require decoupling.

**CALLED / USED BY** Acquisition path publishes; logger/Runtime/MQTT/PC consume.

**TRIGGER** DATA ARRIVAL.

**MECHANISM** DIRECT CALL into Data, then ZBUS PUBLISH.

**EXECUTION CONTEXT** Acquisition/Runtime thread.

**CALLS / DEPENDS ON** zbus later; uptime API for timestamp.

**EXPECTED INPUT** Complete copied value, never stack pointer inside payload.

**EXPECTED OUTPUT** Publish status.

**ERRORS TO HANDLE** Invalid source/value and publication timeout/full pool.

**DO NOT IMPLEMENT YET** Generic variant payload, MQTT topic, heap strings.

**COMPILE NOW?** NO.

**FLASH NOW?** NO.

**TEST** Confirm struct size/alignment and value lifetime are bounded.

**EXPECTED RESULT** One precise Data contract.

**IF IT WORKS, NEXT** Step 11.2.

### Step 11.2 — Define zbus channel and two message subscribers

**OPEN** `subsys/data/data.c`, `prj.conf`, root `CMakeLists.txt`.

**WRITE / MODIFY** Add `CONFIG_ZBUS=y`, `CONFIG_ZBUS_MSG_SUBSCRIBER=y`, and start
with static/fixed message-buffer settings sized from the installed Kconfig help;
avoid dynamic allocation unless measured necessary. In `data.c`, define
`ZBUS_CHAN_DEFINE(spaghetti_temperature_chan, struct
spaghetti_temperature_sample, validator, NULL,
ZBUS_OBSERVERS(logger_msg_sub, test_msg_sub), initial_value)` and
`ZBUS_MSG_SUBSCRIBER_DEFINE` for both. Implement publish with `zbus_chan_pub`.
Add `data.c` to CMake.

**PURPOSE** Give each consumer its own copied message rather than “latest value”.

**WHY NOW** Runtime automation should not silently miss an intermediate sample.

**CALLED / USED BY** Publisher and two test consumer threads.

**TRIGGER** DATA ARRIVAL.

**MECHANISM** ZBUS PUBLISH / ZBUS MESSAGE SUBSCRIBER.

**EXECUTION CONTEXT** Publisher thread; consumers' dedicated test threads.

**CALLS / DEPENDS ON** `zbus_chan_pub`, `zbus_sub_wait_msg`.

**EXPECTED INPUT** Sample copy.

**EXPECTED OUTPUT** Independent copy to both subscribers.

**ERRORS TO HANDLE** Validator rejection, allocation/pool exhaustion, timeout.

**DO NOT IMPLEMENT YET** MQTT or Communication consumers.

**COMPILE NOW?** YES: `make pristine`.

**FLASH NOW?** NO until fake publication test compiles.

**TEST** Publish one fake sample; each test consumer logs same sequence/value once.

**EXPECTED RESULT** Two independent receipts.

**IF IT WORKS, NEXT** Step 11.3.

### Step 11.3 — Publish real SHT40 result

**OPEN** Manager/acquisition call site, `subsys/data/data.c`, `src/main.c`.

**WRITE / MODIFY** After successful Manager read, convert to
`spaghetti_temperature_sample` and call Data publish. Remove direct sample print
from SHT40 driver; logger subscriber owns printing. Second test consumer logs only
sequence/receipt to prove fan-out.

**PURPOSE** Complete real sensor -> common Data path.

**WHY NOW** Runtime/MQTT must consume Data, not SHT40 APIs.

**CALLED / USED BY** Temporary main acquisition loop; subscribers.

**TRIGGER** DATA ARRIVAL.

**MECHANISM** DIRECT CALL then ZBUS PUBLISH.

**EXECUTION CONTEXT** Main publisher, subscriber threads.

**CALLS / DEPENDS ON** Manager read and Data publish.

**EXPECTED INPUT** Real sample.

**EXPECTED OUTPUT** Logger and test subscriber receive identical sequence.

**ERRORS TO HANDLE** Read failure publishes no valid sample; publish failure logged.

**DO NOT IMPLEMENT YET** MQTT, PC streaming, generic Data routing.

**COMPILE NOW?** YES: `make build`.

**FLASH NOW?** YES.

**TEST** Run for multiple samples; verify monotonically increasing sequence in both
consumers; intentionally pause a consumer to test pool/backpressure policy.

**EXPECTED RESULT** Every accepted test sample is independently delivered.

**IF IT WORKS, NEXT** Step 12.1.

## STOP HERE UNTIL

- [ ] Data message has explicit ownership and bounded size.
- [ ] Logger receives fake and real samples.
- [ ] Second consumer receives the same sequences.
- [ ] Full-buffer behavior is observed/documented.
- [ ] SHT40 knows nothing about consumers/MQTT.

# MILESTONE 12 — Runtime V0: sample Module 0 every 1000 ms

### Step 12.1 — Define one sampling task, not a scripting engine

**OPEN** `include/spaghetti/runtime.h`.

**WRITE / MODIFY** Define `struct spaghetti_runtime_sampling_task` with module ID,
period milliseconds, and enabled flag. Declare `spaghetti_runtime_init`,
`spaghetti_runtime_load_sampling_task`, `spaghetti_runtime_start`, and
`spaghetti_runtime_stop`.

**PURPOSE** Represent exactly one periodic acquisition.

**WHY NOW** Config already contains a sample period and Data already distributes.

**CALLED / USED BY** Core/Config; Runtime owns task copy while loaded.

**TRIGGER** BOOT/CONFIG APPLY.

**MECHANISM** DIRECT CALL for lifecycle.

**EXECUTION CONTEXT** Main/calling thread.

**CALLS / DEPENDS ON** Module Manager/Data/Timer service later.

**EXPECTED INPUT** READY module ID and period 1000 ms.

**EXPECTED OUTPUT** Valid loaded task/status.

**ERRORS TO HANDLE** Zero/overflow period, unknown module, already running.

**DO NOT IMPLEMENT YET** Conditions, actions, graph, bytecode, multiple tasks.

**COMPILE NOW?** NO.

**FLASH NOW?** NO.

**TEST** Validate 1000; reject zero and unknown ID.

**EXPECTED RESULT** Minimal task contract.

**IF IT WORKS, NEXT** Step 12.2.

### Step 12.2 — Implement timer-to-worker execution

**OPEN / CREATE** `subsys/runtime/runtime.c`,
`subsys/services/timer/timer.h`, `subsys/services/timer/timer.c`.

**WRITE / MODIFY** Timer wraps one `k_timer`. Its expiry callback only performs
`k_sem_give` or `k_msgq_put(..., K_NO_WAIT)`; choose `K_SEM` for this single
periodic wake-up. Runtime owns one dedicated thread: wait on semaphore, DIRECT
CALL Manager read, then Data publish. Implement start/stop around `k_timer_start`
and `k_timer_stop`.

**PURPOSE** Move acquisition out of main and never read hardware in timer context.

**WHY NOW** The manual loop has proved all lower layers.

**CALLED / USED BY** Core/Config starts; Zephyr timer wakes Runtime.

**TRIGGER** RUNTIME TIMER.

**MECHANISM** K_TIMER -> K_SEM -> THREAD -> DIRECT CALL.

**EXECUTION CONTEXT** Timer expiry gives semaphore; Runtime thread does I/O.

**CALLS / DEPENDS ON** Kernel timer/semaphore/thread, Manager read, Data publish.

**EXPECTED INPUT** Loaded task.

**EXPECTED OUTPUT** One sample event per period.

**ERRORS TO HANDLE** Missed/coalesced tick is observable with semaphore max=1;
read/publish failure; invalid task on start.

**DO NOT IMPLEMENT YET** zbus-driven scheduler, multiple timers, dynamic thread.

**COMPILE NOW?** NO; integrate next.

**FLASH NOW?** NO.

**TEST** Fake Manager counter before hardware test.

**EXPECTED RESULT** Timer callback contains no blocking call.

**IF IT WORKS, NEXT** Step 12.3.

### Step 12.3 — Link Runtime and remove main sampling loop

**OPEN** Root `CMakeLists.txt`, `subsys/core/core.c`, `subsys/config/config.c`,
`src/main.c`.

**WRITE / MODIFY** Add Runtime/Timer sources. Core initializes Runtime. Config apply
resolves configured Port to module ID, loads 1000 ms task, and starts Runtime.
Remove SHT40 Manager read and periodic sleep from main; main only boots Core.

**PURPOSE** Complete first autonomous vertical slice.

**WHY NOW** Main must stop owning application behavior.

**CALLED / USED BY** Core/Config/Runtime.

**TRIGGER** BOOT then periodic timer.

**MECHANISM** DIRECT CALL then K_TIMER/K_SEM/THREAD.

**EXECUTION CONTEXT** Main for setup; Runtime thread for reads.

**CALLS / DEPENDS ON** Config -> Runtime; Runtime -> Manager -> Data.

**EXPECTED INPUT** Internal config period/module.

**EXPECTED OUTPUT** Logger sample each second with short main.

**ERRORS TO HANDLE** Runtime start failure must make boot degraded/error.

**DO NOT IMPLEMENT YET** Relay threshold or CBOR.

**COMPILE NOW?** YES: `make build`.

**FLASH NOW?** YES.

**TEST** Measure ten timestamps; stop Runtime via temporary test and verify reads stop.

**EXPECTED RESULT** Automatic one-second samples without main loop logic.

**IF IT WORKS, NEXT** Step 13.1.

## STOP HERE UNTIL

- [ ] Timer callback performs no I/O/blocking.
- [ ] Runtime thread performs Manager read.
- [ ] Main no longer samples directly.
- [ ] Real Data sample appears every ~1000 ms.
- [ ] Runtime stop prevents further acquisitions.

# MILESTONE 13 — Relay and Runtime V1 threshold rule

### Step 13.1 — Implement minimal Relay module driver

**OPEN / CREATE** `spaghetti_modules/relay/relay.h`, `relay.c`; update
`module_driver.h` only as needed for `command` operation.

**WRITE / MODIFY** Add driver `command(module, command, value)` with only logical
boolean SET. Define private relay config using a Port capability based on the real
hardware. Implement safe init, set, deinit through Port. Add descriptor to fixed
Registry and source to CMake.

**PURPOSE** Add the first actuator without placing electrical policy in Runtime.

**WHY NOW** Runtime V1 needs a tested target.

**CALLED / USED BY** Manager command routing.

**TRIGGER** MODULE CONFIGURATION/USER ACTION.

**MECHANISM** DIRECT CALL.

**EXECUTION CONTEXT** Manager/Runtime thread.

**CALLS / DEPENDS ON** Real Port API and Zephyr GPIO/other verified peripheral.

**EXPECTED INPUT** Logical ON/OFF.

**EXPECTED OUTPUT** Applied state/status.

**ERRORS TO HANDLE** Unsupported Port, invalid command, hardware failure.

**DO NOT IMPLEMENT YET** Invent pin/active level/latching behavior; use schematic.

**COMPILE NOW?** YES after required real overlay/Kconfig/CMake changes; use
`make pristine` for DTS/Kconfig changes.

**FLASH NOW?** YES only after safe-state review.

**TEST** Manual Manager configure and OFF->ON->OFF; verify electrically and on log.

**EXPECTED RESULT** Logical state controls real/fake relay safely.

**IF IT WORKS, NEXT** Step 13.2.

### Step 13.2 — Add one explicit threshold rule

**OPEN** `include/spaghetti/runtime.h`, `subsys/runtime/runtime.c`, `data.c`.

**WRITE / MODIFY** Define only `struct spaghetti_runtime_threshold_rule` with
source module/channel, threshold in fixed units, target relay ID, and target bool.
Add `spaghetti_runtime_load_threshold_rule`. Make Runtime a zbus message subscriber
or route its existing Data subscriber into Runtime's `k_msgq`; evaluate in Runtime
thread and DIRECT CALL `spaghetti_module_manager_command` when `temp > 25 C`.

**PURPOSE** Prove Data-driven automation.

**WHY NOW** Both sensor Data and relay command work independently.

**CALLED / USED BY** Config loads; Runtime evaluates.

**TRIGGER** DATA ARRIVAL.

**MECHANISM** ZBUS MSG SUBSCRIBER -> Runtime THREAD -> DIRECT CALL.

**EXECUTION CONTEXT** Runtime thread.

**CALLS / DEPENDS ON** Data subscriber and Manager command.

**EXPECTED INPUT** Temperature sample and one rule.

**EXPECTED OUTPUT** Relay ON only for values strictly above threshold.

**ERRORS TO HANDLE** Missing target/source, wrong channel, command failure.

**DO NOT IMPLEMENT YET** Generic operators/actions, hysteresis unless required for
safe physical test, rule arrays, scripting.

**COMPILE NOW?** YES: `make build`.

**FLASH NOW?** YES after fake-value test.

**TEST** Inject 24.9, 25.0, 25.1 fixed-unit samples; expect no/no/one command.

**EXPECTED RESULT** Exact threshold semantics and real relay response.

**IF IT WORKS, NEXT** Step 14.1.

## STOP HERE UNTIL

- [ ] Relay hardware facts are verified.
- [ ] Manual OFF/ON/OFF works safely.
- [ ] Runtime receives Data in its thread.
- [ ] 24.9/25.0/25.1 produce expected actions.
- [ ] Runtime contains no GPIO/module-specific protocol.

# MILESTONE 14 — Communication V0 over the existing USB console

### Step 14.1 — Define protocol commands separately from transport

**OPEN** `include/spaghetti/communication.h`.

**WRITE / MODIFY** Define bounded request/response types for only `GET_STATUS` and
`SET_CONFIG`; declare `spaghetti_communication_init`,
`spaghetti_communication_handle_request`, and response callback registration or
return-buffer API. Payload for SET_CONFIG is bytes, not parsed fields.

**PURPOSE** Keep protocol dispatch independent from USB/shell/CBOR.

**WHY NOW** Local Config works and can be invoked by external ingress.

**CALLED / USED BY** Shell transport adapter now; future other transports.

**TRIGGER** COMMUNICATION RX.

**MECHANISM** DIRECT CALL after transport reception.

**EXECUTION CONTEXT** Communication worker/caller thread.

**CALLS / DEPENDS ON** Core/Config/decoder contract.

**EXPECTED INPUT** Bounded command and payload.

**EXPECTED OUTPUT** Versioned response/status.

**ERRORS TO HANDLE** Unknown command, oversized payload, invalid state.

**DO NOT IMPLEMENT YET** CBOR fields in Manager, BLE/Wi-Fi transports, OTA.

**COMPILE NOW?** NO.

**FLASH NOW?** NO.

**TEST** Pure request dispatch with GET_STATUS.

**EXPECTED RESULT** Transport-free protocol API.

**IF IT WORKS, NEXT** Step 14.2.

### Step 14.2 — Add a Zephyr shell transport adapter

**OPEN / CREATE** `subsys/communication/communication.c` and
`communication_shell.c`; open `prj.conf`, CMake, existing console overlay.

**WRITE / MODIFY** Add `CONFIG_SHELL=y`; keep existing
`zephyr,shell-uart = &usb_serial`. Register minimal shell commands such as
`spaghetti status` and later `spaghetti apply <hex>`. Shell handler validates
bounds/hex then DIRECT CALLS Communication handler. Add sources to CMake; Core
initializes Communication.

**PURPOSE** Use the simplest receive transport already configured by the project.

**WHY NOW** No USB CDC/BLE/network transport must be invented.

**CALLED / USED BY** Developer/PC via USB serial.

**TRIGGER** SHELL COMMAND / COMMUNICATION RX.

**MECHANISM** SHELL COMMAND -> DIRECT CALL.

**EXECUTION CONTEXT** Zephyr shell thread; safe for bounded parsing, but do not
perform long blocking work while holding shell internals.

**CALLS / DEPENDS ON** Zephyr Shell, Communication handler, Config/Status.

**EXPECTED INPUT** `spaghetti status` first.

**EXPECTED OUTPUT** Core/modules/runtime status response.

**ERRORS TO HANDLE** Bad arguments, oversized hex, unavailable Config.

**DO NOT IMPLEMENT YET** CBOR until Step 15, binary framing, authentication.

**COMPILE NOW?** YES: `make pristine`.

**FLASH NOW?** YES.

**TEST** From existing serial console run help, valid status, invalid command.

**EXPECTED RESULT** Shell command reaches transport-independent handler.

**IF IT WORKS, NEXT** Step 15.1.

## STOP HERE UNTIL

- [ ] Protocol types do not mention Shell/USB.
- [ ] Shell uses existing `usb_serial` console.
- [ ] GET_STATUS succeeds.
- [ ] Invalid/oversized command fails safely.
- [ ] No CBOR field is read by Manager.

# MILESTONE 15 — Decode a tiny CBOR configuration with installed zcbor

### Step 15.1 — Define decoder boundary and tiny schema

**OPEN / CREATE** `include/spaghetti/config_codec.h`,
`subsys/config/config_cbor.c`; optionally create
`subsys/config/spaghetti_config_v0.cddl` as schema documentation.

**WRITE / MODIFY** Declare:

```c
int spaghetti_config_decode_cbor(const uint8_t *bytes, size_t length,
                                 struct spaghetti_config *out);
```

Start with one exact semantic object: version plus one module assignment
`port_id=0`, `type_id="sht40"`, verified address, period 1000. Choose a small
bounded map or array and document exact keys/order/version in CDDL/comments.

**PURPOSE** Make CBOR only a serialization boundary filling internal C Config.

**WHY NOW** The internal Config path is already proven end-to-end.

**CALLED / USED BY** Communication SET_CONFIG handler.

**TRIGGER** COMMUNICATION RX.

**MECHANISM** DIRECT CALL decoder.

**EXECUTION CONTEXT** Shell/Communication thread.

**CALLS / DEPENDS ON** zcbor decoder and Config validator.

**EXPECTED INPUT** Byte span with no assumed termination.

**EXPECTED OUTPUT** Fully owned `spaghetti_config` or negative decode error.

**ERRORS TO HANDLE** Truncated, wrong type/key/version, oversized string/count,
trailing unexpected bytes, semantic Config rejection.

**DO NOT IMPLEMENT YET** Full runtime graph/MQTT/discovery schema or direct Manager decode.

**COMPILE NOW?** NO.

**FLASH NOW?** NO.

**TEST** Review that output contains no pointer into the input buffer unless its
lifetime is explicitly copied before return.

**EXPECTED RESULT** Clean codec boundary.

**IF IT WORKS, NEXT** Step 15.2.

### Step 15.2 — Enable zcbor and implement strict V0 decode

**OPEN** `prj.conf`, root `CMakeLists.txt`, `config_cbor.c`.

**WRITE / MODIFY** Add `CONFIG_ZCBOR=y`; installed Zephyr 4.4 integration then
adds zcbor include paths and `zcbor_common/decode/encode/print` sources. Add
`config_cbor.c` to CMake. Use low-level `zcbor_decode.h` for the tiny schema or
generate decode code from CDDL with the installed `zcbor code` tool. Prefer
generated CDDL code before schema growth; for V0 a hand-written strict decoder is
acceptable if every bound/type/consumed byte is tested. Decode into a temporary
Config, validate, then copy/commit to `out` only on full success.

**PURPOSE** Reject malformed external bytes before state mutation.

**WHY NOW** zcbor module is confirmed installed at
`/opt/zephyrproject/modules/lib/zcbor` with `CONFIG_ZCBOR` integration.

**CALLED / USED BY** Communication.

**TRIGGER** SET_CONFIG bytes.

**MECHANISM** DIRECT CALL.

**EXECUTION CONTEXT** Communication/shell thread.

**CALLS / DEPENDS ON** zcbor decode functions then `spaghetti_config_validate`.

**EXPECTED INPUT** Exact V0 CBOR bytes.

**EXPECTED OUTPUT** Internal Config.

**ERRORS TO HANDLE** All parse/bounds errors map to a stable Communication error;
do not leave partially filled active state.

**DO NOT IMPLEMENT YET** Canonical encoding requirement unless protocol demands it.

**COMPILE NOW?** YES: `make pristine`; verify `CONFIG_ZCBOR=y` in `.config`.

**FLASH NOW?** NO until host/unit vectors pass.

**TEST** Valid vector plus empty, truncated at every byte, wrong type, excess count,
unknown version, trailing garbage.

**EXPECTED RESULT** Only valid vector produces Config.

**IF IT WORKS, NEXT** Step 15.3.

### Step 15.3 — Apply CBOR from shell through the real path

**OPEN** `communication.c`, `communication_shell.c`.

**WRITE / MODIFY** `SET_CONFIG` handler calls decoder, then
`spaghetti_config_apply`; shell `apply <hex>` only converts bounded hex bytes and
passes them to Communication. Return separate decode/semantic/apply errors.

**PURPOSE** Complete bytes -> decoder -> internal Config -> Manager/Runtime.

**WHY NOW** Each downstream layer already works locally.

**CALLED / USED BY** PC/developer shell.

**TRIGGER** COMMUNICATION RX.

**MECHANISM** SHELL COMMAND -> DIRECT CALL chain.

**EXECUTION CONTEXT** Shell thread initially.

**CALLS / DEPENDS ON** Communication -> codec -> Config -> Manager/Runtime.

**EXPECTED INPUT** Valid encoded Port 0/SHT40 V0 configuration.

**EXPECTED OUTPUT** Applied SHT40 and 1000 ms acquisition.

**ERRORS TO HANDLE** Hex, decode, validation, apply failures independently.

**DO NOT IMPLEMENT YET** Transport-specific logic in decoder or Manager CBOR access.

**COMPILE NOW?** YES: `make build`.

**FLASH NOW?** YES.

**TEST** Send valid V0 and malformed variants; query status afterward.

**EXPECTED RESULT** Valid CBOR configures SHT40; invalid bytes change no live state.

**IF IT WORKS, NEXT** Step 16.1.

## STOP HERE UNTIL

- [ ] `CONFIG_ZCBOR=y` is active.
- [ ] Decoder fills only internal `spaghetti_config`.
- [ ] Truncation/wrong types/trailing bytes are rejected.
- [ ] Valid CBOR configures Port 0/SHT40.
- [ ] Manager and Runtime contain no zcbor calls.

# MILESTONE 16 — Publish one fixed MQTT temperature topic

### Step 16.1 — Prove Wi-Fi/network independently

**OPEN / CREATE** Future network adapter/service file under
`subsys/services/mqtt/`; open `prj.conf` only when credentials/provisioning test
method is chosen.

**WRITE / MODIFY** Enable the minimum installed options for ESP32 networking:
`CONFIG_WIFI=y`, `CONFIG_NETWORKING=y`, `CONFIG_NET_IPV4=y`, `CONFIG_NET_TCP=y`,
`CONFIG_NET_SOCKETS=y`, `CONFIG_NET_MGMT=y`, `CONFIG_NET_MGMT_EVENT=y`, and DHCP/
DNS only if the chosen broker path requires them. Register net management callback;
signal MQTT worker after `NET_EVENT_IPV4_ADDR_ADD`, not merely association.

**PURPOSE** Separate network bring-up failures from MQTT failures.

**WHY NOW** Data works and MQTT is the next external consumer.

**CALLED / USED BY** MQTT service.

**TRIGGER** BOOT/NETWORK EVENT.

**MECHANISM** CALLBACK -> K_SEM or K_MSGQ -> THREAD.

**EXECUTION CONTEXT** Net callback signals; MQTT/network worker performs work.

**CALLS / DEPENDS ON** Zephyr Wi-Fi/net management APIs.

**EXPECTED INPUT** Credentials supplied by controlled development configuration,
not committed secrets.

**EXPECTED OUTPUT** IP-ready event and address log.

**ERRORS TO HANDLE** Auth, association, DHCP, DNS, disconnect/retry.

**DO NOT IMPLEMENT YET** MQTT, TLS, production credential storage.

**COMPILE NOW?** YES after adding source/Kconfig: `make pristine`.

**FLASH NOW?** YES.

**TEST** Connect, obtain IP, disconnect AP, observe bounded retry/status.

**EXPECTED RESULT** Network-ready signal is reliable.

**IF IT WORKS, NEXT** Step 16.2.

### Step 16.2 — Implement fixed-topic MQTT consumer

**OPEN / CREATE** `subsys/services/mqtt/mqtt.h`, `mqtt.c`; update CMake/prj.

**WRITE / MODIFY** Add `CONFIG_MQTT_LIB=y`; define
`spaghetti_mqtt_init/start/publish_temperature/get_status`. MQTT owns one thread,
client buffers, socket poll/input/live/reconnect, and bounded outbound `k_msgq`.
Data's MQTT message subscriber enqueues one known temperature to a fixed
development topic. Topic/broker are TEMPORARY SHORTCUTS.

**PURPOSE** Prove asynchronous Data-to-broker delivery.

**WHY NOW** Network and Data independently work.

**CALLED / USED BY** Core starts; Data subscriber publishes.

**TRIGGER** DATA ARRIVAL/NETWORK EVENT.

**MECHANISM** ZBUS MSG SUBSCRIBER -> K_MSGQ -> MQTT THREAD -> socket.

**EXECUTION CONTEXT** Subscriber copies; dedicated MQTT thread performs I/O.

**CALLS / DEPENDS ON** Zephyr MQTT/socket/poll APIs.

**EXPECTED INPUT** Temperature sample.

**EXPECTED OUTPUT** One fixed topic payload.

**ERRORS TO HANDLE** Queue full, disconnected, DNS/connect/publish error, keepalive.

**DO NOT IMPLEMENT YET** Dynamic topics, TLS, QoS matrix, offline history.

**COMPILE NOW?** YES: `make pristine`.

**FLASH NOW?** YES.

**TEST** Local broker subscriber receives value; stop/restart broker and verify
Runtime sampling continues plus MQTT reconnects.

**EXPECTED RESULT** Known sample reaches known topic without blocking Runtime.

**IF IT WORKS, NEXT** Step 16.3.

### Step 16.3 — Move MQTT endpoint/topic into Config

**OPEN** `config.h/c`, CBOR V1 schema/codec, MQTT service.

**WRITE / MODIFY** Add only broker endpoint, port, enabled flag, and bounded base
topic to internal Config; update decoder/version and validation; MQTT receives a
copied config through its API. Remove fixed endpoint/topic shortcut.

**PURPOSE** Separate configuration from service implementation.

**WHY NOW** Fixed-topic path is proven.

**CALLED / USED BY** Config applies to MQTT service.

**TRIGGER** CONFIG COMMAND.

**MECHANISM** DIRECT CALL or MQTT command K_MSGQ for live reconnect.

**EXECUTION CONTEXT** Config caller submits; MQTT thread reconnects.

**CALLS / DEPENDS ON** Codec/Config/MQTT service.

**EXPECTED INPUT** Valid bounded endpoint/topic.

**EXPECTED OUTPUT** Publish to configured topic.

**ERRORS TO HANDLE** Invalid host/port/topic and live reconfiguration failure.

**DO NOT IMPLEMENT YET** Secrets inside ordinary Config or OTA over MQTT.

**COMPILE NOW?** YES: `make build` (pristine if Kconfig changed).

**FLASH NOW?** YES.

**TEST** Deploy a second topic and confirm next sample appears there.

**EXPECTED RESULT** No fixed broker/topic remains in MQTT code.

**IF IT WORKS, NEXT** Step 17.1.

## STOP HERE UNTIL

- [ ] Network IP readiness is separate from MQTT state.
- [ ] Runtime continues when broker is down.
- [ ] Temperature reaches broker.
- [ ] Queue-full/reconnect behavior is observable.
- [ ] Endpoint/topic now come from validated Config.

# MILESTONE 17 — Add Discovery without changing Manager

### Step 17.1 — Define normalized Discovery result/provider contract

**OPEN** `include/spaghetti/discovery.h`.

**WRITE / MODIFY** Define mode `MANUAL/AUTO/HYBRID`, source enum independent of
mode, `spaghetti_discovery_result` with port/type/config/source/generation, and
`spaghetti_discovery_provider` operation table. Declare init,
`spaghetti_discovery_submit_manual`, and result callback/sink registration.

**PURPOSE** Normalize “what is connected” separately from lifecycle.

**WHY NOW** Manual Config/Manager path already works and becomes the reference.

**CALLED / USED BY** Communication/Config/manual provider; future providers.

**TRIGGER** CONFIG COMMAND/PROVIDER RESULT.

**MECHANISM** DIRECT CALL initially.

**EXECUTION CONTEXT** Communication/Config caller thread.

**CALLS / DEPENDS ON** Port/type/config value types only.

**EXPECTED INPUT** Port 0/SHT40/manual/generation.

**EXPECTED OUTPUT** Normalized result.

**ERRORS TO HANDLE** Invalid/stale/conflicting result.

**DO NOT IMPLEMENT YET** EEPROM, probe, LLM transport, or meaning AUTO=EEPROM.

**COMPILE NOW?** NO.

**FLASH NOW?** NO.

**TEST** Ownership and generation review.

**EXPECTED RESULT** Provider-neutral result.

**IF IT WORKS, NEXT** Step 17.2.

### Step 17.2 — Route manual config through Discovery

**OPEN** `subsys/discovery/discovery.c`, CMake, Core, Config/Communication apply.

**WRITE / MODIFY** Implement MANUAL-only submit validation. Its accepted-result
sink DIRECT CALLS the existing `spaghetti_module_manager_configure` unchanged.
Add source/CMake/Core init. Replace Config's direct Manager assignment with
Discovery manual submission. Keep Runtime/services config direct to their owners.

**PURPOSE** Prove separation without disrupting working lifecycle.

**WHY NOW** Existing behavior is a regression oracle.

**CALLED / USED BY** Config/Communication -> Discovery -> Manager.

**TRIGGER** CONFIG COMMAND.

**MECHANISM** DIRECT CALL chain.

**EXECUTION CONTEXT** Config/Communication thread.

**CALLS / DEPENDS ON** Port validation and unchanged Manager API.

**EXPECTED INPUT** Manual result.

**EXPECTED OUTPUT** Same SHT40 instance/readings.

**ERRORS TO HANDLE** Stale generation, unsupported mode, Manager error propagation.

**DO NOT IMPLEMENT YET** Async provider worker. Add K_WORK only when provider needs it.

**COMPILE NOW?** YES: `make build`.

**FLASH NOW?** YES.

**TEST** Apply same CBOR/manual assignment and compare status/measurement to before.

**EXPECTED RESULT** Behavior unchanged; Manager has no source/provider knowledge.

**IF IT WORKS, NEXT** Step 18.1.

## STOP HERE UNTIL

- [ ] Manual assignment produces normalized Discovery result.
- [ ] Manager API/implementation is provider-independent and unchanged.
- [ ] Generation/stale result is tested.
- [ ] No EEPROM/probe code exists.
- [ ] Existing CBOR/manual flow still works.

# MILESTONE 18 — Replace Port hardcode and verify multiple Core variants

### Step 18.1 — Define real Spaghetti Port binding

**OPEN / CREATE** `dts/bindings/spaghetti/spaghettilab,port.yaml`; use
`dts/bindings/spaghetti/README.md` and real hardware requirements.

**WRITE / MODIFY** Start with actual static fields required by Port 0. Conceptual
shape only until verified:

```yaml
description: Spaghetti LAB external module port
compatible: "spaghettilab,port"
properties:
  reg:
    type: int
    required: true
  # Add bus/power/capability references only from real Core schematics.
```

Do not use a property saying `module = "sht40"`.

**PURPOSE** Generate Port descriptors from each board rather than C hardcode.

**WHY NOW** One Core/Port works and its actual minimum requirements are known.

**CALLED / USED BY** Devicetree build and `port.c` macros.

**TRIGGER** BUILD.

**MECHANISM** BUILD TIME.

**EXECUTION CONTEXT** Host DT tools/compiler.

**CALLS / DEPENDS ON** Zephyr binding schema and real board DTS.

**EXPECTED INPUT** Valid static Port nodes.

**EXPECTED OUTPUT** Generated DT macros.

**ERRORS TO HANDLE** Missing property/wrong reference must fail build.

**DO NOT IMPLEMENT YET** Runtime module identity or imaginary capabilities.

**COMPILE NOW?** YES after one board node: `make pristine`.

**FLASH NOW?** NO until final DTS inspection.

**TEST** Valid node builds; intentionally missing required field fails, then restore.

**EXPECTED RESULT** Useful build-time validation.

**IF IT WORKS, NEXT** Step 18.2.

### Step 18.2 — Create first real Spaghetti board and remove Port C hardcode

**OPEN / CREATE** `boards/spaghettilab/<real_core_name>/` files following current
Zephyr hardware model: `board.yml`, board DTS, `Kconfig.<board>`, defconfig, and
runner files only if needed. Open `port.c`.

**WRITE / MODIFY** Move verified MCU/wiring/port count/controller/power static facts
into board DTS. Refactor Port initialization to instantiate/enumerate enabled
`spaghettilab,port` nodes via DT instance macros. Delete TEMPORARY
`DT_NODELABEL(i2c0)` single-descriptor hardcode. Add only required board/Kconfig/
CMake root discovery integration per installed Zephyr board model.

**PURPOSE** Make hardware variant data declarative.

**WHY NOW** The abstraction is already proven, so refactor has observable parity.

**CALLED / USED BY** West/CMake/Port.

**TRIGGER** BUILD/BOOT.

**MECHANISM** BUILD TIME descriptors then BOOT DIRECT CALL.

**EXECUTION CONTEXT** Build tools/main thread.

**CALLS / DEPENDS ON** Generated macros and Device Model.

**EXPECTED INPUT** Real first-Core board description.

**EXPECTED OUTPUT** Same Port 0/SHT40 behavior on custom board target.

**ERRORS TO HANDLE** Board discovery, DTS validation, device readiness.

**DO NOT IMPLEMENT YET** Copy all devkit definitions blindly or add second board guesses.

**COMPILE NOW?** YES with `BOARD=<real board/qualifier> make pristine` or `.env`
override using the project's existing Compose/Make mechanism.

**FLASH NOW?** YES after final DTS/flash runner inspection.

**TEST** Compare Port capability/status and real measurement with old devkit target.

**EXPECTED RESULT** No C3 pin/controller label in higher layers or Port catalog data.

**IF IT WORKS, NEXT** Step 18.3.

### Step 18.3 — Add or simulate a second Core variant

**OPEN / CREATE** Second real board directory only when its hardware exists; if it
does not, create a build-only test fixture outside production board claims.

**WRITE / MODIFY** Describe its real/deliberately simulated different port count
and capabilities. Build the unchanged Core/Manager/Runtime/Data/module code. Query
capabilities instead of adding `if (core == C3/S3)`.

**PURPOSE** Verify architectural portability rather than merely promise it.

**WHY NOW** Generated Port enumeration is complete.

**CALLED / USED BY** Build matrix/tests.

**TRIGGER** BUILD.

**MECHANISM** BUILD TIME.

**EXECUTION CONTEXT** Host CI/developer.

**CALLS / DEPENDS ON** Second board DTS/Kconfig.

**EXPECTED INPUT** Different number/capabilities.

**EXPECTED OUTPUT** Common higher layers compile and enumerate correctly.

**ERRORS TO HANDLE** Unsupported module on capability-poor port -> `-ENOTSUP`.

**DO NOT IMPLEMENT YET** Runtime board-name branching.

**COMPILE NOW?** YES for both targets with existing build command/BOARD override.

**FLASH NOW?** Only if second physical Core exists.

**TEST** Build both; configure SHT40 only on I2C-capable port; invalid mapping fails.

**EXPECTED RESULT** Higher layers contain no ESP32-C3/S3 GPIO or board checks.

**IF IT WORKS, NEXT** Step 19.1.

## STOP HERE UNTIL

- [ ] Real custom board builds/boots.
- [ ] Port catalog comes from Devicetree instances.
- [ ] Hardcoded C3 Port controller label is removed.
- [ ] Two variant builds exercise different port capabilities/counts.
- [ ] Manager/Runtime/Data/module APIs are unchanged between targets.

# MILESTONE 19 — Add only real power behavior

### Step 19.1 — Define one measured resource contract

**OPEN** `include/spaghetti/power.h`, real board schematic, Port binding/DTS.

**WRITE / MODIFY** Only if real controllable power hardware exists, define resource
ID/state and declare `spaghetti_power_init`, `spaghetti_power_acquire`,
`spaghetti_power_release`, `spaghetti_power_get_status`. Add real power reference
to DT binding/board node; no placeholder remains in production.

**PURPOSE** Prevent disabling a shared rail while modules use it.

**WHY NOW** Module lifecycle and multi-board static facts are stable.

**CALLED / USED BY** Manager/driver lifecycle; Communication status.

**TRIGGER** MODULE CONFIGURATION/REMOVAL.

**MECHANISM** DIRECT CALL.

**EXECUTION CONTEXT** Manager/calling thread.

**CALLS / DEPENDS ON** Port power control/Zephyr GPIO or PM based on real hardware.

**EXPECTED INPUT** Resource and owner ID.

**EXPECTED OUTPUT** Lease/status and reference-counted state.

**ERRORS TO HANDLE** Unsupported resource, transition failure, underflow/double release.

**DO NOT IMPLEMENT YET** Battery policy, deep sleep, speculative wake sources, OTA.

**COMPILE NOW?** NO until fake logic exists.

**FLASH NOW?** NO.

**TEST** Ownership/reference-count design review.

**EXPECTED RESULT** Minimal real resource contract.

**IF IT WORKS, NEXT** Step 19.2.

### Step 19.2 — Implement reference counting, then real control

**OPEN** `subsys/power/power.c`, CMake, Core, Manager lifecycle.

**WRITE / MODIFY** Implement private count/state under short `k_mutex`; first
acquire powers on, final release powers off, intermediate operations do not toggle.
Integrate fake backend tests, then real Port/Zephyr control. Manager acquires before
driver init and releases after deinit/rollback. Add source/CMake/Core init.

**PURPOSE** Coordinate lifetime safely and predictably.

**WHY NOW** Exact acquire/release points are established by Manager.

**CALLED / USED BY** Manager/driver.

**TRIGGER** MODULE LIFECYCLE.

**MECHANISM** DIRECT CALL + K_MUTEX.

**EXECUTION CONTEXT** Thread only, never ISR.

**CALLS / DEPENDS ON** Port/Zephyr GPIO or runtime PM.

**EXPECTED INPUT** Valid owner/resource.

**EXPECTED OUTPUT** Correct transition/count/status.

**ERRORS TO HANDLE** Hardware on/off error, overflow/underflow, rollback after init failure.

**DO NOT IMPLEMENT YET** System sleep until runtime/device PM requirements are measured.

**COMPILE NOW?** YES: `make pristine` if DTS/Kconfig changed, otherwise `make build`.

**FLASH NOW?** YES only after safe electrical review.

**TEST** Two owners acquire/release in both orders; inject failed driver init and
confirm count/rail rollback.

**EXPECTED RESULT** One on transition, one final off transition, no premature off.

**IF IT WORKS, NEXT** Stop and define the next product requirement; OTA and more
discovery providers require separate roadmaps.

## STOP HERE UNTIL

- [ ] Power hardware is real and documented.
- [ ] Reference-count tests pass with two owners.
- [ ] Manager rollback releases acquired power.
- [ ] Real transitions are electrically verified.
- [ ] No speculative sleep/battery/OTA functionality was added.

# Final architecture checkpoint

At this point the tested path is:

```text
Shell/PC CBOR
  --COMMUNICATION RX--> Communication
  --DIRECT CALL--> zcbor decoder -> internal spaghetti_config
  --DIRECT CALL--> Discovery(manual) -> Module Manager
  --DIRECT CALL--> Driver Registry -> SHT40/Relay driver
  --DIRECT CALL--> Port -> Zephyr I2C/GPIO

K_TIMER --K_SEM--> Runtime THREAD --DIRECT CALL--> Manager read
sample --ZBUS PUBLISH--> Runtime + logger + MQTT + PC adapter
Runtime rule --DIRECT CALL--> Manager command -> Relay
```

Before expanding the product, measure ESP32-C3 RAM/stack/queue use, document every
overflow policy, and add automated tests for each milestone's error path. Add OTA,
additional discovery providers, generalized runtime syntax, and advanced power
management only as separate requirement-driven milestones.
