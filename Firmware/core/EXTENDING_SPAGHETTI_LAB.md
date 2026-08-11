# Practical guide to extend Spaghetti LAB

[← README](README.md) · [Architecture](ARCHITECTURE.md) · [Firmware implementation
guide](FIRMWARE_IMPLEMENTATION_GUIDE.md) · [File map](FILE_MAP.md)

This guide is the starting point for those who have to add a new Module or a new Core
variant. You don't need to know Zephyr already, but you need the component datasheet or
the component datasheet or the new board schematic: addresses, registers, pins, and
polarities cannot be inferred from the firmware.

> [!NOTE]
> The guide describes both the extension points already present and the generic contract
> that will be frozen from the steps 300–390. Before implementing a new type, check the
> status in the [V1 platform closure plan](roadmap/V1-PLATFORM-CLOSURE.md): during the
> migration some signatures shown here will be replaced by property sets, records, and typed
> commands.

## Current extensibility status

This table avoids confusing the final contract with the code already available:

| Area | Current implementation | After the indicated task |
|---|---|---|
| Port 1:N Module |Implemented by identity and endpoint|300 also serializes each shared controller within Port|
| Driver Registry | Central table in `driver_registry.c` | 320 uses iterable sections and requires no central patches |
| Received Config | CBOR decoder accepts only INA219 | 310–330 introduce generic properties and codecs |
| Data and commands | Electrical sample and concrete Relay command | 310–340 introduce schema-described records and commands |
| Discovery | Current runtime table; no generic hardware scan | 350 introduces independent providers |
| Communication | Shell/TLS V0 |360 Freezes Common Protocol V1|
|BLE and RAM profiles|Not implemented|291–295 and 365–375|

Up to task 300, I2C drivers obtain `const struct device *` directly from Port: multiple
endpoints are allowed, but the shared controller lock is not yet on the Port border. Do
not start competing access to the same bus assuming a serialization that the current
code does not offer. The current Runtime is sequential; a new thread/ISR driver would
make this limit visible.

## Choose first what you're adding

| Objective | Correct extension | Where the code runs |
|---|---|---|
|Support a sensor or actuator connected to a Port| **Module driver** |Core|
|Support a new Core board or MCU| **Core/board variant** |On the new board|
|Connect two I2C peripherals to the same Port| Two distinct **runtime Modules** |On the Core, on the same bus|
|Change a rule, period or endpoint MQTT|**Config/Runtime**, not a driver|Core|

A Port is a physical connection and can expose a shared bus. It is not an occupied
slot: `ina219` at `0x40`, `ina219` at `0x41`, and another device at `0x44` can share
Port 0. The persistent identity is the Config `key`; physical collisions are determined
by the Port plus the normalized endpoint.

Before starting, check that the starting project is healthy:

```sh
make signing-key       # only if .keys/mcuboot-dev-ecdsa-p256.pem does not exist
make pristine
make validate
```

`make pristine` uses Zephyr 4.4 in the container and also compiles MCUboot. Never change
`build/`: contains generated results, not sources.

## Route A: add a new Module

The specific template for the current API is
[`templates/firmware/module_driver.c.template`](templates/firmware/module_driver.c.template),
alongside its [`module_driver.h.template`](templates/firmware/module_driver.h.template).
The `component.c.template` and `public_api.h.template` generic templates serve for a new
subsystem, not for a Module Driver.

### 1. Write the hardware contract in five lines

Before writing code, create `spaghetti_modules/<name>/README.md` and document:

1. required transport, for example I2C;
2. endpoint that makes an instance unique, for example the 7-bit I2C address;
3. runtime configuration fields and related limits;
4. product data or commands accepted;
5. safe and necessary operations during `deinit()`.

Use a tiny, stable and long `type_id` less than 24 bytes including `\0`, for example
`"example_meter"`. Do not insert the component into the Devicetree: the Module is
removable and is described by the Config runtime. The Devicetree contains only the
controller and Port physically present on the Core.

Open these contracts first:

- [`include/spaghetti/module_driver.h`](include/spaghetti/module_driver.h): callback;
- [`include/spaghetti/module.h`](include/spaghetti/module.h): instance, endpoint and
  sample;
- [`include/spaghetti/port.h`](include/spaghetti/port.h): board-independent hardware access;
- [`spaghetti_modules/ina219/ina219.c`](spaghetti_modules/ina219/ina219.c): readable I2C example;
- [`spaghetti_modules/relay/relay.c`](spaghetti_modules/relay/relay.c): actuator example.

### 2. Create header, implementation and private context

Create:

```text
spaghetti_modules/example_meter/
├── example_meter.h
├── example_meter.c
└── README.md
```

In `example_meter.h` you only display the copied configuration for each instance and the
unchangeable descriptor:

```c
#ifndef SPAGHETTI_EXAMPLE_METER_H
#define SPAGHETTI_EXAMPLE_METER_H

#include <stdint.h>

struct spaghetti_module_driver;

struct spaghetti_example_meter_config {
	uint8_t i2c_address;
	uint16_t conversion_time_ms;
};

extern const struct spaghetti_module_driver spaghetti_example_meter_driver;

#endif /* SPAGHETTI_EXAMPLE_METER_H */
```

- `i2c_address` has passed by value because it is a small number owned by the
  configuration. It must contain the 7-bit address, not the one moved by some
  datasheets.
- `conversion_time_ms` is by value, has explicit units and is copied in context. Replace
  it with the parameters really necessary to the component.
- The descriptor is `extern const`: there is only one time throughout the firmware, it
  does not contain the instances and the Registry retains the pointer.

In `example_meter.c`, after it includes, constants and `LOG_MODULE_REGISTER`, it creates
the private context:

```c
struct spaghetti_example_meter_context {
	const struct device *i2c;
	struct spaghetti_example_meter_config config;
	bool initialized;
};

K_MEM_SLAB_DEFINE(example_meter_context_slab,
		  sizeof(struct spaghetti_example_meter_context),
		  CONFIG_SPAGHETTI_EXAMPLE_METER_MAX_INSTANCES,
		  __alignof__(struct spaghetti_example_meter_context));
```

`struct device` is the object with which Device Model Zephyr is a controller that has
already been created when booting. The pointer is necessary because the object is owned
by Zephyr; it is `const` because the driver should not change it. His lifetime coincides
with the firmware.

The context, however, belongs to the driver and lasts from `init()` to `deinit()`. A
`K_MEM_SLAB` is a static set of blocks all of the same size: the allocation is
deterministic, does not use heap and allows every type of Module to have a context of
the correct measurement.

### 3. Implement all operations, in this order

The callbacks are `static`: only the public descriptor makes them accessible.

```c
static int example_meter_validate_config(const void *config,
					 size_t config_size);
static int example_meter_describe_endpoint(
	const void *config,
	size_t config_size,
	struct spaghetti_module_endpoint *out);
static int example_meter_init(struct spaghetti_module *module,
			      const void *config,
			      size_t config_size);
static int example_meter_read(struct spaghetti_module *module,
			      struct spaghetti_sample *out);
static int example_meter_deinit(struct spaghetti_module *module);
```

`validate_config()` is called by Config and Module Manager before touching the hardware.
`config` is `const void *` because the Manager knows only generic bytes, lends them for
the duration of the call and the driver cannot change them. Check pointer, exact size
and all ranges; copy first with `memcpy()` in a local struct to avoid un aligned access.
Returns `0`, `-EINVAL` for invalid forma/range or `-ERANGE` when a calculation is not
representative. It does not allocate and does not access the bus.

`describe_endpoint()` is called after validation. For a I2C device only writes if
successful:

```c
const struct spaghetti_module_endpoint endpoint = {
	.kind = SPAGHETTI_ENDPOINT_I2C_ADDRESS,
	.value = example_config.i2c_address,
};

*out = endpoint;
return 0;
```

Manager uses this value to refuse two Module at the same address on the same Port, but
allows different addresses. A device that monopolizes the Port uses
`SPAGHETTI_ENDPOINT_PORT_EXCLUSIVE`; a SPI uses `SPAGHETTI_ENDPOINT_SPI_CHIP_SELECT`.

`init()` is called by the Module Manager on a provisional instance. You must:

1. verify `module`, `module->port` and `module->context == NULL`;
2. validate and copy the configuration;
3. allocate a block with `k_mem_slab_alloc(..., K_NO_WAIT)`;
4. get the controller with `spaghetti_port_i2c_device(module->port)`;
5. verify `device_is_ready(i2c)`;
6. run only limited initial I2C transfers over time;
7. assign `module->context = context` only after complete success;
8. on error, reset and release the block and return the original error.

`module` is a non-const pointer because the driver publishes its context. The
Config remains borrowed: if needed after `init()`, it must be copied in context. Common
errors are `-EINVAL`, `-ENOMEM`, `-ENOTSUP`, `-ENODEV`, `-EIO`, `-ETIMEDOUT` and
`-ERANGE`.

I2C uses API synchronous Zephyr from thread context:

```c
int err = i2c_write(i2c, buffer, sizeof(buffer), address);
int err = i2c_write_read(i2c, address,
			 const void *write_buf, size_t write_len,
			 void *read_buf, size_t read_len);
```

The address comes from the Config runtime. Do not use `DEVICE_DT_GET()` to create a
static sensor instance: the only `struct device *` allowed here is that of the
controller obtained from the Port.

`read()` is called by Runtime via Module Manager. You must check Module READY, context
and `out`, perform a limited acquisition, convert data to explicit entire drives and
write `*out` only at the end. Today `struct spaghetti_sample` contains only microvolt
bus voltage, microampere current and microwatt power. An electrical meter can then be
integrated without changing the data model.

`deinit()` is called by the Manager during removal, replacement, or rollback. Put the
hardware in its safe state, clear/free the context, set `module->context = NULL`, and do
not touch other Modules on the same Port. Even if the hardware transition fails, software
resources must be released.

Finally publishes the table:

```c
static const struct spaghetti_module_driver_ops example_meter_ops = {
	.validate_config = example_meter_validate_config,
	.describe_endpoint = example_meter_describe_endpoint,
	.init = example_meter_init,
	.read = example_meter_read,
	.command = NULL,
	.deinit = example_meter_deinit,
};

const struct spaghetti_module_driver spaghetti_example_meter_driver = {
	.type_id = "example_meter",
	.required_capabilities = SPAGHETTI_PORT_CAP_I2C,
	.ops = &example_meter_ops,
};
```

A driver must have at least one between `read` and `command`. For a `read = NULL` set
actuator, implement `command()` and define a concrete safe state.

### 4. Record it and store memory explicitly

Edit these three files:

1. `CMakeLists.txt`: add the `.c` file to `target_sources(app PRIVATE ...)` and add the directory;
2. `Kconfig`: add log module and slab capacity;
3. `subsys/driver_registry/driver_registry.c`: Include the header and add the descriptor
   to the `drivers[]` table.

Template Kconfig:

```kconfig
module = SPAGHETTI_EXAMPLE_METER
module-str = spaghetti_example_meter
source "subsys/logging/Kconfig.template.log_config"

config SPAGHETTI_EXAMPLE_METER_MAX_INSTANCES
	int "Maximum number of simultaneous Example Meter instances"
	range 1 SPAGHETTI_MAX_MODULES
	default 4
	help
	  Number of typed contexts reserved in the driver-owned memory slab.
```

Registro concreto:

```c
#include <example_meter.h>

static const struct spaghetti_module_driver *const drivers[] = {
	&spaghetti_ina219_driver,
	&spaghetti_relay_driver,
	&spaghetti_example_meter_driver,
};
```

This recording is build-time: makes the type available, but does not create any
instance. The instances arise only when Config or Discovery sends a request to Module
Manager.

### 5. Connect Config, data and commands only where you need

Lifecycle is generic, but three application contracts are not yet. Use this table not to
stop at a compiled but unusable driver:

| The new Module... | Files to modify |
|---|---|
|Use only Config built internally in C|No change to CBOR format|
|Must be created by `spaghetti apply <config-cbor-hex>`| `subsys/config/config_cbor.c`, `subsys/config/spaghetti_config_v1.cddl`, `tests/config_codec/` |
|Produces voltage/current/power|The `spaghetti_sample` and the existing electrical channel are sufficient|
|Produces temperature, humidity, movement or other|`include/spaghetti/module.h`, `include/spaghetti/data.h`, `subsys/data/`, `subsys/runtime/`, possible MQTT and related tests|
|Accept the ON/OFF relay command|The existing command is sufficient only if the semantic is truly identical|
|Accept a different command|`include/spaghetti/module_driver.h`, Module Manager, Runtime/Communication interested and testing|
|Must be detected automatically|Add a Discovery provider; do not scan the driver|

Currently the CBOR decoder explicitly compares the type with `"ina219"`. Then a new
recorded driver works via API C, but a Config received from Shell/rete returns
`-ENOTSUP` until it adds its decode branch and the CDDL schema. To extend the wire
format:

1. assigns numerical keys to the fields without reuse existing keys;
2. decoding first in a local struct typed;
3. valid limits and dimensions;
4. copy the struct to `module->driver_config` and set `module->driver_config_size`;
5. add valid cases, truncated, out range and unknown type to codec tests;
6. If you break compatibility, introduce a new wire version instead of silently changing
   the existing one.

Do not increase `SPAGHETTI_DRIVER_CONFIG_MAX` without measuring RAM and storage. The
config of each driver must fall into the 64 current bytes.

### 6. Add test and test the hardware

Create `tests/example_meter_runtime/` by copying the `tests/ina219_runtime/` structure:
`CMakeLists.txt`, `Kconfig`, `prj.conf`, `testcase.yaml` and `src/main.c`. The fake bus
must check at least:

- valid and not valid config;
- two different addresses on the same Port accepted;
- same address on the same Port rejected with `-EADDRINUSE`;
- exhausted pool with `-ENOMEM`;
- bus error and timeout;
- `out` unmodified when `read()` fails;
- `deinit()` safe and reusable block.

Run:

```sh
docker compose run --rm dev west twister \
  -T tests/example_meter_runtime -p native_sim/native/64 \
  --inline-logs --clobber-output
make validate
make pristine
```

Then configure one real instance, connect ground, power, and bus according to the
schematic, and use `make monitor` to check plausible values and errors with the device
disconnected. Add a second instance at a different endpoint to exercise the
Port 1:N model.

Example use of the resulting API:

```c
const struct spaghetti_example_meter_config driver_config = {
	.i2c_address = 0x42U,
	.conversion_time_ms = 2U,
};
const struct spaghetti_module_request request = {
	.key = 100U,
	.port_id = 0U,
	.type_id = "example_meter",
	.driver_config = &driver_config,
	.driver_config_size = sizeof(driver_config),
	.revision = 1U,
};
spaghetti_module_id_t id;
struct spaghetti_sample sample;

int err = spaghetti_module_manager_configure(&request, &id);
if (err == 0) {
	err = spaghetti_module_manager_read(id, &sample);
}
```

`request` and `driver_config` are owned by the caller and borrowed during `configure()`.
The driver copies what it keeps. `id` is ephemeral and should not be saved; `key` is the
persistent identity used by Config and Runtime.

### End of the Module path

- The Registry finds the exact `type_id`.
- Config invalid does not access hardware.
- More distinct endpoints share the same Port.
- There is no heap and the capacity is visible in Kconfig.
- Removing and rollback free the context and impose the safe state.
- The type is configurable from the required channel, not only from a C test.
- Dati/comandi arrives at Runtime and Communication without private cast.
- Validator, ztest, build and hardware test pass.
- README documents wiring, units, limits and errors.

## Route B: add a new Core variant

A Core variant is a Zephyr board: it describes static facts of the schematic. You should
not know `ina219`, relay or other removable Module.

Use `board.yml.template`, `board.dts.template` and `board_defconfig.template` templates
in `templates/firmware/`. Normally a new Core does not require a `.c` file: SoC, memory,
controller, pin, Port and runner belong to the board Zephyr files. Create a specific
backend C only if there is a hardware resource that the joint contract cannot obtain
from Devicetree; in that case it will be displayed first as Port capability or abstract
service, without branch on the board name.

### 1. Collect data that firmware cannot invent

Before copying files, note:

- Exact and relative board/SoC already supported by Zephyr 4.4;
- actual flash quantity and layout, including MCUboot A/B space and storage;
- controllers and pins for each Port;
- flash/debug development console and runner;
- Wi-Fi, TRNG and GPIO really available;
- controller/pin shared by Maintenance Link;
- levels, pull-ups, open-drain, power supply and safe state verified schematic.

If one of these data is missing, it only creates a clearly marked `build_only` variant
and does not flash it on hardware.

### 2. Create the board directory

Copy the nearest variant below:

```text
boards/spaghettilab/spaghettilab_core_<name>/
├── board.yml
├── Kconfig.spaghettilab_core_<name>
├── spaghettilab_core_<name>.dts
├── spaghettilab_core_<name>_defconfig
└── board.cmake                    # if the family requires a runner
```

In `board.yml` the name becomes the value passed to `BOARD`:

```yaml
board:
  name: spaghettilab_core_<name>
  full_name: Spaghetti LAB Core <Name>
  vendor: spaghettilab
  socs:
    - name: <nome_soc_zephyr>
```

The name SoC is not commercial: it must coincide with the one recognized by Zephyr.
Check it in `$ZEPHYR_BASE/boards` and `$ZEPHYR_BASE/soc` from the container.

`Kconfig.spaghettilab_core_<name>` selects the real SoC model:

```kconfig
config BOARD_SPAGHETTILAB_CORE_<NOME_MAIUSCOLO>
	select SOC_<MODELLO_ZEPHYR>
```

The `_defconfig` enables only essential board functions, such as consoles, serials and
GPIO. Product features such as MQTT or Runtime remain in `prj.conf`.

### 3. Describe hardware and Port in DTS

Devicetree is a build-time description of the hardware. A label node like `i2c0`
identifies a controller node; `&i2c0` is a phandle, i.e. a reference to that node.
Zephyr validates `.dts` with YAML bindings and generates C macros consumed by
`subsys/port/port.c`.

The minimum Spaghetti contract for a Port I2C is:

```dts
/ {
	spaghetti_ports {
		compatible = "simple-bus";
		#address-cells = <1>;
		#size-cells = <0>;

		port0: port@0 {
			compatible = "spaghettilab,port";
			reg = <0>;
			i2c = <&i2c0>;
			status = "okay";
		};
	};
};
```

- `reg = <0>` is the stable ID used by the Config runtime;
- `i2c = <&i2c0>` connects the Port to the really wired controller;
- `status = "okay"` makes the instance visible to Devicetree macros;
- the real binding is
  [`dts/bindings/spaghetti/spaghettilab,port.yaml`](dts/bindings/spaghetti/spaghettilab,port.yaml).

Enable controller and pinctrl using the SoC family symbols, never copied numbers from
another board:

```dts
&i2c0 {
	status = "okay";
	clock-frequency = <I2C_BITRATE_STANDARD>;
	pinctrl-0 = <&spaghetti_i2c0_default>;
	pinctrl-names = "default";
};
```

Pinctrl is the build-time configuration that assigns a peripheral function to pins. The
concrete group must come from the scheme and the macro pinmux of the SoC. The I2C lines
require open-drain and pull-ups in the hardware; the internal pull-up does not
automatically replace the one provided by the electrical project.

Each Port has a different ID. More Port can report the same controller only if the
scheme really represents the same bus displayed on multiple connectors; do not do it for
software convenience.

### 4. Integrate boot, Maintenance Link, and the runner

In the `chosen` node, it checks at least SRAM, console, flash, code partition and, if
used, UART management. The current build is sysbuild with MCUboot: a production board
must preserve a compatible A/B layout, not only fill `src/main.c`.

If the board offers update/maintenance on shared pins, add a
`spaghettilab,maintenance-link` node to
[`dts/bindings/spaghetti/spaghettilab,maintenance-link.yaml`](dts/bindings/spaghetti/spaghettilab,maintenance-link.yaml).
`normal-bus` and `maintenance-uart` are controllers, not hard-coded pins in the common
code. Its pinctrl states belong exclusively to the DTS of the board.

`board.cmake` select existing Zephyr runners. For ESP32 is:

```cmake
include(${ZEPHYR_BASE}/boards/common/esp32.board.cmake)
```

Do not add it by chance: use the chosen family runner and verify that `make flash`
produces consistent offsets with MCUboot and real flash.

### 5. Build the variant and inspect Zephyr's generated output

Run without changing the default value in the repository:

```sh
BOARD=spaghettilab_core_<name>/<zephyr_soc_name> make pristine
```

With sysbuild, the correct application files to check are:

```sh
rg -n "spaghettilab,port|maintenance-link|i2c|pinctrl" \
  build/app/zephyr/zephyr.dts
rg -n "CONFIG_BOARD|CONFIG_SOC|CONFIG_I2C|CONFIG_SERIAL" \
  build/app/zephyr/.config
```

`zephyr.dts` shows the final merge of includes, board, and overlay. `.config` shows the
Kconfig choices that are actually active. Both are diagnostic outputs and must not be modified or
committed.

Then test on the hardware:

1. `make flash` and `make monitor`;
2. verify boot log and Port number;
3. verify the local console and reconnect it after reset;
4. configure two Module to different endpoints on the same Port;
5. Wi-Fi test, storage, reboot and remote console;
6. run normal boot, maintenance, trial image, confirmation and rollback;
7. electrically check pins, levels, and safe states before connecting a Module.

### When you need to change the common code

A board that uses only existing capabilities does not require branch in the C. If you
introduce SPI, a GPIO input, interrupt or a new power source, do not bypass the model by
returning pin/device directly from the driver. Extend in order:

1. binding `dts/bindings/spaghetti/`;
2. capacity and public accesser in `include/spaghetti/port.h`;
3. private descriptor and macro Devicetree in `subsys/port/port.c`;
4. fake Port and test of the affected components;
5. Port and board documentation.

The driver will continue to ask for a capability at the Port and will remain independent
from MCU, board, node label and physical pins.

### End of the Core path

- The board name is discovered by Zephyr 4.4 and compiles with sysbuild/MCUboot.
- `build/app/zephyr/zephyr.dts` contains existing controllers, pins and Port.
- No removable Module appears in the DTS.
- Core identity and capabilities match the real schematic.
- Consoles, flash, storage, Wi-Fi and Maintenance Link are tested on your device.
- Normal boot, trial, confirmation and rollback are qualified.
- The common code does not contain `#ifdef` or branch on the board name.
- [`PROMEMORIA_HARDWARE_E_FINALIZZAZIONE.md`](PROMEMORIA_HARDWARE_E_FINALIZZAZIONE.md)
  has been reviewed item by item.

## Route C: Build and apply a Config

Config is a desired persistent state, not a list of operations. The caller sends a complete
snapshot; Config calculates additions, replacements, and removals and increases
generation only after commit.

### Config C current

For an internal test or default open `include/spaghetti/config.h` and build a struct
owned by the caller:

```c
const struct spaghetti_ina219_config ina_config = {
	.i2c_address = 0x40U,
	.shunt_milliohm = 100U,
	.current_lsb_microamp = 200U,
};
struct spaghetti_config config = {
	.version = SPAGHETTI_CONFIG_VERSION,
	.module_count = 1U,
	.sampling = {
		.enabled = true,
		.source_key = 10U,
		.period_ms = 1000U,
	},
};

config.modules[0].key = 10U;
config.modules[0].port_id = 0U;
strcpy(config.modules[0].type_id, "ina219");
config.modules[0].driver_config_size = sizeof(ina_config);
memcpy(config.modules[0].driver_config, &ina_config, sizeof(ina_config));
```

- `key` is persistent, not the runtime ID returned by the Manager;
- `port_id` must exist on the generated board;
- `driver_config` has a copy, never a pointer to the local variable;
- `sampling.source_key` must reference a key in the same snapshot;
- MQTT disabled requires host, port and empty topic.

Read the current generation and apply with optimistic concurrency:

```c
struct spaghetti_config current;
struct spaghetti_config_error error;
uint32_t generation;
int err;

err = spaghetti_config_get_snapshot(&current, &generation);
if (err == 0) {
	err = spaghetti_config_validate(&config, &error);
}
if (err == 0) {
	err = spaghetti_config_apply(&config, generation);
}
```

`current` serves here to get a consistent snapshot and generation; it is not modified.
Another apply completed in the meantime makes the generation stale and the caller must
reread, not overwrite blindly. Apply can do I/O and rollback; do not call it from ISR,
timer or network callback.

### Config CBOR current

The authoritative format is
[`subsys/config/spaghetti_config_v1.cddl`](subsys/config/spaghetti_config_v1.cddl).
Today the command is:

```text
spaghetti apply <config-cbor-hex>
```

The root wire version 2 map uses:

```text
0 → wire version, value 2
1 → complete Module array
2 → sampling configuration
3 → MQTT configuration
```

For each INA219: `0=key`, `1=Port`, `2="ina219"`, `3={0=address, 1=shunt_milliohm,
2=current_lsb_microamp}`. Do not use struct C dump: padding, endianness and pointers are
not part of the wire format.

There is still no JSON compiler supported in the repository. The 380 task will add it
using the catalog. Until then consider payloads in `tests/config_codec/src/main.c` test
examples, not a convenient user interface. When you add a wire type today, you need to
change CDDL, decoder and test in the same commit; from the 330 task this central patch
will no longer be necessary.

### Config Zephyr is not Config runtime

Similar names indicate different levels:

| File | Decide |When|
|---|---|---|
| board `.dts` / overlay | MCU, pin, controller, Port, flash | build-time |
| board `_defconfig` | minimum required to start that board | build-time |
| root `Kconfig` |Selectable features and capabilities| configure-time |
| `prj.conf` | application image features | build-time |
| `struct spaghetti_config` / CBOR |Module, schedule, rules and services desired| runtime |

A I2C address of a removable Module belongs to the runtime Config. SDA/SCL pins and
controller belong to the DTS. The maximum number of instances belongs to Kconfig.

## Spaghetti LAB specific Caveat

### Ownership and lifetime

- `const struct device *` is owned by Device Model Zephyr and lasts for all firmware; do
  not release it and do not change it.
- `struct spaghetti_module` is owned by Module Manager. The driver can only change his
  `context` in the points provided.
- Config, command and buffers passed to callbacks are borrowed for the only call; copy
  what must survive.
- Descriptor driver and operation table are `static const` or `extern const` with
  lifetime firmware; do not enter a single instance status.
- Do not transfer a stack pointer through zbus, msgq, work or asynchronous callback.

### Concurrency and Zephyr execution contexts

- Timer and ISR only notify; I2C, flash, socket, complex logging and Config apply are
  performed by threads.
- A mutex protects an invariant, not “a file”. Documents who acquires it and not
  maintain it during external callbacks if it is not an explicit part of the contract.
- After task 300 the bus lock belongs to the Port. Do not add a mutex for drivers: two
  different drivers on the same controller would not share it.
- `K_THREAD_DEFINE` and `K_THREAD_STACK_DEFINE` reserve RAM even when the thread does
  not work. Before creating a worker, check whether Runtime is enough or an existing
  workqueue.
- Each wait has timeout or lifetime motivation; a timeout does not authorize to leave
  callback or live socket after `deinit()`/`stop()`.

### Errors and transactions

- Write the outputs only to success: calculate in a local variable and copy at the end.
- Keep the first error that explains the cause; a cleanup error must be logged but must
  not hide it.
- Init publishes context/READY only after the last failing step. Cleanup goes in reverse
  order.
- Config apply is transational. Do not update Storage or generation before Module,
  Runtime and services are reconciliable; in error restore the previous photo.
- `-ENODEV` means unavailable hardware, not a failed build. `undefined reference` means
  an object or symbol is absent from the link.

### Identity, version and compatibility

- Port ID identifies a physical connection; Module key identifies persistent desired
  state; Module ID identifies a live slot and can change after reboot.
- `type_id`, field ID, command ID, operation ID and schema version are contracted. Do
  not reuse a removed ID with a different meaning.
- The normalized endpoint determines collisions: sharing a Port is not itself a
  conflict; sharing the same address or chip-select is.
- `timestamp_ms` current is uptime. After phase 310 also uses boot ID; do not treat it
  as Unix time.
- A new incompatible wire format requires a new version and migration. Do not reinterpret NVS records
  written with previous C layout.

### Zephyr and build

- `DEVICE_DT_GET()` does not look for runtime hardware: it produces a reference from
  Devicetree compiled. For a removable Module use the controller exposed by the Port.
- Always check `build/app/zephyr/zephyr.dts` and `.config`; do not deduce the final
  result by looking at one overlay or `prj.conf`.
- `make pristine` is required after structural changes to DTS, Kconfig, CMake or
  sysbuild.
- `make validate` sees the source of the CMake target. A file not added to
  `target_sources` can be perfect but does not enter the firmware.
- A header found does not prove that its `.c` is linked. Distinguishing error includes,
  compile, links and hardware.
- The future profile describes software budgets; Devicetree remains the hardware
  authority. Do not declare BLE, PSRAM or Port because the SoC theoretically could have
  them.

### Security, updates, and secrets

- Wi-Fi, MQTT, OTA, BLE and console have different credentials and permits. Do not copy
  them into Config of Module.
- Password, PSK and keys do not enter argv, log, README, fixtures or repository.
- `NORMAL`, `MAINTENANCE`, `TRIAL/CONFIRMED` and `LOW_ENERGY/ONLINE` are independent
  sizes. Do not compress them in one enum or boolean.
- Enable Wi-Fi does not automatically open OTA or remote console.
- Update writes only the secondary slot; a connection loss does not erase the confirmed
  image.
- The current device- ID storage provider is not a root of trust against physical
  attacks. eFuse, Secure Boot, Flash Encryption and debug policy remain production
  qualification.

For accidents already encountered and solutions adopted, see
[`DIARIO_PROBLEMI_SOLUZIONI_E_DECISIONI.md`](DIARIO_PROBLEMI_SOLUZIONI_E_DECISIONI.md).

## Recommended order for the first contribution

For a new Module: README component, header/config, callback as well, context and I/O,
Registry/Kconfig/CMake, fake test, Config CBOR, Data/Runtime, hardware test.

For a new Core: schema, board directory, DTS/binding, pinctrl/controller, sysbuild, file
inspection generated, flash/console, Port 1:N, networking and update qualification.

If you do not know where to place a change during work, use this rule:

> The scheme decides what physically exists; Port exposes it without board details; the
> Module Driver knows the protocol; Registry knows the compiled types; Module Manager
> possesses instances; Config describes the desired status; Runtime decides when to use
> them; Data and Communication bring results and requests.
