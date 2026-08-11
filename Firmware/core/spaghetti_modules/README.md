# Spaghetti module drivers

[← Project README](../README.md) · [Architecture](../ARCHITECTURE.md) ·
[Guida per aggiungere un Module](../EXTENDING_SPAGHETTI_LAB.md#percorso-a-aggiungere-un-nuovo-module)

Each child directory implements one external module type through the common module-driver contract. The code executes on the Core; the external module is a peripheral, not another Zephyr application.

> [!IMPORTANT]
> This README describes the implemented V0 API. Registry is still a central table,
> Config CBOR accepts only INA219, and Port does not yet serialize direct I2C calls from
> independent driver threads. Tasks 300–340 replace these limits. Follow the
> [extension guide](../EXTENDING_SPAGHETTI_LAB.md#stato-reale-dellestensibilità)
> before adding a production driver.

## What this component owns

- The peripheral protocol for one module type.
- One immutable driver descriptor.
- Validation and mutation of per-instance private context through driver operations.
- Translation between raw hardware results and generic values/commands.

## What this component does not own

- Module slot lifetime or Port catalog ownership.
- Sampling schedules and product rules.
- Board pin mappings or transport protocols.

## Files

| File | Role |
|---|---|
| `<module>/<module>.h` | Descriptor declaration and module-specific bounded config. |
| `<module>/<module>.c` | Protocol and operation-table implementation. |
| `<module>/README.md` | Concrete API, data format, wiring expectations, and examples. |
| `include/spaghetti/module_driver.h` | Common operation-table contract used by every driver. |

## Data model

| Type / object | Owner | Meaning |
|---|---|---|
| Driver descriptor | Concrete driver | Immutable type ID, required capabilities, and operations. |
| Module instance | Module Manager | Stable key, runtime ID, Port reference, endpoint, state, and opaque context pointer. |
| Private context | Concrete driver static slab | Address, calibration, cached state, or protocol state for one instance. |
| Input/output values | Caller during direct call | Bounded generic read results or command payloads. |

## API contract

### Pure configuration operations

```c
int validate_config(const void *config, size_t config_size);
int describe_endpoint(const void *config, size_t config_size,
                      struct spaghetti_module_endpoint *out);
```

These operations do not access hardware, allocate context, or mutate a Module.
Manager uses the endpoint to reject a duplicate physical claim while allowing several
endpoints on the same Port. INA219 returns `SPAGHETTI_ENDPOINT_I2C_ADDRESS` plus its
configured 7-bit address.

### `int init(struct spaghetti_module *module, const void *config, size_t config_size)`

**Purpose:** Validate the Port and initialize one instance.

**Parameters**

| Parameter | Meaning |
|---|---|
| `module` | Manager-owned instance with a valid Port and initially null context. |
| `config` | Caller-owned bounded configuration. |
| `config_size` | Exact configuration byte count. |

**Returns:** `0` when READY; negative error otherwise.

**Errors:** Invalid config, missing capability, device absent, or bus timeout.

**Execution context:** Calling thread; may perform bounded bus I/O.

**Calls:** Port API and the relevant Zephyr peripheral API.

### `int read(struct spaghetti_module *module, struct spaghetti_sample *out)`

**Purpose:** Acquire one value and populate generic output.

**Parameters**

| Parameter | Meaning |
|---|---|
| `module` | READY instance. |
| `out` | Caller-owned destination written only on success. |

**Returns:** `0` plus a valid sample; negative error otherwise.

**Errors:** Not ready, invalid output, protocol/CRC error, or I/O timeout.

**Execution context:** Calling thread, never ISR.

**Calls:** Port and Zephyr bus APIs.

### `int command(struct spaghetti_module *module, const struct spaghetti_command *command)`

**Purpose:** Apply one supported actuator/configuration command.

**Parameters**

| Parameter | Meaning |
|---|---|
| `module` | READY instance. |
| `command` | Validated bounded command value. |

**Returns:** `0` on accepted hardware state; `-ENOTSUP` when unsupported.

**Errors:** Invalid command/value, not ready, or hardware error.

**Execution context:** Calling thread.

**Calls:** Port and Zephyr peripheral APIs.

### `int deinit(struct spaghetti_module *module)`

**Purpose:** Place hardware in its defined safe state and release instance resources.

**Parameters**

| Parameter | Meaning |
|---|---|
| `module` | Initialized or error-state instance being removed. |

**Returns:** `0` on a completed safe transition; negative error otherwise.

**Errors:** Invalid state or hardware safe-state failure.

**Execution context:** Calling thread.

**Calls:** Port and optional shared-resource API.

## How it works

```mermaid
sequenceDiagram
    participant Manager as Module Manager
    participant Driver as Module driver
    participant Port
    participant Zephyr as Zephyr peripheral API
    Manager->>Driver: init(instance, config)
    Driver->>Port: request required capability
    Port-->>Driver: stable device handle
    Driver->>Zephyr: bounded hardware operation
    Zephyr-->>Driver: result
    Driver-->>Manager: generic value or error
```

## Practical example

An INA219 driver receives an instance configured for address `0x40`. It requests the
I2C device from the shared Port, executes a serialized transaction, and returns bus
voltage, current, and power as a generic sample. Another instance at `0x41` may use
the same Port before or after that transaction. Runtime never calls the concrete
driver directly.

## Zephyr integration

- Devicetree describes the Core controller and Port wiring, not a removable module instance.
- Drivers use synchronous I2C/SPI/GPIO calls from thread context unless their documented hardware requires deferred interrupt processing.
- Register one Zephyr log module per concrete driver.

## Configuration templates

Start from
[`templates/firmware/module_driver.h.template`](../templates/firmware/module_driver.h.template)
and
[`module_driver.c.template`](../templates/firmware/module_driver.c.template). They are
specific to a removable Module; the generic component templates model a singleton
subsystem and must not hold per-instance Module state.

### Descriptor template

```c
static const struct spaghetti_module_driver_ops example_ops = {
    .validate_config = example_validate_config,
    .describe_endpoint = example_describe_endpoint,
    .init = example_init,
    .read = example_read,
    .command = example_command,
    .deinit = example_deinit,
};

const struct spaghetti_module_driver spaghetti_example_driver = {
    .type_id = "example",
    .required_capabilities = SPAGHETTI_PORT_CAP_I2C,
    .ops = &example_ops,
};
```

### Driver-owned context pool

Each driver defines a typed fixed-capacity slab instead of asking Manager for one
global maximum-size byte array:

```c
K_MEM_SLAB_DEFINE(example_context_slab,
                  sizeof(struct example_context),
                  CONFIG_SPAGHETTI_EXAMPLE_MAX_INSTANCES,
                  __alignof__(struct example_context));
```

`init()` allocates with `K_NO_WAIT`, copies validated config, and publishes
`module->context` only on success. `deinit()` clears and frees the exact block. This is
deterministic, uses no heap, and lets different drivers have different context sizes.

### Application `CMakeLists.txt` fragment

```cmake
target_sources(app PRIVATE
  spaghetti_modules/example/example.c
)
```

### Application `prj.conf` fragment

```ini
# Enable the Core-side bus API used by the driver.
CONFIG_I2C=y
CONFIG_LOG=y
```

## Ownership and concurrency

Drivers do not create a thread by default. Module Manager owns lifecycle serialization;
an ISR may only capture/signal and must defer blocking protocol work. In the current V0
implementation direct I2C calls are not yet locked by Port, so do not add concurrent
driver workers on one controller. Task 300 moves transaction serialization into Port;
after that change drivers must use the Port transaction API rather than private locks.

## Contract guarantees

- Every operation is bounded and reports a precise status.
- A driver contains no board-name or physical-pin branch.
- Per-instance mutable state is never stored in the immutable descriptor.
- Context capacity is fixed per driver and exhaustion returns `-ENOMEM` without heap.
