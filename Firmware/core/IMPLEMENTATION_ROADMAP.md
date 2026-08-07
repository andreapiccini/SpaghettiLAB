# Spaghetti LAB firmware implementation roadmap

> [!TIP]
> Treat this document as an executable guide: complete one step at a time and
> do not move past a milestone until every item in its completion gate is checked.

The commands match the current Docker workflow: `make build`, `make pristine`,
and host-side flashing where required. The current target is
`esp32c3_devkitm/esp32c3`; its overlay selects `usb_serial` as the console. At
the starting point, only `src/main.c` is compiled and the architectural `.c/.h`
files are empty.

**Current progress:** Milestone 0 is complete. Milestone 1 is the next target.

## How to use this guide

1. Open only the files named by the current step.
2. Make the smallest change described under **Change**.
3. Build, flash, and test only when the step explicitly asks for it.
4. Check the milestone gate before continuing.
5. Update the status table and checkboxes as work is completed.

Status symbols used below:

| Symbol | Meaning |
|:---:|---|
| ✅ | Complete |
| ⏭️ | Next milestone |
| ⬜ | Planned |

## Roadmap index

| Status | Milestone | Visible result |
|:---:|---|---|
| ✅ | [0 — Baseline](#milestone-0) | Existing Zephyr uptime firmware builds, flashes, and prints |
| ⏭️ | [1 — Core](#milestone-1) | `main` boots through `spaghetti_core_init()` |
| ⬜ | [2 — Current-board I2C](#milestone-2) | Real I2C controller is ready on verified pins |
| ⬜ | [3 — First Port](#milestone-3) | Port 0 exposes that controller through the Port API |
| ⬜ | [4 — SHT40 vertical slice](#milestone-4) | Real temperature and humidity appear in the log |
| ⬜ | [5 — Module/driver model](#milestone-5) | SHT40 is callable through a module-driver operation table |
| ⬜ | [6 — Driver Registry](#milestone-6) | `sht40` lookup succeeds; unknown lookup fails cleanly |
| ⬜ | [7 — Module Manager](#milestone-7) | A direct call configures `Port 0 = SHT40` |
| ⬜ | [8 — Remove static SHT40 shortcut](#milestone-8) | Runtime-removable SHT40 uses Port + direct I2C |
| ⬜ | [9 — Internal Config](#milestone-9) | A C config applies Port 0 and sample period |
| ⬜ | [10 — Persistent Config](#milestone-10) | The internal config survives reboot |
| ⬜ | [11 — Data/zbus](#milestone-11) | One sample reaches logger and a second consumer |
| ⬜ | [12 — Runtime V0](#milestone-12) | Runtime samples temperature every 1000 ms |
| ⬜ | [13 — Relay + Runtime V1](#milestone-13) | `temperature > 25` commands a relay |
| ⬜ | [14 — Communication](#milestone-14) | USB-console shell adapter applies a local config command |
| ⬜ | [15 — CBOR](#milestone-15) | Tiny CBOR config decodes into `spaghetti_config` and applies |
| ⬜ | [16 — MQTT](#milestone-16) | One known temperature topic reaches a broker |
| ⬜ | [17 — Discovery](#milestone-17) | Manual discovery result feeds the unchanged Manager |
| ⬜ | [18 — Multiple Core variants](#milestone-18) | Common higher layers build without C3 pin/board checks |
| ⬜ | [19 — Power](#milestone-19) | One real, measured power resource has correct acquire/release behavior |

## Working rules

- **Temporary shortcut:** means deliberately disposable code. Remove it at the
  explicitly named removal milestone.
- Return `0` for success and negative errno-compatible values for failures.
- Prefer fixed-capacity storage before heap allocation.
- Control/lifecycle uses DIRECT CALL until real concurrency justifies a queue.
- Do not call blocking APIs from ISR, timer expiry, or low-level transport callback.
- Use `make build` normally; use `make pristine` after board/Devicetree/Kconfig
  changes or whenever generated configuration appears stale.

<a id="milestone-0"></a>

## Milestone 0 — Prove the existing baseline ✅

### Step 0.1 — Build the untouched application

**Open:** `Makefile`, `compose.yaml`, `src/main.c` for reading only.

**Change:** Nothing.

**Purpose:** Prove Docker, Zephyr 4.4, board selection, and generated build are healthy.

**Why now:** Every later failure must be distinguishable from environment failure.

<details>
<summary><strong>Technical context</strong></summary>

**Used by:** Developer workflow.

**Trigger:** BASELINE CHECK.

**Mechanism:** BUILD TIME.

**Execution context:** Host invoking Docker Compose.

**Dependencies:** Existing `make build` target and Docker image.

**Input:** Existing application and board `esp32c3_devkitm/esp32c3`.

**Output:** `build/zephyr/zephyr.bin` with a successful build.

**Errors:** Missing Docker image/daemon or stale generated build; use
`make image` only if the image is absent, then `make pristine` if needed.

</details>

**Not yet:** Any architecture file.

**Build now?** YES: run `make build`.

**Flash now?** NO; first confirm compilation.

**Test:** Confirm command exits zero and `build/zephyr/zephyr.bin` exists.

**Expected result:** Incremental build succeeds.

**Next:** Step 0.2.

### Step 0.2 — Flash and observe the baseline

**Open:** Root `README.md`, section “Flash and monitor” for the host OS.

**Change:** Nothing.

**Purpose:** Freeze a known-good hardware/deploy baseline.

**Why now:** Port/I2C work should start only after console and board reset work.

<details>
<summary><strong>Technical context</strong></summary>

**Used by:** Developer.

**Trigger:** FIRMWARE DEPLOY.

**Mechanism:** HOST FLASH TOOL, then serial monitor.

**Execution context:** Host OS.

**Dependencies:** macOS: existing `esptool ... 0x0 build/zephyr/zephyr.bin`;
Linux: `make flash`, then `make monitor`.

**Input:** Current serial port and built image.

**Output:** Boot greeting and uptime every five seconds at 115200 baud.

**Errors:** Busy/wrong port and bootloader entry failure.

</details>

**Not yet:** I2C or new logging.

**Build now?** NO; use Step 0.1 image.

**Flash now?** YES, using the existing README workflow; do not create a new one.

**Test:** Reset board with serial monitor open.

**Expected result:** `Hello from Zephyr on ESP32-C3!` and increasing uptime.

**Next:** Step 1.1.

### Completion gate

- [x] `make build` succeeds.
- [x] Firmware flashes through the existing workflow.
- [x] Console output is readable at 115200 baud.
- [x] Uptime increases without reset loops.

[↑ Back to roadmap index](#roadmap-index)

---

<a id="milestone-1"></a>

## Milestone 1 — Introduce the Core boot boundary

### Step 1.1 — Define the minimal Core public API

**Open:** `include/spaghetti/core.h`.

**Change:** Add an include guard; declare
`enum spaghetti_core_state { SPAGHETTI_CORE_UNINITIALIZED,
SPAGHETTI_CORE_READY, SPAGHETTI_CORE_ERROR };`,
`int spaghetti_core_init(void);`, and
`enum spaghetti_core_state spaghetti_core_get_state(void);`.

**Purpose:** Create one application boot boundary and observable state.

**Why now:** All later subsystem initialization needs one coordinator.

<details>
<summary><strong>Technical context</strong></summary>

**Used by:** `src/main.c`; future Communication reads state.

**Trigger:** BOOT.

**Mechanism:** DIRECT CALL.

**Execution context:** Main Zephyr thread.

**Dependencies:** No lower subsystem yet.

**Input:** None.

**Output:** Declaration contract only.

**Errors:** None in header; document negative errno convention.

</details>

**Not yet:** Capability flags, Wi-Fi/BLE, subsystem arrays, threads.

**Build now?** NO; declaration is not linked yet.

**Flash now?** NO.

**Test:** Review ownership: only Core may modify its state.

**Expected result:** Small header with no board-specific field.

**Next:** Step 1.2.

### Step 1.2 — Implement Core initialization

**Open:** `subsys/core/core.c`.

**Change:** Implement `spaghetti_core_init()` and
`spaghetti_core_get_state()`. Register a Zephyr log module. `init` sets READY and
logs `Spaghetti Core ready`; getter returns the private state.

**Purpose:** Establish the simplest complete Core implementation.

**Why now:** It must link and run before dependencies are added.

<details>
<summary><strong>Technical context</strong></summary>

**Used by:** `main` and future diagnostics.

**Trigger:** BOOT.

**Mechanism:** DIRECT CALL.

**Execution context:** Main thread/calling thread.

**Dependencies:** Zephyr logging only.

**Input:** None.

**Output:** `0` and READY.

**Errors:** None yet; keep an ERROR path ready for future dependencies.

</details>

**Not yet:** Port or service initialization.

**Build now?** NO; first add build integration.

**Flash now?** NO.

**Test:** Static inspection: state is private and getter does not mutate it.

**Expected result:** Minimal implementation without loops or threads.

**Next:** Step 1.3.

### Step 1.3 — Add Core to the application build

**Open:** Root `CMakeLists.txt` and `prj.conf`.

**Change:** Add `target_include_directories(app PRIVATE include)` and add
`subsys/core/core.c` to `target_sources(app PRIVATE ...)`. Add `CONFIG_LOG=y` to
`prj.conf`; keep existing console options.

**Purpose:** Compile/link the public header and implementation.

**Why now:** Unlisted `.c` files are ignored by CMake.

<details>
<summary><strong>Technical context</strong></summary>

**Used by:** Zephyr build system.

**Trigger:** BUILD.

**Mechanism:** BUILD TIME.

**Execution context:** CMake/Ninja in Docker.

**Dependencies:** Zephyr application target and logging Kconfig.

**Input:** Existing target plus two new entries.

**Output:** Core object linked into `zephyr.elf`.

**Errors:** Wrong relative path or include directory.

</details>

**Not yet:** Per-directory CMake/Kconfig.

**Build now?** YES: `make pristine` because `prj.conf` changed.

**Flash now?** NO; link first.

**Test:** Build has no undefined symbol/include error.

**Expected result:** Successful build with Core compiled but not called.

**Next:** Step 1.4.

### Step 1.4 — Route main through Core

**Open:** `src/main.c`.

**Change:** Include `<spaghetti/core.h>`, call
`spaghetti_core_init()` once before the existing uptime loop, log/print its
negative return and stop/return on failure. Keep the uptime loop for proof.

**Purpose:** Make Core the real boot entry point.

**Why now:** The boundary is useful only when exercised.

<details>
<summary><strong>Technical context</strong></summary>

**Used by:** Zephyr invokes `main`; `main` calls Core.

**Trigger:** BOOT.

**Mechanism:** DIRECT CALL.

**Execution context:** Main thread.

**Dependencies:** `spaghetti_core_init()`.

**Input:** None.

**Output:** Core log then uptime.

**Errors:** Negative init result.

</details>

**Not yet:** Move the loop into Core or start other threads.

**Build now?** YES: `make build`.

**Flash now?** YES after successful build, using existing workflow.

**Test:** Reset and read console.

**Expected result:** `Spaghetti Core ready`, then unchanged uptime behavior.

**Next:** Step 2.1.

### Completion gate

- [ ] Core header is minimal and board-independent.
- [ ] Core source is compiled by CMake.
- [ ] `spaghetti_core_init()` returns zero.
- [ ] Board boots and still prints uptime.

[↑ Back to roadmap index](#roadmap-index)

---

<a id="milestone-2"></a>

## Milestone 2 — Enable one verified physical I2C bus

### Step 2.1 — Resolve real hardware facts

**Open:** Core/module schematics, current board pinout, and
`build/zephyr/zephyr.dts` for inspection.

**Change:** Record outside production code which controller and SDA/SCL
pins physically reach the intended Spaghetti Port. Replace later placeholders
only with schematic-confirmed values.

**Purpose:** Prevent invented GPIO mappings.

**Why now:** I2C cannot be safely enabled without real wiring.

<details>
<summary><strong>Technical context</strong></summary>

**Used by:** Board overlay work.

**Trigger:** HARDWARE BRING-UP.

**Mechanism:** DESIGN/BUILD-TIME INPUT.

**Execution context:** Developer review.

**Dependencies:** Schematic and ESP32-C3 board DTS.

**Input:** Real controller and pins; whether pull-ups/power exist.

**Output:** Verified mapping, not guessed values.

**Errors:** Ambiguous revision/wiring: stop and resolve physically.

</details>

**Not yet:** Custom board or Spaghetti binding.

**Build now?** NO.

**Flash now?** NO.

**Test:** Continuity/schematic cross-check where appropriate.

**Expected result:** Unambiguous bus mapping.

**Next:** Step 2.2.

### Step 2.2 — Enable I2C in the current overlay

**Open:** `boards/esp32c3_devkitm_esp32c3.overlay`.

**Change:** Add/override the real I2C controller and its real pinctrl.
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

**Purpose:** Describe the static Core bus at build time.

**Why now:** Port needs a ready Zephyr controller device.

<details>
<summary><strong>Technical context</strong></summary>

**Used by:** Devicetree tools and Zephyr I2C driver.

**Trigger:** BUILD.

**Mechanism:** BUILD TIME.

**Execution context:** Devicetree compiler/C compiler.

**Dependencies:** Existing SoC I2C/pinctrl bindings.

**Input:** Verified controller and pin mapping.

**Output:** Enabled I2C node in final DTS.

**Errors:** Unknown label, invalid pinctrl, pin conflict.

</details>

**Not yet:** SHT40 child node or removable-module identity.

**Build now?** NO; enable Kconfig first.

**Flash now?** NO.

**Test:** Check template contains no unresolved placeholder before building.

**Expected result:** Overlay describes only static bus wiring.

**Next:** Step 2.3.

### Step 2.3 — Enable Zephyr I2C software

**Open:** `prj.conf`.

**Change:** Add `CONFIG_I2C=y`. This permanently compiles the generic
I2C controller API required by I2C-capable ports.

**Purpose:** Include the driver/API selected by the enabled controller.

**Why now:** DTS describes hardware; Kconfig includes software support.

<details>
<summary><strong>Technical context</strong></summary>

**Used by:** Port and later SHT40.

**Trigger:** BUILD.

**Mechanism:** BUILD TIME.

**Execution context:** Kconfig/CMake.

**Dependencies:** Installed ESP32 I2C driver.

**Input:** `CONFIG_I2C=y`.

**Output:** I2C API linked.

**Errors:** Unsatisfied controller dependency shown by Kconfig warning.

</details>

**Not yet:** `CONFIG_SENSOR`, zbus, MQTT.

**Build now?** YES: `make pristine`.

**Flash now?** NO until generated DTS is inspected.

**Test:** Find enabled controller and real pins in `build/zephyr/zephyr.dts`; find
`CONFIG_I2C=y` in `build/zephyr/.config`.

**Expected result:** Build succeeds; controller node is `okay`.

**Next:** Step 3.1.

### Completion gate

- [ ] Controller/pins are confirmed from real hardware.
- [ ] No symbolic placeholder remains in production overlay.
- [ ] `make pristine` succeeds.
- [ ] Final DTS shows the intended I2C controller enabled.
- [ ] `.config` contains `CONFIG_I2C=y`.

[↑ Back to roadmap index](#roadmap-index)

---

<a id="milestone-3"></a>

## Milestone 3 — Implement the first Port

### Step 3.1 — Define minimal Port types and API

**Open:** `include/spaghetti/port.h`.

**Change:** Add guard/includes and only:

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

**Purpose:** Represent Port 0 and expose its bus without MCU checks above Port.

**Why now:** SHT40 code needs one verified abstraction immediately.

<details>
<summary><strong>Technical context</strong></summary>

**Used by:** Core, SHT40 test driver; later Manager.

**Trigger:** BOOT/LOOKUP/MODULE OPERATION.

**Mechanism:** DIRECT CALL.

**Execution context:** Main/calling thread.

**Dependencies:** Zephyr `struct device` declaration and basic types.

**Input:** Port ID/capability.

**Output:** Opaque const Port or `NULL`; boolean/device pointer.

**Errors:** Invalid ID/null port/not initialized.

</details>

**Not yet:** SPI/GPIO/power, module occupancy, dynamic allocation.

**Build now?** NO.

**Flash now?** NO.

**Test:** Confirm no ESP32 or pin identifier is public.

**Expected result:** Small API sufficient for one I2C vertical slice.

**Next:** Step 3.2.

### Step 3.2 — Implement one temporary Port descriptor

**Open:** `subsys/port/port.c`.

**Change:** Define private `struct spaghetti_port` fields `id`,
`capabilities`, and `const struct device *i2c`. Implement all Step 3.1 functions.
In `init_all`, obtain the verified controller using the correct
`DEVICE_DT_GET(DT_NODELABEL(...))` and reject it with `-ENODEV` if
`device_is_ready()` is false.

**Temporary shortcut:** The single descriptor and DT node label are hardcoded in
`port.c`. Step 18 replaces this with generated Port nodes/capabilities.

**Purpose:** Validate Port API and real controller before custom bindings.

**Why now:** Hardware feedback is more valuable than designing all Port variants.

<details>
<summary><strong>Technical context</strong></summary>

**Used by:** Core and SHT40 wrapper.

**Trigger:** BOOT.

**Mechanism:** DIRECT CALL.

**Execution context:** Main thread.

**Dependencies:** Devicetree macros, `DEVICE_DT_GET`, `device_is_ready`.

**Input:** Static compiled DTS.

**Output:** One ready Port or `-ENODEV`.

**Errors:** Controller absent/not ready and invalid lookup.

</details>

**Not yet:** Mutex unless two actual users share multi-step access.

**Build now?** NO; integrate next.

**Flash now?** NO.

**Test:** Unit-level inspection of ID bounds/null behavior.

**Expected result:** One private descriptor and no module knowledge.

**Next:** Step 3.3.

### Step 3.3 — Compile and boot Port

**Open:** Root `CMakeLists.txt`, `subsys/core/core.c`.

**Change:** Add `subsys/port/port.c` to `target_sources`. In Core init,
DIRECT CALL `spaghetti_port_init_all()`; propagate failure; log count and whether
Port 0 has I2C.

**Purpose:** Exercise the Port on every boot.

**Why now:** SHT40 should not be added until Port reports the real controller ready.

<details>
<summary><strong>Technical context</strong></summary>

**Used by:** Build and Core.

**Trigger:** BOOT.

**Mechanism:** BUILD TIME then DIRECT CALL.

**Execution context:** Main thread.

**Dependencies:** Port init/count/capability.

**Input:** Enabled controller from Milestone 2.

**Output:** `Port 0: I2C ready`-equivalent log.

**Errors:** Propagate negative Port error; no silent READY.

</details>

**Not yet:** SHT40 or registry.

**Build now?** YES: `make build`; use `make pristine` if DTS cache is suspect.

**Flash now?** YES using existing workflow.

**Test:** Boot normally, then temporarily disable the controller in a test branch
and confirm Port init fails; restore it immediately.

**Expected result:** One port found; invalid ID returns `NULL`; I2C device ready.

**Next:** Step 4.1.

### Completion gate

- [ ] Port code is linked.
- [ ] Port 0 is found.
- [ ] Port 0 reports I2C capability.
- [ ] Underlying Zephyr device is ready.
- [ ] Invalid Port ID fails safely.

[↑ Back to roadmap index](#roadmap-index)

---

<a id="milestone-4"></a>

## Milestone 4 — Read the real SHT40 quickly

### Step 4.1 — Choose the temporary Zephyr SHT4x path

**Open:** Installed Zephyr files inside `make shell`:
`drivers/sensor/sensirion/sht4x/`,
`dts/bindings/sensor/sensirion,sht4x.yaml`, and `samples/sensor/sht4x/`.

**Change:** No production file in this step. Record the choice:

- OPTION A: installed Zephyr Sensor/SHT4x driver; fastest real reading but static
  Devicetree instance.
- OPTION B: direct I2C Spaghetti driver; compatible with runtime-removable modules
  but requires protocol implementation/testing.
- RECOMMENDATION: OPTION A for this milestone, OPTION B in Milestone 8.

**Purpose:** Get hardware evidence before completing generic architecture.

**Why now:** The installed environment already has `CONFIG_SHT4X`,
`sensirion,sht4x`, and Sensor API support.

<details>
<summary><strong>Technical context</strong></summary>

**Used by:** SHT40 vertical slice.

**Trigger:** DESIGN DECISION.

**Mechanism:** BUILD-TIME STATIC DEVICE for OPTION A.

**Execution context:** Developer review.

**Dependencies:** Zephyr Device/Sensor/I2C model.

**Input:** Confirmed module wiring and address.

**Output:** Deliberate temporary/static plan.

**Errors:** If the actual module is not SHT4x-compatible, stop.

</details>

**Not yet:** Direct-I2C protocol or generic module operations.

**Build now?** NO.

**Flash now?** NO.

**Test:** Confirm installed binding requires `repeatability` and I2C address.

**Expected result:** No ambiguity about why the static node is temporary.

**Next:** Step 4.2.

### Step 4.2 — Add a temporary static SHT4x node

**Open:** `boards/esp32c3_devkitm_esp32c3.overlay`.

**Change:** Under the already enabled real I2C controller add:

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

**Purpose:** Let Zephyr instantiate its installed SHT4x driver.

**Why now:** Device Model needs a DT instance for the standard sensor driver.

<details>
<summary><strong>Technical context</strong></summary>

**Used by:** Zephyr SHT4x driver and temporary wrapper.

**Trigger:** BUILD.

**Mechanism:** BUILD TIME.

**Execution context:** Devicetree/CMake.

**Dependencies:** Real I2C controller and installed binding.

**Input:** Verified address and bus.

**Output:** `DT_NODELABEL(sht40_test)` device instance.

**Errors:** Address conflict, missing required repeatability, wrong bus.

</details>

**Not yet:** A Spaghetti Port binding or runtime discovery.

**Build now?** NO; enable Sensor first.

**Flash now?** NO.

**Test:** No placeholder remains; comment clearly says temporary.

**Expected result:** Valid static sensor node.

**Next:** Step 4.3.

### Step 4.3 — Enable Sensor API and create wrapper files

**Open:** `prj.conf`; CREATE `spaghetti_modules/sht40/sht40.h` and
`spaghetti_modules/sht40/sht40.c`.

**Change:** Add `CONFIG_SENSOR=y`; `CONFIG_SHT4X` should become `y`
automatically because the enabled compatible selects it. In `sht40.h`, declare
`int spaghetti_sht40_test_init(void);` and
`int spaghetti_sht40_test_read(struct sensor_value *temperature,
struct sensor_value *humidity);`. In `.c`, obtain
`DEVICE_DT_GET(DT_NODELABEL(sht40_test))`, check `device_is_ready`, then use
`sensor_sample_fetch` and `sensor_channel_get` for ambient temperature/humidity.

**Temporary shortcut:** These names/API expose Zephyr sensor types and a static
device. Milestones 5 and 8 replace them.

**Purpose:** Isolate the hardware test from `main` while remaining fast.

**Why now:** A working sensor result is the next vertical-slice proof.

<details>
<summary><strong>Technical context</strong></summary>

**Used by:** Temporary `main` test.

**Trigger:** BOOT and periodic test call.

**Mechanism:** DIRECT CALL.

**Execution context:** Main thread.

**Dependencies:** Zephyr Device and Sensor APIs.

**Input:** Two output pointers.

**Output:** `0` and two sensor values.

**Errors:** `-EINVAL`, device not ready, fetch/get error.

</details>

**Not yet:** zbus, driver registry, own thread, heater.

**Build now?** NO; integrate next.

**Flash now?** NO.

**Test:** Review every lower call's return value.

**Expected result:** Thin wrapper, no loop.

**Next:** Step 4.4.

### Step 4.4 — Link, call, build, and flash SHT40

**Open:** Root `CMakeLists.txt` and `src/main.c`.

**Change:** Add `spaghetti_modules/sht40/sht40.c` to target sources. In
`main`, after Core init, call temporary SHT40 init once and read every second;
print `sensor_value.val1` and six-digit absolute `val2` without requiring float
printf. Keep error logs and delay.

**Purpose:** Produce the first physical measurement.

**Why now:** Do not proceed to abstractions without real bus/sensor proof.

<details>
<summary><strong>Technical context</strong></summary>

**Used by:** Main test harness.

**Trigger:** BOOT/PERIODIC TEST LOOP.

**Mechanism:** DIRECT CALL and `k_sleep`, not `K_TIMER` yet.

**Execution context:** Main thread.

**Dependencies:** Temporary wrapper -> Sensor API -> I2C.

**Input:** Connected powered SHT40.

**Output:** Temperature and humidity once per second.

**Errors:** Init/read failure; log and retry only with a clear policy.

</details>

**Not yet:** Runtime scheduling, zbus, MQTT.

**Build now?** YES: `make pristine`; verify `.config` contains
`CONFIG_SENSOR=y`, `CONFIG_SHT4X=y`, `CONFIG_I2C=y`.

**Flash now?** YES via existing workflow.

**Test:** Observe plausible temperature/humidity; disconnect sensor and verify a
bounded error rather than crash/hang; reconnect/reset.

**Expected result:** Real SHT40 values in serial log.

**Next:** Step 5.1.

### Completion gate

- [ ] Static SHT4x device is ready.
- [ ] Real temperature is printed.
- [ ] Real humidity is printed.
- [ ] Missing sensor produces a controlled error.
- [ ] Static node/wrapper are marked TEMPORARY SHORTCUT.

[↑ Back to roadmap index](#roadmap-index)

---

<a id="milestone-5"></a>

## Milestone 5 — Introduce Module and Module Driver incrementally

### Step 5.1 — Define the minimal module instance

**Open:** `include/spaghetti/module.h`.

**Change:** Add `typedef uint16_t spaghetti_module_id_t;`, minimal state
enum (`UNINITIALIZED`, `READY`, `ERROR`), and `struct spaghetti_module` containing
only ID, Port pointer, driver pointer, and private context pointer. Forward-declare
Port/driver types to avoid cyclic includes.

**Purpose:** Separate one runtime instance from its implementation type.

**Why now:** Registry/Manager need a small common object, not the final huge model.

<details>
<summary><strong>Technical context</strong></summary>

**Used by:** Driver operations, Manager, Runtime later.

**Trigger:** MODULE CONFIGURATION.

**Mechanism:** DIRECT CALL object passing.

**Execution context:** Calling thread.

**Dependencies:** Port/driver declarations only.

**Input:** Manager-supplied fields.

**Output:** Minimal runtime instance layout.

**Errors:** None in type; document invalid/null relationships.

</details>

**Not yet:** Names, discovery metadata, data queues, MQTT state.

**Build now?** NO.

**Flash now?** NO.

**Test:** Ownership checklist: CREATED/OWNED/MODIFIED/DESTROYED by Manager; READ by
driver/Runtime/Communication.

**Expected result:** Instance and type are clearly distinct.

**Next:** Step 5.2.

### Step 5.2 — Define the smallest driver operation table

**Open:** `include/spaghetti/module_driver.h`.

**Change:** Define stable type ID as bounded string or enum; for the first
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

**Purpose:** Let Manager call any module type through one contract.

**Why now:** SHT40 must prove the operation table before Registry exists.

<details>
<summary><strong>Technical context</strong></summary>

**Used by:** SHT40 implementation and future Manager.

**Trigger:** MODULE LIFECYCLE/READ.

**Mechanism:** DIRECT CALL through function pointers.

**Execution context:** Caller thread.

**Dependencies:** Module and Port capability types.

**Input:** Module pointer and sample output.

**Output:** `0` or negative errno.

**Errors:** Null ops/module, unsupported capability, I/O failure.

</details>

**Not yet:** Command/configure/probe/power callback or ABI version.

**Build now?** NO.

**Flash now?** NO.

**Test:** Review that driver does not own the module instance.

**Expected result:** Three-operation contract only.

**Next:** Step 5.3.

### Step 5.3 — Adapt temporary SHT40 wrapper to the operation table

**Open:** `spaghetti_modules/sht40/sht40.h`, `sht40.c`, `src/main.c`.

**Change:** Export an immutable
`const struct spaghetti_module_driver spaghetti_sht40_driver`. Implement its
`init/read/deinit` using the already working static Zephyr SHT4x device. In main,
construct one TEMPORARY module object and invoke only `driver.ops`.

**Temporary shortcut:** Module object lives in main; sensor device is still static.
Manager removes the first shortcut in Milestone 7; Milestone 8 removes the second.

**Purpose:** Prove polymorphic call flow without changing proven hardware code.

**Why now:** Registry should store a tested driver descriptor.

<details>
<summary><strong>Technical context</strong></summary>

**Used by:** Temporary main harness.

**Trigger:** BOOT/PERIODIC READ.

**Mechanism:** DIRECT CALL through operation table.

**Execution context:** Main thread.

**Dependencies:** Temporary SHT4x Sensor wrapper.

**Input:** Module with Port 0 and output sample.

**Output:** Same real values as Milestone 4.

**Errors:** Missing op, incompatible Port, prior sensor errors.

</details>

**Not yet:** Registry/Manager lookup or zbus.

**Build now?** YES: `make build`.

**Flash now?** YES.

**Test:** Ensure main never calls `sensor_*` or SHT40 concrete functions directly;
it calls operation pointers.

**Expected result:** Measurements unchanged through generic driver contract.

**Next:** Step 6.1.

### Completion gate

- [ ] Module ownership is documented.
- [ ] Driver descriptor has only required initial operations.
- [ ] Main reads through the operation table.
- [ ] Real measurement still works.

[↑ Back to roadmap index](#roadmap-index)

---

<a id="milestone-6"></a>

## Milestone 6 — Add the Driver Registry

### Step 6.1 — Declare Registry lookup API

**Open:** `include/spaghetti/driver_registry.h`.

**Change:** Declare `int spaghetti_driver_registry_init(void);`,
`const struct spaghetti_module_driver *spaghetti_driver_registry_find(const char
*type_id);`, and optionally `size_t spaghetti_driver_registry_count(void);`.

**Purpose:** Resolve a module type without Manager referencing SHT40 symbols.

**Why now:** The tested SHT40 descriptor is ready to register.

<details>
<summary><strong>Technical context</strong></summary>

**Used by:** Core initializes; Manager finds; Communication later counts.

**Trigger:** BOOT/MODULE CONFIGURATION.

**Mechanism:** DIRECT CALL.

**Execution context:** Main/calling thread.

**Dependencies:** Module Driver type.

**Input:** Null-terminated bounded type ID.

**Output:** Const descriptor or `NULL` for unknown.

**Errors:** Null/empty key and duplicate descriptors during init.

</details>

**Not yet:** Runtime registration, hash table, iterable sections.

**Build now?** NO.

**Flash now?** NO.

**Test:** API review: Registry never initializes the driver.

**Expected result:** Minimal immutable lookup contract.

**Next:** Step 6.2.

### Step 6.2 — Implement fixed Registry

**Open:** `subsys/driver_registry/driver_registry.c`.

**Change:** Create a private const pointer array containing
`&spaghetti_sht40_driver`; validate non-null IDs/ops and duplicates in init;
implement linear exact-string lookup and count.

**Purpose:** Use predictable static memory and simple debugging.

**Why now:** One driver does not justify linker magic or a hash table.

<details>
<summary><strong>Technical context</strong></summary>

**Used by:** Core/Manager.

**Trigger:** BOOT/LOOKUP.

**Mechanism:** DIRECT CALL.

**Execution context:** Caller thread; immutable after init.

**Dependencies:** SHT40 descriptor and standard bounded string comparison.

**Input:** `"sht40"` or another ID.

**Output:** SHT40 pointer or `NULL`.

**Errors:** Duplicate/invalid table; unknown lookup is normal.

</details>

**Not yet:** Locking; frozen lookup needs none.

**Build now?** NO; integrate next.

**Flash now?** NO.

**Test:** Local test path for known and unknown IDs.

**Expected result:** Deterministic linear registry.

**Next:** Step 6.3.

### Step 6.3 — Link and test Registry from Core/main

**Open:** Root `CMakeLists.txt`, `subsys/core/core.c`, temporary test in `main`.

**Change:** Add `subsys/driver_registry/driver_registry.c`; Core calls
registry init after Port. Temporarily assert/log that `find("sht40")` is non-null
and `find("does-not-exist")` is null, then continue existing read path.

**Purpose:** Prove both success and clean failure on-device.

**Why now:** Manager must receive a trustworthy Registry.

<details>
<summary><strong>Technical context</strong></summary>

**Used by:** Core/test.

**Trigger:** BOOT.

**Mechanism:** DIRECT CALL.

**Execution context:** Main thread.

**Dependencies:** Registry APIs.

**Input:** Known/unknown strings.

**Output:** Exact pointer/null behavior.

**Errors:** Registry init error stops Core readiness.

</details>

**Not yet:** Manager or dynamic configuration.

**Build now?** YES: `make build`.

**Flash now?** YES.

**Test:** Observe known success/unknown rejection and continued sensor reading.

**Expected result:** No crash or fallback for unknown ID.

**Next:** Step 7.1.

### Completion gate

- [ ] Registry initializes once.
- [ ] `find("sht40")` returns the SHT40 descriptor.
- [ ] `find("does-not-exist")` returns `NULL`.
- [ ] Registry performs no driver lifecycle call.

[↑ Back to roadmap index](#roadmap-index)

---

<a id="milestone-7"></a>

## Milestone 7 — Configure `Port 0 = SHT40` through Module Manager

### Step 7.1 — Declare Manager's first lifecycle API

**Open:** `include/spaghetti/module_manager.h`.

**Change:** Declare `int spaghetti_module_manager_init(void);`,
`int spaghetti_module_manager_configure(spaghetti_port_id_t port_id, const char
*type_id, spaghetti_module_id_t *out_id);`,
`const struct spaghetti_module *spaghetti_module_manager_get_by_port(...)`, and
`int spaghetti_module_manager_read(spaghetti_module_id_t id, struct
spaghetti_sample *out);`.

**Purpose:** Own one live instance and route its first operation.

**Why now:** The Port and Registry are independently proven.

<details>
<summary><strong>Technical context</strong></summary>

**Used by:** Core/main test; Runtime later.

**Trigger:** BOOT TEST/MODULE CONFIGURATION/READ REQUEST.

**Mechanism:** DIRECT CALL.

**Execution context:** Caller thread.

**Dependencies:** Port, Registry, driver ops.

**Input:** Port 0, `"sht40"`, output ID/sample.

**Output:** READY instance and real sample.

**Errors:** Invalid port/type, occupied port, no slot, init/read failure.

</details>

**Not yet:** Remove/replace, mutex, dynamic pool, discovery.

**Build now?** NO.

**Flash now?** NO.

**Test:** Ownership: CREATED/OWNED/MODIFIED/DESTROYED by Manager.

**Expected result:** API limited to one configuration case.

**Next:** Step 7.2.

### Step 7.2 — Implement one-slot Manager

**Open:** `subsys/module_manager/module_manager.c`.

**Change:** Create one private module slot plus used flag. `init` clears it.
`configure` calls `spaghetti_port_get`, Registry find, capability validation, fills
slot, calls driver `init`, and commits READY only on success. `read` validates ID/
READY and calls driver `read`. On init failure clear the slot.

**Purpose:** Build the exact first lifecycle transaction.

**Why now:** One slot makes failure/ownership visible before adding complexity.

<details>
<summary><strong>Technical context</strong></summary>

**Used by:** Main test/Runtime.

**Trigger:** MODULE CONFIGURATION/READ.

**Mechanism:** DIRECT CALL chain.

**Execution context:** Main/calling thread.

**Dependencies:** `port_get` -> `registry_find` -> `driver->init/read`.

**Input:** Valid IDs and output pointers.

**Output:** Instance ID and sample.

**Errors:** `-EINVAL`, `-ENOENT`, `-ENOTSUP`, `-EBUSY`, driver errno.

</details>

**Not yet:** Threads, queues, replacement, callbacks.

**Build now?** NO; integrate next.

**Flash now?** NO.

**Test:** Mentally trace rollback before compiling.

**Expected result:** No partially READY instance after failure.

**Next:** Step 7.3.

### Step 7.3 — Replace main-owned instance with Manager

**Open:** Root `CMakeLists.txt`, `subsys/core/core.c`, `src/main.c`.

**Change:** Add Manager source. Core initializes it after Registry. In main,
remove the temporary module object and call configure for Port 0/SHT40 once, then
Manager read in the existing loop.

**Temporary shortcut:** The assignment and sampling loop are still hardcoded in
main; Milestones 9 and 12 remove them.

**Purpose:** Establish the required final control chain early.

**Why now:** Internal Config can later call exactly this Manager API.

<details>
<summary><strong>Technical context</strong></summary>

**Used by:** Main test.

**Trigger:** BOOT/PERIODIC LOOP.

**Mechanism:** DIRECT CALL.

**Execution context:** Main thread.

**Dependencies:** Manager -> Registry -> driver -> current static sensor.

**Input:** Port 0, `sht40`.

**Output:** Instance READY and values.

**Errors:** Log exact configure/read errno.

</details>

**Not yet:** Config struct or CBOR.

**Build now?** YES: `make build`.

**Flash now?** YES.

**Test:** Also request unknown type and occupied Port in controlled test, then
restore valid path.

**Expected result:** Real values now pass through Manager.

**Next:** Step 8.1.

### Completion gate

- [ ] Manager owns the only module instance.
- [ ] Configure calls Port, Registry, then driver in that order.
- [ ] Port 0/SHT40 reaches READY.
- [ ] Unknown type and occupied Port fail cleanly.
- [ ] Real read works through Manager.

[↑ Back to roadmap index](#roadmap-index)

---

<a id="milestone-8"></a>

## Milestone 8 — Remove the temporary shortcut: runtime-removable SHT40

### Step 8.1 — Define SHT40 runtime configuration

**Open:** `spaghetti_modules/sht40/sht40.h` and the module-driver init contract.

**Change:** Define minimal private/public configuration containing only a
verified I2C address, e.g. `struct spaghetti_sht40_config { uint16_t address; };`.
Extend Manager configure only enough to pass a bounded config pointer/length or a
typed initial config. Prefer a generic bounded config view if it remains clear.

**Purpose:** Move address from static sensor node into runtime instance config.

**Why now:** Removable modules cannot rely on one pre-instantiated Zephyr sensor.

<details>
<summary><strong>Technical context</strong></summary>

**Used by:** Manager creates; SHT40 init/read consumes.

**Trigger:** MODULE CONFIGURATION.

**Mechanism:** DIRECT CALL.

**Execution context:** Manager/caller thread.

**Dependencies:** Module/driver config contract.

**Input:** Verified address such as 0x44 from configuration.

**Output:** Per-instance context has address and Port.

**Errors:** Invalid/out-of-range address and wrong config size/type.

</details>

**Not yet:** Full channel schema, EEPROM, alternate addresses guessed.

**Build now?** NO.

**Flash now?** NO.

**Test:** Config validation accepts verified address and rejects invalid values.

**Expected result:** No driver-global runtime address.

**Next:** Step 8.2.

### Step 8.2 — Replace Sensor API with Port + direct I2C

**Open:** `spaghetti_modules/sht40/sht40.c` and the exact SHT40 datasheet.

**Change:** Reimplement driver `init/read` using
`spaghetti_port_i2c_device()` plus Zephyr `i2c_write`, `i2c_read`, or
`i2c_write_read`. Implement only the measurement mode needed. Validate response
CRC and convert raw temperature/humidity into the current sample type. Keep each
protocol constant traceable to the datasheet.

**Purpose:** Support a module chosen at runtime on a static Core bus.

**Why now:** The standard Zephyr SHT4x driver requires static DT instantiation.

<details>
<summary><strong>Technical context</strong></summary>

**Used by:** Manager through driver ops.

**Trigger:** MODULE INIT/READ.

**Mechanism:** DIRECT CALL.

**Execution context:** Manager/Runtime thread; bounded sleep if datasheet requires.

**Dependencies:** Port API and Zephyr I2C API.

**Input:** Port, runtime address, output sample.

**Output:** Same real values as static driver path.

**Errors:** NACK, timeout, CRC, invalid raw response, removal during read.

</details>

**Not yet:** Async I2C, heater modes, automatic probing.

**Build now?** YES while static node still exists as comparison: `make build`.

**Flash now?** YES; compare readings before removing shortcut.

**Test:** Real reading and disconnected-sensor error; compare plausible values with
Milestone 4 output.

**Expected result:** Driver no longer calls Sensor API.

**Next:** Step 8.3.

### Step 8.3 — Remove the static SHT4x device

**Open:** Board overlay, `prj.conf`, SHT40 source/header.

**Change:** Delete only the temporary `sht40_test` node. Remove
`CONFIG_SENSOR=y` if nothing else uses Sensor API; keep `CONFIG_I2C=y`. Delete
temporary test API and all `DEVICE_DT_GET(DT_NODELABEL(sht40_test))`/
`sensor_*` use. Keep runtime address passed through Manager.

**Purpose:** Complete transition to removable-module model.

**Why now:** Both paths were compared on real hardware.

<details>
<summary><strong>Technical context</strong></summary>

**Used by:** Build and final SHT40 driver.

**Trigger:** REFACTOR AFTER HARDWARE PROOF.

**Mechanism:** BUILD TIME plus DIRECT CALL runtime path.

**Execution context:** Build/main thread.

**Dependencies:** Port I2C only.

**Input:** Runtime Port/address.

**Output:** Same values with no static module DT node.

**Errors:** Kconfig/source still depending on Sensor API.

</details>

**Not yet:** Custom Port DT binding.

**Build now?** YES: `make pristine`.

**Flash now?** YES.

**Test:** Search source/final DTS for `sht40_test` and static compatible; confirm
none, then verify measurement.

**Expected result:** Port 0/SHT40 is runtime-configured and working.

**Next:** Step 9.1.

### Completion gate

- [ ] No removable SHT40 node remains in Devicetree.
- [ ] SHT40 uses Port + Zephyr I2C API.
- [ ] Address is instance configuration, not driver global.
- [ ] CRC/I2C errors are handled.
- [ ] Real measurements still work.

[↑ Back to roadmap index](#roadmap-index)

---

<a id="milestone-9"></a>

## Milestone 9 — Build the internal configuration path before CBOR

### Step 9.1 — Define the smallest internal config model

**Open:** `include/spaghetti/config.h`.

**Change:** Define fixed limits and only the fields required now:

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

**Purpose:** Give all firmware layers C structures independent of serialization.

**Why now:** CBOR must fill a proven model, not define architecture.

<details>
<summary><strong>Technical context</strong></summary>

**Used by:** Main test, future decoder/Communication, Manager/Runtime.

**Trigger:** CONFIG COMMAND/BOOT TEST.

**Mechanism:** DIRECT CALL.

**Execution context:** Caller thread.

**Dependencies:** Port/module IDs.

**Input:** Version, Port 0/SHT40/address, 1000 ms.

**Output:** Valid internal configuration.

**Errors:** Wrong version/count, duplicate port, empty type, zero period.

</details>

**Not yet:** CBOR, MQTT fields, discovery policy, giant union.

**Build now?** NO.

**Flash now?** NO.

**Test:** Ownership/lifetime review for type strings and arrays.

**Expected result:** Small bounded config.

**Next:** Step 9.2.

### Step 9.2 — Implement validation and apply

**Open:** `subsys/config/config.c`.

**Change:** Implement pure validation first. Implement `apply` as: validate
entire config; for each initial module DIRECT CALL Manager configure; only then
hand sampling config to Runtime later. For this milestone apply only module config
and report sampling as stored/not yet active. Preserve first failure code/index.

**Purpose:** Establish the real configuration-to-Manager boundary.

**Why now:** Main hardcode can be replaced without serialization.

<details>
<summary><strong>Technical context</strong></summary>

**Used by:** Main now; Communication/decoder later.

**Trigger:** CONFIG COMMAND.

**Mechanism:** DIRECT CALL.

**Execution context:** Main/calling thread.

**Dependencies:** Module Manager configure.

**Input:** Complete internal config.

**Output:** Applied module(s) or exact validation/apply error.

**Errors:** Partial apply. For one module, rollback is simple; document
transaction strategy before multiple modules.

</details>

**Not yet:** Persistent state, CBOR, async config worker.

**Build now?** NO; integrate next.

**Flash now?** NO.

**Test:** Validate valid config plus bad version, duplicate/invalid Port, zero period.

**Expected result:** Invalid config never calls Manager.

**Next:** Step 9.3.

### Step 9.3 — Replace main's assignment with a hardcoded C config

**Open:** Root `CMakeLists.txt`, `subsys/core/core.c` or `src/main.c` test harness.

**Change:** Add `subsys/config/config.c`. Construct one
`struct spaghetti_config` with Port 0, `sht40`, verified address, period 1000 ms;
call `spaghetti_config_apply`. Remove direct Manager configure from main; retain
temporary Manager read loop until Runtime.

**Temporary shortcut:** Config contents are hardcoded C. CBOR replaces their source
in Milestone 15; Runtime removes the read loop in Milestone 12.

**Purpose:** Exercise the final internal path before external encoding.

**Why now:** It isolates semantic config failures from future decoder failures.

<details>
<summary><strong>Technical context</strong></summary>

**Used by:** Main/Core test.

**Trigger:** BOOT TEST.

**Mechanism:** DIRECT CALL.

**Execution context:** Main thread.

**Dependencies:** Config validate/apply -> Manager.

**Input:** Hardcoded internal object.

**Output:** SHT40 instance and real readings.

**Errors:** Log config validation/apply error distinctly.

</details>

**Not yet:** Encode/decode or storage.

**Build now?** YES: `make build`.

**Flash now?** YES.

**Test:** Change test period invalid to 0 and verify no Manager call; restore 1000.

**Expected result:** `Config -> Manager -> Registry -> SHT40` works.

**Next:** Step 10.1.

### Completion gate

- [ ] Config is bounded and owns/controls string lifetime.
- [ ] Validation occurs before Manager calls.
- [ ] Main does not directly configure Manager.
- [ ] Hardcoded C config produces a real sample.
- [ ] Invalid config is rejected with exact error.

[↑ Back to roadmap index](#roadmap-index)

---

<a id="milestone-10"></a>

## Milestone 10 — Persist only the proven internal config

### Step 10.1 — Define Storage's minimal synchronous API

**Open or create:** `subsys/services/storage/storage.h` and `storage.c`.

**Change:** Declare/implement `spaghetti_storage_init`,
`spaghetti_storage_read_config`, and `spaghetti_storage_write_config` using a
versioned fixed record. Initially a fake RAM backend is acceptable for API tests.

**Purpose:** Separate Config schema from Zephyr persistent backend.

**Why now:** Internal model is proven and small enough to version.

<details>
<summary><strong>Technical context</strong></summary>

**Used by:** Core/Config only.

**Trigger:** BOOT/VALID CONFIG UPDATE.

**Mechanism:** DIRECT CALL.

**Execution context:** Main/calling thread; never ISR.

**Dependencies:** Initially memory; later Zephyr Settings.

**Input:** Config record/destination.

**Output:** Found/not-found/corrupt/status.

**Errors:** Missing record is normal; wrong size/version/corruption.

</details>

**Not yet:** Measurement history or arbitrary blobs.

**Build now?** YES after adding storage source to root CMake: `make build`.

**Flash now?** NO for RAM-only backend.

**Test:** Write/read equality and wrong-version rejection.

**Expected result:** Config can depend on Storage contract, not flash API.

**Next:** Step 10.2.

### Step 10.2 — Add real Zephyr Settings backend

**Open:** `prj.conf`, verified board flash layout/overlay, `storage.c`, root CMake.

**Change:** Add `CONFIG_SETTINGS=y` and select one installed non-filesystem
backend (`CONFIG_SETTINGS_NVS=y` is a practical first choice) only after defining
a real `storage` fixed partition that does not overlap firmware. Register a
Settings handler; load records through SETTINGS CALLBACK; save through Settings.

**Purpose:** Survive reboot using Zephyr's persistent configuration facade.

**Why now:** Config read/write semantics already work without flash.

<details>
<summary><strong>Technical context</strong></summary>

**Used by:** Core/Config.

**Trigger:** BOOT/CONFIG COMMIT.

**Mechanism:** DIRECT CALL + SETTINGS CALLBACK.

**Execution context:** Main/calling thread during synchronous load/save.

**Dependencies:** Zephyr Settings, chosen backend, real fixed partition.

**Input:** Valid record and safe flash region.

**Output:** Record restored after power cycle.

**Errors:** Missing/corrupt/full/I/O; never erase unrelated flash.

</details>

**Not yet:** Invent a partition size/address; derive from real flash.

**Build now?** YES: `make pristine`.

**Flash now?** YES after inspecting final partitions in generated DTS/map.

**Test:** Save assignment, power-cycle, load/apply; corrupt/version-mismatch test
through a controlled test record, not random flash writes.

**Expected result:** Config persists or falls back explicitly.

**Next:** Step 11.1.

### Completion gate

- [ ] Storage partition is verified non-overlapping.
- [ ] Settings backend initializes.
- [ ] Config survives a real power cycle.
- [ ] Missing/corrupt record has controlled behavior.
- [ ] No measurement history or secrets were added.

[↑ Back to roadmap index](#roadmap-index)

---

<a id="milestone-11"></a>

## Milestone 11 — Distribute samples through Data/zbus

### Step 11.1 — Define one immutable temperature sample message

**Open:** `include/spaghetti/data.h`.

**Change:** Define `struct spaghetti_temperature_sample` with source
module ID, fixed-point/micro-unit temperature, humidity if needed, uptime timestamp,
sequence, and validity flags. Declare `int spaghetti_data_init(void);` and
`int spaghetti_data_publish_temperature(const ... *, k_timeout_t timeout);`.

**Purpose:** Create one bounded message with explicit ownership.

**Why now:** A real sensor works; three future consumers require decoupling.

<details>
<summary><strong>Technical context</strong></summary>

**Used by:** Acquisition path publishes; logger/Runtime/MQTT/PC consume.

**Trigger:** DATA ARRIVAL.

**Mechanism:** DIRECT CALL into Data, then ZBUS PUBLISH.

**Execution context:** Acquisition/Runtime thread.

**Dependencies:** zbus later; uptime API for timestamp.

**Input:** Complete copied value, never stack pointer inside payload.

**Output:** Publish status.

**Errors:** Invalid source/value and publication timeout/full pool.

</details>

**Not yet:** Generic variant payload, MQTT topic, heap strings.

**Build now?** NO.

**Flash now?** NO.

**Test:** Confirm struct size/alignment and value lifetime are bounded.

**Expected result:** One precise Data contract.

**Next:** Step 11.2.

### Step 11.2 — Define zbus channel and two message subscribers

**Open:** `subsys/data/data.c`, `prj.conf`, root `CMakeLists.txt`.

**Change:** Add `CONFIG_ZBUS=y`, `CONFIG_ZBUS_MSG_SUBSCRIBER=y`, and start
with static/fixed message-buffer settings sized from the installed Kconfig help;
avoid dynamic allocation unless measured necessary. In `data.c`, define
`ZBUS_CHAN_DEFINE(spaghetti_temperature_chan, struct
spaghetti_temperature_sample, validator, NULL,
ZBUS_OBSERVERS(logger_msg_sub, test_msg_sub), initial_value)` and
`ZBUS_MSG_SUBSCRIBER_DEFINE` for both. Implement publish with `zbus_chan_pub`.
Add `data.c` to CMake.

**Purpose:** Give each consumer its own copied message rather than “latest value”.

**Why now:** Runtime automation should not silently miss an intermediate sample.

<details>
<summary><strong>Technical context</strong></summary>

**Used by:** Publisher and two test consumer threads.

**Trigger:** DATA ARRIVAL.

**Mechanism:** ZBUS PUBLISH / ZBUS MESSAGE SUBSCRIBER.

**Execution context:** Publisher thread; consumers' dedicated test threads.

**Dependencies:** `zbus_chan_pub`, `zbus_sub_wait_msg`.

**Input:** Sample copy.

**Output:** Independent copy to both subscribers.

**Errors:** Validator rejection, allocation/pool exhaustion, timeout.

</details>

**Not yet:** MQTT or Communication consumers.

**Build now?** YES: `make pristine`.

**Flash now?** NO until fake publication test compiles.

**Test:** Publish one fake sample; each test consumer logs same sequence/value once.

**Expected result:** Two independent receipts.

**Next:** Step 11.3.

### Step 11.3 — Publish real SHT40 result

**Open:** Manager/acquisition call site, `subsys/data/data.c`, `src/main.c`.

**Change:** After successful Manager read, convert to
`spaghetti_temperature_sample` and call Data publish. Remove direct sample print
from SHT40 driver; logger subscriber owns printing. Second test consumer logs only
sequence/receipt to prove fan-out.

**Purpose:** Complete real sensor -> common Data path.

**Why now:** Runtime/MQTT must consume Data, not SHT40 APIs.

<details>
<summary><strong>Technical context</strong></summary>

**Used by:** Temporary main acquisition loop; subscribers.

**Trigger:** DATA ARRIVAL.

**Mechanism:** DIRECT CALL then ZBUS PUBLISH.

**Execution context:** Main publisher, subscriber threads.

**Dependencies:** Manager read and Data publish.

**Input:** Real sample.

**Output:** Logger and test subscriber receive identical sequence.

**Errors:** Read failure publishes no valid sample; publish failure logged.

</details>

**Not yet:** MQTT, PC streaming, generic Data routing.

**Build now?** YES: `make build`.

**Flash now?** YES.

**Test:** Run for multiple samples; verify monotonically increasing sequence in both
consumers; intentionally pause a consumer to test pool/backpressure policy.

**Expected result:** Every accepted test sample is independently delivered.

**Next:** Step 12.1.

### Completion gate

- [ ] Data message has explicit ownership and bounded size.
- [ ] Logger receives fake and real samples.
- [ ] Second consumer receives the same sequences.
- [ ] Full-buffer behavior is observed/documented.
- [ ] SHT40 knows nothing about consumers/MQTT.

[↑ Back to roadmap index](#roadmap-index)

---

<a id="milestone-12"></a>

## Milestone 12 — Runtime V0: sample Module 0 every 1000 ms

### Step 12.1 — Define one sampling task, not a scripting engine

**Open:** `include/spaghetti/runtime.h`.

**Change:** Define `struct spaghetti_runtime_sampling_task` with module ID,
period milliseconds, and enabled flag. Declare `spaghetti_runtime_init`,
`spaghetti_runtime_load_sampling_task`, `spaghetti_runtime_start`, and
`spaghetti_runtime_stop`.

**Purpose:** Represent exactly one periodic acquisition.

**Why now:** Config already contains a sample period and Data already distributes.

<details>
<summary><strong>Technical context</strong></summary>

**Used by:** Core/Config; Runtime owns task copy while loaded.

**Trigger:** BOOT/CONFIG APPLY.

**Mechanism:** DIRECT CALL for lifecycle.

**Execution context:** Main/calling thread.

**Dependencies:** Module Manager/Data/Timer service later.

**Input:** READY module ID and period 1000 ms.

**Output:** Valid loaded task/status.

**Errors:** Zero/overflow period, unknown module, already running.

</details>

**Not yet:** Conditions, actions, graph, bytecode, multiple tasks.

**Build now?** NO.

**Flash now?** NO.

**Test:** Validate 1000; reject zero and unknown ID.

**Expected result:** Minimal task contract.

**Next:** Step 12.2.

### Step 12.2 — Implement timer-to-worker execution

**Open or create:** `subsys/runtime/runtime.c`,
`subsys/services/timer/timer.h`, `subsys/services/timer/timer.c`.

**Change:** Timer wraps one `k_timer`. Its expiry callback only performs
`k_sem_give` or `k_msgq_put(..., K_NO_WAIT)`; choose `K_SEM` for this single
periodic wake-up. Runtime owns one dedicated thread: wait on semaphore, DIRECT
CALL Manager read, then Data publish. Implement start/stop around `k_timer_start`
and `k_timer_stop`.

**Purpose:** Move acquisition out of main and never read hardware in timer context.

**Why now:** The manual loop has proved all lower layers.

<details>
<summary><strong>Technical context</strong></summary>

**Used by:** Core/Config starts; Zephyr timer wakes Runtime.

**Trigger:** RUNTIME TIMER.

**Mechanism:** K_TIMER -> K_SEM -> THREAD -> DIRECT CALL.

**Execution context:** Timer expiry gives semaphore; Runtime thread does I/O.

**Dependencies:** Kernel timer/semaphore/thread, Manager read, Data publish.

**Input:** Loaded task.

**Output:** One sample event per period.

**Errors:** Missed/coalesced tick is observable with semaphore max=1;
read/publish failure; invalid task on start.

</details>

**Not yet:** zbus-driven scheduler, multiple timers, dynamic thread.

**Build now?** NO; integrate next.

**Flash now?** NO.

**Test:** Fake Manager counter before hardware test.

**Expected result:** Timer callback contains no blocking call.

**Next:** Step 12.3.

### Step 12.3 — Link Runtime and remove main sampling loop

**Open:** Root `CMakeLists.txt`, `subsys/core/core.c`, `subsys/config/config.c`,
`src/main.c`.

**Change:** Add Runtime/Timer sources. Core initializes Runtime. Config apply
resolves configured Port to module ID, loads 1000 ms task, and starts Runtime.
Remove SHT40 Manager read and periodic sleep from main; main only boots Core.

**Purpose:** Complete first autonomous vertical slice.

**Why now:** Main must stop owning application behavior.

<details>
<summary><strong>Technical context</strong></summary>

**Used by:** Core/Config/Runtime.

**Trigger:** BOOT then periodic timer.

**Mechanism:** DIRECT CALL then K_TIMER/K_SEM/THREAD.

**Execution context:** Main for setup; Runtime thread for reads.

**Dependencies:** Config -> Runtime; Runtime -> Manager -> Data.

**Input:** Internal config period/module.

**Output:** Logger sample each second with short main.

**Errors:** Runtime start failure must make boot degraded/error.

</details>

**Not yet:** Relay threshold or CBOR.

**Build now?** YES: `make build`.

**Flash now?** YES.

**Test:** Measure ten timestamps; stop Runtime via temporary test and verify reads stop.

**Expected result:** Automatic one-second samples without main loop logic.

**Next:** Step 13.1.

### Completion gate

- [ ] Timer callback performs no I/O/blocking.
- [ ] Runtime thread performs Manager read.
- [ ] Main no longer samples directly.
- [ ] Real Data sample appears every ~1000 ms.
- [ ] Runtime stop prevents further acquisitions.

[↑ Back to roadmap index](#roadmap-index)

---

<a id="milestone-13"></a>

## Milestone 13 — Relay and Runtime V1 threshold rule

### Step 13.1 — Implement minimal Relay module driver

**Open or create:** `spaghetti_modules/relay/relay.h`, `relay.c`; update
`module_driver.h` only as needed for `command` operation.

**Change:** Add driver `command(module, command, value)` with only logical
boolean SET. Define private relay config using a Port capability based on the real
hardware. Implement safe init, set, deinit through Port. Add descriptor to fixed
Registry and source to CMake.

**Purpose:** Add the first actuator without placing electrical policy in Runtime.

**Why now:** Runtime V1 needs a tested target.

<details>
<summary><strong>Technical context</strong></summary>

**Used by:** Manager command routing.

**Trigger:** MODULE CONFIGURATION/USER ACTION.

**Mechanism:** DIRECT CALL.

**Execution context:** Manager/Runtime thread.

**Dependencies:** Real Port API and Zephyr GPIO/other verified peripheral.

**Input:** Logical ON/OFF.

**Output:** Applied state/status.

**Errors:** Unsupported Port, invalid command, hardware failure.

</details>

**Not yet:** Invent pin/active level/latching behavior; use schematic.

**Build now?** YES after required real overlay/Kconfig/CMake changes; use
`make pristine` for DTS/Kconfig changes.

**Flash now?** YES only after safe-state review.

**Test:** Manual Manager configure and OFF->ON->OFF; verify electrically and on log.

**Expected result:** Logical state controls real/fake relay safely.

**Next:** Step 13.2.

### Step 13.2 — Add one explicit threshold rule

**Open:** `include/spaghetti/runtime.h`, `subsys/runtime/runtime.c`, `data.c`.

**Change:** Define only `struct spaghetti_runtime_threshold_rule` with
source module/channel, threshold in fixed units, target relay ID, and target bool.
Add `spaghetti_runtime_load_threshold_rule`. Make Runtime a zbus message subscriber
or route its existing Data subscriber into Runtime's `k_msgq`; evaluate in Runtime
thread and DIRECT CALL `spaghetti_module_manager_command` when `temp > 25 C`.

**Purpose:** Prove Data-driven automation.

**Why now:** Both sensor Data and relay command work independently.

<details>
<summary><strong>Technical context</strong></summary>

**Used by:** Config loads; Runtime evaluates.

**Trigger:** DATA ARRIVAL.

**Mechanism:** ZBUS MSG SUBSCRIBER -> Runtime THREAD -> DIRECT CALL.

**Execution context:** Runtime thread.

**Dependencies:** Data subscriber and Manager command.

**Input:** Temperature sample and one rule.

**Output:** Relay ON only for values strictly above threshold.

**Errors:** Missing target/source, wrong channel, command failure.

</details>

**Not yet:** Generic operators/actions, hysteresis unless required for
safe physical test, rule arrays, scripting.

**Build now?** YES: `make build`.

**Flash now?** YES after fake-value test.

**Test:** Inject 24.9, 25.0, 25.1 fixed-unit samples; expect no/no/one command.

**Expected result:** Exact threshold semantics and real relay response.

**Next:** Step 14.1.

### Completion gate

- [ ] Relay hardware facts are verified.
- [ ] Manual OFF/ON/OFF works safely.
- [ ] Runtime receives Data in its thread.
- [ ] 24.9/25.0/25.1 produce expected actions.
- [ ] Runtime contains no GPIO/module-specific protocol.

[↑ Back to roadmap index](#roadmap-index)

---

<a id="milestone-14"></a>

## Milestone 14 — Communication V0 over the existing USB console

### Step 14.1 — Define protocol commands separately from transport

**Open:** `include/spaghetti/communication.h`.

**Change:** Define bounded request/response types for only `GET_STATUS` and
`SET_CONFIG`; declare `spaghetti_communication_init`,
`spaghetti_communication_handle_request`, and response callback registration or
return-buffer API. Payload for SET_CONFIG is bytes, not parsed fields.

**Purpose:** Keep protocol dispatch independent from USB/shell/CBOR.

**Why now:** Local Config works and can be invoked by external ingress.

<details>
<summary><strong>Technical context</strong></summary>

**Used by:** Shell transport adapter now; future other transports.

**Trigger:** COMMUNICATION RX.

**Mechanism:** DIRECT CALL after transport reception.

**Execution context:** Communication worker/caller thread.

**Dependencies:** Core/Config/decoder contract.

**Input:** Bounded command and payload.

**Output:** Versioned response/status.

**Errors:** Unknown command, oversized payload, invalid state.

</details>

**Not yet:** CBOR fields in Manager, BLE/Wi-Fi transports, OTA.

**Build now?** NO.

**Flash now?** NO.

**Test:** Pure request dispatch with GET_STATUS.

**Expected result:** Transport-free protocol API.

**Next:** Step 14.2.

### Step 14.2 — Add a Zephyr shell transport adapter

**Open or create:** `subsys/communication/communication.c` and
`communication_shell.c`; open `prj.conf`, CMake, existing console overlay.

**Change:** Add `CONFIG_SHELL=y`; keep existing
`zephyr,shell-uart = &usb_serial`. Register minimal shell commands such as
`spaghetti status` and later `spaghetti apply <hex>`. Shell handler validates
bounds/hex then DIRECT CALLS Communication handler. Add sources to CMake; Core
initializes Communication.

**Purpose:** Use the simplest receive transport already configured by the project.

**Why now:** No USB CDC/BLE/network transport must be invented.

<details>
<summary><strong>Technical context</strong></summary>

**Used by:** Developer/PC via USB serial.

**Trigger:** SHELL COMMAND / COMMUNICATION RX.

**Mechanism:** SHELL COMMAND -> DIRECT CALL.

**Execution context:** Zephyr shell thread; safe for bounded parsing, but do not
perform long blocking work while holding shell internals.

**Dependencies:** Zephyr Shell, Communication handler, Config/Status.

**Input:** `spaghetti status` first.

**Output:** Core/modules/runtime status response.

**Errors:** Bad arguments, oversized hex, unavailable Config.

</details>

**Not yet:** CBOR until Step 15, binary framing, authentication.

**Build now?** YES: `make pristine`.

**Flash now?** YES.

**Test:** From existing serial console run help, valid status, invalid command.

**Expected result:** Shell command reaches transport-independent handler.

**Next:** Step 15.1.

### Completion gate

- [ ] Protocol types do not mention Shell/USB.
- [ ] Shell uses existing `usb_serial` console.
- [ ] GET_STATUS succeeds.
- [ ] Invalid/oversized command fails safely.
- [ ] No CBOR field is read by Manager.

[↑ Back to roadmap index](#roadmap-index)

---

<a id="milestone-15"></a>

## Milestone 15 — Decode a tiny CBOR configuration with installed zcbor

### Step 15.1 — Define decoder boundary and tiny schema

**Open or create:** `include/spaghetti/config_codec.h`,
`subsys/config/config_cbor.c`; optionally create
`subsys/config/spaghetti_config_v0.cddl` as schema documentation.

**Change:** Declare:

```c
int spaghetti_config_decode_cbor(const uint8_t *bytes, size_t length,
                                 struct spaghetti_config *out);
```

Start with one exact semantic object: version plus one module assignment
`port_id=0`, `type_id="sht40"`, verified address, period 1000. Choose a small
bounded map or array and document exact keys/order/version in CDDL/comments.

**Purpose:** Make CBOR only a serialization boundary filling internal C Config.

**Why now:** The internal Config path is already proven end-to-end.

<details>
<summary><strong>Technical context</strong></summary>

**Used by:** Communication SET_CONFIG handler.

**Trigger:** COMMUNICATION RX.

**Mechanism:** DIRECT CALL decoder.

**Execution context:** Shell/Communication thread.

**Dependencies:** zcbor decoder and Config validator.

**Input:** Byte span with no assumed termination.

**Output:** Fully owned `spaghetti_config` or negative decode error.

**Errors:** Truncated, wrong type/key/version, oversized string/count,
trailing unexpected bytes, semantic Config rejection.

</details>

**Not yet:** Full runtime graph/MQTT/discovery schema or direct Manager decode.

**Build now?** NO.

**Flash now?** NO.

**Test:** Review that output contains no pointer into the input buffer unless its
lifetime is explicitly copied before return.

**Expected result:** Clean codec boundary.

**Next:** Step 15.2.

### Step 15.2 — Enable zcbor and implement strict V0 decode

**Open:** `prj.conf`, root `CMakeLists.txt`, `config_cbor.c`.

**Change:** Add `CONFIG_ZCBOR=y`; installed Zephyr 4.4 integration then
adds zcbor include paths and `zcbor_common/decode/encode/print` sources. Add
`config_cbor.c` to CMake. Use low-level `zcbor_decode.h` for the tiny schema or
generate decode code from CDDL with the installed `zcbor code` tool. Prefer
generated CDDL code before schema growth; for V0 a hand-written strict decoder is
acceptable if every bound/type/consumed byte is tested. Decode into a temporary
Config, validate, then copy/commit to `out` only on full success.

**Purpose:** Reject malformed external bytes before state mutation.

**Why now:** zcbor module is confirmed installed at
`/opt/zephyrproject/modules/lib/zcbor` with `CONFIG_ZCBOR` integration.

<details>
<summary><strong>Technical context</strong></summary>

**Used by:** Communication.

**Trigger:** SET_CONFIG bytes.

**Mechanism:** DIRECT CALL.

**Execution context:** Communication/shell thread.

**Dependencies:** zcbor decode functions then `spaghetti_config_validate`.

**Input:** Exact V0 CBOR bytes.

**Output:** Internal Config.

**Errors:** All parse/bounds errors map to a stable Communication error;
do not leave partially filled active state.

</details>

**Not yet:** Canonical encoding requirement unless protocol demands it.

**Build now?** YES: `make pristine`; verify `CONFIG_ZCBOR=y` in `.config`.

**Flash now?** NO until host/unit vectors pass.

**Test:** Valid vector plus empty, truncated at every byte, wrong type, excess count,
unknown version, trailing garbage.

**Expected result:** Only valid vector produces Config.

**Next:** Step 15.3.

### Step 15.3 — Apply CBOR from shell through the real path

**Open:** `communication.c`, `communication_shell.c`.

**Change:** `SET_CONFIG` handler calls decoder, then
`spaghetti_config_apply`; shell `apply <hex>` only converts bounded hex bytes and
passes them to Communication. Return separate decode/semantic/apply errors.

**Purpose:** Complete bytes -> decoder -> internal Config -> Manager/Runtime.

**Why now:** Each downstream layer already works locally.

<details>
<summary><strong>Technical context</strong></summary>

**Used by:** PC/developer shell.

**Trigger:** COMMUNICATION RX.

**Mechanism:** SHELL COMMAND -> DIRECT CALL chain.

**Execution context:** Shell thread initially.

**Dependencies:** Communication -> codec -> Config -> Manager/Runtime.

**Input:** Valid encoded Port 0/SHT40 V0 configuration.

**Output:** Applied SHT40 and 1000 ms acquisition.

**Errors:** Hex, decode, validation, apply failures independently.

</details>

**Not yet:** Transport-specific logic in decoder or Manager CBOR access.

**Build now?** YES: `make build`.

**Flash now?** YES.

**Test:** Send valid V0 and malformed variants; query status afterward.

**Expected result:** Valid CBOR configures SHT40; invalid bytes change no live state.

**Next:** Step 16.1.

### Completion gate

- [ ] `CONFIG_ZCBOR=y` is active.
- [ ] Decoder fills only internal `spaghetti_config`.
- [ ] Truncation/wrong types/trailing bytes are rejected.
- [ ] Valid CBOR configures Port 0/SHT40.
- [ ] Manager and Runtime contain no zcbor calls.

[↑ Back to roadmap index](#roadmap-index)

---

<a id="milestone-16"></a>

## Milestone 16 — Publish one fixed MQTT temperature topic

### Step 16.1 — Prove Wi-Fi/network independently

**Open or create:** Future network adapter/service file under
`subsys/services/mqtt/`; open `prj.conf` only when credentials/provisioning test
method is chosen.

**Change:** Enable the minimum installed options for ESP32 networking:
`CONFIG_WIFI=y`, `CONFIG_NETWORKING=y`, `CONFIG_NET_IPV4=y`, `CONFIG_NET_TCP=y`,
`CONFIG_NET_SOCKETS=y`, `CONFIG_NET_MGMT=y`, `CONFIG_NET_MGMT_EVENT=y`, and DHCP/
DNS only if the chosen broker path requires them. Register net management callback;
signal MQTT worker after `NET_EVENT_IPV4_ADDR_ADD`, not merely association.

**Purpose:** Separate network bring-up failures from MQTT failures.

**Why now:** Data works and MQTT is the next external consumer.

<details>
<summary><strong>Technical context</strong></summary>

**Used by:** MQTT service.

**Trigger:** BOOT/NETWORK EVENT.

**Mechanism:** CALLBACK -> K_SEM or K_MSGQ -> THREAD.

**Execution context:** Net callback signals; MQTT/network worker performs work.

**Dependencies:** Zephyr Wi-Fi/net management APIs.

**Input:** Credentials supplied by controlled development configuration,
not committed secrets.

**Output:** IP-ready event and address log.

**Errors:** Auth, association, DHCP, DNS, disconnect/retry.

</details>

**Not yet:** MQTT, TLS, production credential storage.

**Build now?** YES after adding source/Kconfig: `make pristine`.

**Flash now?** YES.

**Test:** Connect, obtain IP, disconnect AP, observe bounded retry/status.

**Expected result:** Network-ready signal is reliable.

**Next:** Step 16.2.

### Step 16.2 — Implement fixed-topic MQTT consumer

**Open or create:** `subsys/services/mqtt/mqtt.h`, `mqtt.c`; update CMake/prj.

**Change:** Add `CONFIG_MQTT_LIB=y`; define
`spaghetti_mqtt_init/start/publish_temperature/get_status`. MQTT owns one thread,
client buffers, socket poll/input/live/reconnect, and bounded outbound `k_msgq`.
Data's MQTT message subscriber enqueues one known temperature to a fixed
development topic. Topic/broker are TEMPORARY SHORTCUTS.

**Purpose:** Prove asynchronous Data-to-broker delivery.

**Why now:** Network and Data independently work.

<details>
<summary><strong>Technical context</strong></summary>

**Used by:** Core starts; Data subscriber publishes.

**Trigger:** DATA ARRIVAL/NETWORK EVENT.

**Mechanism:** ZBUS MSG SUBSCRIBER -> K_MSGQ -> MQTT THREAD -> socket.

**Execution context:** Subscriber copies; dedicated MQTT thread performs I/O.

**Dependencies:** Zephyr MQTT/socket/poll APIs.

**Input:** Temperature sample.

**Output:** One fixed topic payload.

**Errors:** Queue full, disconnected, DNS/connect/publish error, keepalive.

</details>

**Not yet:** Dynamic topics, TLS, QoS matrix, offline history.

**Build now?** YES: `make pristine`.

**Flash now?** YES.

**Test:** Local broker subscriber receives value; stop/restart broker and verify
Runtime sampling continues plus MQTT reconnects.

**Expected result:** Known sample reaches known topic without blocking Runtime.

**Next:** Step 16.3.

### Step 16.3 — Move MQTT endpoint/topic into Config

**Open:** `config.h/c`, CBOR V1 schema/codec, MQTT service.

**Change:** Add only broker endpoint, port, enabled flag, and bounded base
topic to internal Config; update decoder/version and validation; MQTT receives a
copied config through its API. Remove fixed endpoint/topic shortcut.

**Purpose:** Separate configuration from service implementation.

**Why now:** Fixed-topic path is proven.

<details>
<summary><strong>Technical context</strong></summary>

**Used by:** Config applies to MQTT service.

**Trigger:** CONFIG COMMAND.

**Mechanism:** DIRECT CALL or MQTT command K_MSGQ for live reconnect.

**Execution context:** Config caller submits; MQTT thread reconnects.

**Dependencies:** Codec/Config/MQTT service.

**Input:** Valid bounded endpoint/topic.

**Output:** Publish to configured topic.

**Errors:** Invalid host/port/topic and live reconfiguration failure.

</details>

**Not yet:** Secrets inside ordinary Config or OTA over MQTT.

**Build now?** YES: `make build` (pristine if Kconfig changed).

**Flash now?** YES.

**Test:** Deploy a second topic and confirm next sample appears there.

**Expected result:** No fixed broker/topic remains in MQTT code.

**Next:** Step 17.1.

### Completion gate

- [ ] Network IP readiness is separate from MQTT state.
- [ ] Runtime continues when broker is down.
- [ ] Temperature reaches broker.
- [ ] Queue-full/reconnect behavior is observable.
- [ ] Endpoint/topic now come from validated Config.

[↑ Back to roadmap index](#roadmap-index)

---

<a id="milestone-17"></a>

## Milestone 17 — Add Discovery without changing Manager

### Step 17.1 — Define normalized Discovery result/provider contract

**Open:** `include/spaghetti/discovery.h`.

**Change:** Define mode `MANUAL/AUTO/HYBRID`, source enum independent of
mode, `spaghetti_discovery_result` with port/type/config/source/generation, and
`spaghetti_discovery_provider` operation table. Declare init,
`spaghetti_discovery_submit_manual`, and result callback/sink registration.

**Purpose:** Normalize “what is connected” separately from lifecycle.

**Why now:** Manual Config/Manager path already works and becomes the reference.

<details>
<summary><strong>Technical context</strong></summary>

**Used by:** Communication/Config/manual provider; future providers.

**Trigger:** CONFIG COMMAND/PROVIDER RESULT.

**Mechanism:** DIRECT CALL initially.

**Execution context:** Communication/Config caller thread.

**Dependencies:** Port/type/config value types only.

**Input:** Port 0/SHT40/manual/generation.

**Output:** Normalized result.

**Errors:** Invalid/stale/conflicting result.

</details>

**Not yet:** EEPROM, probe, LLM transport, or meaning AUTO=EEPROM.

**Build now?** NO.

**Flash now?** NO.

**Test:** Ownership and generation review.

**Expected result:** Provider-neutral result.

**Next:** Step 17.2.

### Step 17.2 — Route manual config through Discovery

**Open:** `subsys/discovery/discovery.c`, CMake, Core, Config/Communication apply.

**Change:** Implement MANUAL-only submit validation. Its accepted-result
sink DIRECT CALLS the existing `spaghetti_module_manager_configure` unchanged.
Add source/CMake/Core init. Replace Config's direct Manager assignment with
Discovery manual submission. Keep Runtime/services config direct to their owners.

**Purpose:** Prove separation without disrupting working lifecycle.

**Why now:** Existing behavior is a regression oracle.

<details>
<summary><strong>Technical context</strong></summary>

**Used by:** Config/Communication -> Discovery -> Manager.

**Trigger:** CONFIG COMMAND.

**Mechanism:** DIRECT CALL chain.

**Execution context:** Config/Communication thread.

**Dependencies:** Port validation and unchanged Manager API.

**Input:** Manual result.

**Output:** Same SHT40 instance/readings.

**Errors:** Stale generation, unsupported mode, Manager error propagation.

</details>

**Not yet:** Async provider worker. Add K_WORK only when provider needs it.

**Build now?** YES: `make build`.

**Flash now?** YES.

**Test:** Apply same CBOR/manual assignment and compare status/measurement to before.

**Expected result:** Behavior unchanged; Manager has no source/provider knowledge.

**Next:** Step 18.1.

### Completion gate

- [ ] Manual assignment produces normalized Discovery result.
- [ ] Manager API/implementation is provider-independent and unchanged.
- [ ] Generation/stale result is tested.
- [ ] No EEPROM/probe code exists.
- [ ] Existing CBOR/manual flow still works.

[↑ Back to roadmap index](#roadmap-index)

---

<a id="milestone-18"></a>

## Milestone 18 — Replace Port hardcode and verify multiple Core variants

### Step 18.1 — Define real Spaghetti Port binding

**Open or create:** `dts/bindings/spaghetti/spaghettilab,port.yaml`; use
`dts/bindings/spaghetti/README.md` and real hardware requirements.

**Change:** Start with actual static fields required by Port 0. Conceptual
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

**Purpose:** Generate Port descriptors from each board rather than C hardcode.

**Why now:** One Core/Port works and its actual minimum requirements are known.

<details>
<summary><strong>Technical context</strong></summary>

**Used by:** Devicetree build and `port.c` macros.

**Trigger:** BUILD.

**Mechanism:** BUILD TIME.

**Execution context:** Host DT tools/compiler.

**Dependencies:** Zephyr binding schema and real board DTS.

**Input:** Valid static Port nodes.

**Output:** Generated DT macros.

**Errors:** Missing property/wrong reference must fail build.

</details>

**Not yet:** Runtime module identity or imaginary capabilities.

**Build now?** YES after one board node: `make pristine`.

**Flash now?** NO until final DTS inspection.

**Test:** Valid node builds; intentionally missing required field fails, then restore.

**Expected result:** Useful build-time validation.

**Next:** Step 18.2.

### Step 18.2 — Create first real Spaghetti board and remove Port C hardcode

**Open or create:** `boards/spaghettilab/<real_core_name>/` files following current
Zephyr hardware model: `board.yml`, board DTS, `Kconfig.<board>`, defconfig, and
runner files only if needed. Open `port.c`.

**Change:** Move verified MCU/wiring/port count/controller/power static facts
into board DTS. Refactor Port initialization to instantiate/enumerate enabled
`spaghettilab,port` nodes via DT instance macros. Delete TEMPORARY
`DT_NODELABEL(i2c0)` single-descriptor hardcode. Add only required board/Kconfig/
CMake root discovery integration per installed Zephyr board model.

**Purpose:** Make hardware variant data declarative.

**Why now:** The abstraction is already proven, so refactor has observable parity.

<details>
<summary><strong>Technical context</strong></summary>

**Used by:** West/CMake/Port.

**Trigger:** BUILD/BOOT.

**Mechanism:** BUILD TIME descriptors then BOOT DIRECT CALL.

**Execution context:** Build tools/main thread.

**Dependencies:** Generated macros and Device Model.

**Input:** Real first-Core board description.

**Output:** Same Port 0/SHT40 behavior on custom board target.

**Errors:** Board discovery, DTS validation, device readiness.

</details>

**Not yet:** Copy all devkit definitions blindly or add second board guesses.

**Build now?** YES with `BOARD=<real board/qualifier> make pristine` or `.env`
override using the project's existing Compose/Make mechanism.

**Flash now?** YES after final DTS/flash runner inspection.

**Test:** Compare Port capability/status and real measurement with old devkit target.

**Expected result:** No C3 pin/controller label in higher layers or Port catalog data.

**Next:** Step 18.3.

### Step 18.3 — Add or simulate a second Core variant

**Open or create:** Second real board directory only when its hardware exists; if it
does not, create a build-only test fixture outside production board claims.

**Change:** Describe its real/deliberately simulated different port count
and capabilities. Build the unchanged Core/Manager/Runtime/Data/module code. Query
capabilities instead of adding `if (core == C3/S3)`.

**Purpose:** Verify architectural portability rather than merely promise it.

**Why now:** Generated Port enumeration is complete.

<details>
<summary><strong>Technical context</strong></summary>

**Used by:** Build matrix/tests.

**Trigger:** BUILD.

**Mechanism:** BUILD TIME.

**Execution context:** Host CI/developer.

**Dependencies:** Second board DTS/Kconfig.

**Input:** Different number/capabilities.

**Output:** Common higher layers compile and enumerate correctly.

**Errors:** Unsupported module on capability-poor port -> `-ENOTSUP`.

</details>

**Not yet:** Runtime board-name branching.

**Build now?** YES for both targets with existing build command/BOARD override.

**Flash now?** Only if second physical Core exists.

**Test:** Build both; configure SHT40 only on I2C-capable port; invalid mapping fails.

**Expected result:** Higher layers contain no ESP32-C3/S3 GPIO or board checks.

**Next:** Step 19.1.

### Completion gate

- [ ] Real custom board builds/boots.
- [ ] Port catalog comes from Devicetree instances.
- [ ] Hardcoded C3 Port controller label is removed.
- [ ] Two variant builds exercise different port capabilities/counts.
- [ ] Manager/Runtime/Data/module APIs are unchanged between targets.

[↑ Back to roadmap index](#roadmap-index)

---

<a id="milestone-19"></a>

## Milestone 19 — Add only real power behavior

### Step 19.1 — Define one measured resource contract

**Open:** `include/spaghetti/power.h`, real board schematic, Port binding/DTS.

**Change:** Only if real controllable power hardware exists, define resource
ID/state and declare `spaghetti_power_init`, `spaghetti_power_acquire`,
`spaghetti_power_release`, `spaghetti_power_get_status`. Add real power reference
to DT binding/board node; no placeholder remains in production.

**Purpose:** Prevent disabling a shared rail while modules use it.

**Why now:** Module lifecycle and multi-board static facts are stable.

<details>
<summary><strong>Technical context</strong></summary>

**Used by:** Manager/driver lifecycle; Communication status.

**Trigger:** MODULE CONFIGURATION/REMOVAL.

**Mechanism:** DIRECT CALL.

**Execution context:** Manager/calling thread.

**Dependencies:** Port power control/Zephyr GPIO or PM based on real hardware.

**Input:** Resource and owner ID.

**Output:** Lease/status and reference-counted state.

**Errors:** Unsupported resource, transition failure, underflow/double release.

</details>

**Not yet:** Battery policy, deep sleep, speculative wake sources, OTA.

**Build now?** NO until fake logic exists.

**Flash now?** NO.

**Test:** Ownership/reference-count design review.

**Expected result:** Minimal real resource contract.

**Next:** Step 19.2.

### Step 19.2 — Implement reference counting, then real control

**Open:** `subsys/power/power.c`, CMake, Core, Manager lifecycle.

**Change:** Implement private count/state under short `k_mutex`; first
acquire powers on, final release powers off, intermediate operations do not toggle.
Integrate fake backend tests, then real Port/Zephyr control. Manager acquires before
driver init and releases after deinit/rollback. Add source/CMake/Core init.

**Purpose:** Coordinate lifetime safely and predictably.

**Why now:** Exact acquire/release points are established by Manager.

<details>
<summary><strong>Technical context</strong></summary>

**Used by:** Manager/driver.

**Trigger:** MODULE LIFECYCLE.

**Mechanism:** DIRECT CALL + K_MUTEX.

**Execution context:** Thread only, never ISR.

**Dependencies:** Port/Zephyr GPIO or runtime PM.

**Input:** Valid owner/resource.

**Output:** Correct transition/count/status.

**Errors:** Hardware on/off error, overflow/underflow, rollback after init failure.

</details>

**Not yet:** System sleep until runtime/device PM requirements are measured.

**Build now?** YES: `make pristine` if DTS/Kconfig changed, otherwise `make build`.

**Flash now?** YES only after safe electrical review.

**Test:** Two owners acquire/release in both orders; inject failed driver init and
confirm count/rail rollback.

**Expected result:** One on transition, one final off transition, no premature off.

**Next:** Stop and define the next product requirement; OTA and more
discovery providers require separate roadmaps.

### Completion gate

- [ ] Power hardware is real and documented.
- [ ] Reference-count tests pass with two owners.
- [ ] Manager rollback releases acquired power.
- [ ] Real transitions are electrically verified.
- [ ] No speculative sleep/battery/OTA functionality was added.

[↑ Back to roadmap index](#roadmap-index)

---

## Final architecture checkpoint

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
