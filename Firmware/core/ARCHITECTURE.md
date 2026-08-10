# Spaghetti LAB firmware architecture

[← Project README](README.md)

This document explains the firmware architecture without prescribing a specific
sensor, protocol, Core model, or product feature.

> [!IMPORTANT]
> SHT40, Relay, USB, MQTT, and switched power are examples used to make the
> diagrams concrete. They are not mandatory parts of the architecture.

## The idea in one minute

A Spaghetti LAB **Core** controls external **Modules** connected to physical
**Ports**. The firmware must keep three things separate:

1. the hardware physically built into the Core;
2. the modules connected while the Core is running;
3. the product behavior applied to the values produced by those modules.

```mermaid
flowchart LR
    HW["Core hardware <br/> MCU, buses, pins, physical ports"]
    LIVE["Live modules <br/> what is connected now"]
    BEHAVIOR["Product behavior <br/> read, transform, react, expose"]

    HW -->|"described at build time"| PORT["Port API"]
    LIVE -->|"represented at runtime"| MANAGER["Module Manager"]
    PORT --> MANAGER
    MANAGER --> DATA["Values and events"]
    DATA --> BEHAVIOR
```

For example:

- the Core has an I2C controller wired to Port 0: **static hardware**;
- a temperature sensor is assigned to Port 0: **runtime state**;
- when temperature exceeds a threshold, an actuator is commanded: **product
  behavior**.

The same architecture must still work if the example sensor, actuator,
transport, or microcontroller changes.

## Required concepts and optional capabilities

The small central model is generic. Everything product-specific is attached at
its edges.

| Concept | Required? | Meaning | Practical example |
|---|:---:|---|---|
| Core | Yes | Coordinates startup and reports overall state | Initialize the common firmware layers |
| Port | Yes | Represents one physical connector and its capabilities | Port 0 offers I2C |
| Module | Yes | Represents one live peripheral instance | Sensor instance assigned to Port 0 |
| Module driver | Yes | Implements one module type | Read a temperature sensor over I2C |
| Driver Registry | Yes | Finds a compiled driver by type | Resolve `temperature-sensor` to its driver |
| Module Manager | Yes | Owns module instances and lifecycle | Create, read, and remove the instance on Port 0 |
| Config | When configuration exists | Holds validated desired state | Assign a module and a sample interval |
| Data | When values/events exist | Defines values independently of their producer | Temperature with source and timestamp |
| Runtime | When autonomous behavior exists | Applies product rules | If temperature is high, command an actuator |
| Input/output adapter | Optional | Connects the firmware to another interface | USB shell, local UI, REST, MQTT |
| Discovery strategy | Optional | Proposes module identity | Manual assignment, EEPROM, electrical probe |
| Shared-resource coordinator | Optional | Coordinates a real shared resource | A switchable rail used by two Ports |

### Why MQTT is not a core concept

MQTT is one possible **output adapter**. It may be useful when a product must
send values to a remote broker, but the firmware architecture does not depend on
it. A product could instead use USB, Bluetooth, HTTP, a display, a log file, or
no external output at all.

```mermaid
flowchart LR
    DATA["Generic temperature value"]
    LOG["Local logger"]
    USB["USB adapter"]
    UI["Display adapter"]
    NET["Network adapter <br/> MQTT is one example"]

    DATA --> LOG
    DATA --> USB
    DATA --> UI
    DATA --> NET
```

Removing MQTT must not change the sensor driver, Module Manager, Data contract,
or Runtime rules. It removes only one adapter.

### Why Power is not always present

Power coordination is useful only when the hardware exposes a controllable
shared resource—for example, a switchable 3.3 V rail feeding two Ports. If the
board has no controllable rail, there is nothing for a Power component to own.

```mermaid
flowchart LR
    M0["Module on Port 0"] -->|"acquire"| R["Optional shared rail"]
    M1["Module on Port 1"] -->|"acquire"| R
    R -->|"first user: ON <br/> last user: OFF"| HW["Physical power switch"]
```

This is an optional shared-resource pattern, not a requirement that every Core
must implement power management.

## Static hardware and runtime state

This separation is the most important architectural rule.

### Static hardware

Static hardware is physically part of a specific Core and cannot change while
the firmware runs. Zephyr represents it with a board definition and Devicetree.

Examples:

- MCU and memory;
- I2C, SPI, UART, and GPIO controllers;
- pin routing;
- physical Port count;
- a presence pin or controllable rail, if it really exists;
- flash partitions.

### Runtime state

Runtime state can change without rebuilding the firmware.

Examples:

- which module is assigned to Port 0;
- whether that module is ready or in error;
- its current measurements;
- user configuration;
- an active automation rule.

```mermaid
flowchart TB
    subgraph BUILD["Build time"]
        BOARD["Board + Devicetree"]
        STATIC["Port 0 has I2C <br/> SDA and SCL use physical pins"]
        BOARD --> STATIC
    end

    subgraph RUN["Runtime"]
        CONFIG["Configuration"]
        ASSIGN["Port 0 = temperature sensor"]
        STATE["Module is READY <br/> temperature = 24.6 °C"]
        CONFIG --> ASSIGN --> STATE
    end

    STATIC --> ASSIGN
```

The Devicetree describes that Port 0 can access I2C. It must not permanently
claim that a removable temperature sensor is connected there.

## Core

The Core is the startup coordinator. It initializes required components in a
known order and exposes a small overall state such as initializing, ready, or
failed.

It does not implement sensor protocols, decide module types, or contain product
rules.

### Practical example

At boot, Core initializes Port and Module Manager. If Port cannot obtain a
required hardware controller, Core reports failure instead of claiming that the
system is ready.

```mermaid
sequenceDiagram
    participant Main as main()
    participant Core
    participant Port
    participant Manager as Module Manager

    Main->>Core: init()
    Core->>Port: init physical Ports
    Port-->>Core: ready
    Core->>Manager: init empty module state
    Manager-->>Core: ready
    Core-->>Main: READY
```

## Port

A Port represents one physical external-module connection. It hides
board-specific controllers, pins, and Core variants behind capabilities.

A Port answers questions such as:

- does this connector support I2C, SPI, or a digital output?
- is its underlying controller ready?
- which stable bus handle may a driver use?

A Port does not know which removable module is attached and does not implement a
sensor protocol.

### Practical example

The temperature driver asks Port 0 for its I2C controller. On one Core that may
be `i2c0`; on another Core it may be `i2c1`. The driver sees only the Port API.

```mermaid
flowchart LR
    DRIVER["Generic temperature driver"]
    PORT["Port 0 API <br/> capability: I2C"]
    C3["Core variant A <br/> controller i2c0"]
    S3["Core variant B <br/> controller i2c1"]

    DRIVER --> PORT
    PORT --> C3
    PORT --> S3
```

## Module and module driver

A **Module** is one runtime instance. A **module driver** is the reusable
implementation of one module type.

The distinction is the same as an object and its class:

- instance: “temperature sensor on Port 0, address 0x44, currently READY”;
- driver: “code capable of initializing and reading this sensor family.”

Several instances may use the same immutable driver while keeping separate
runtime state.

### Practical example

```mermaid
flowchart TB
    D["One immutable temperature driver <br/> init · read · deinit"]
    M0["Module A <br/> Port 0 · address 0x44"]
    M1["Module B <br/> Port 2 · address 0x45"]

    M0 -. "uses" .-> D
    M1 -. "uses" .-> D
```

The operation table keeps callers generic: the Manager calls `init`, `read`,
`command`, or `deinit` without including a concrete driver implementation.

## Example: lifecycle of a runtime module

The following example follows one INA219 connected to Port 0 from physical
connection to a measurement requested by Runtime. Port 0 is part of the static
Core hardware, while the INA219 type, its I2C address, and the live Module
instance are runtime state. The example uses address `0x40`, the address carried
by this module's validated runtime configuration; it is not a removable INA219
node permanently declared in the Core Devicetree.

```mermaid
sequenceDiagram
    autonumber
    actor User as User / physical event
    participant Config
    participant Discovery
    participant Manager as Module Manager
    participant Registry as Driver Registry
    participant Port as Port 0
    participant Module as spaghetti_module
    participant Driver as INA219 Module Driver
    participant Hardware as INA219 at 0x40
    participant Runtime

    User->>Port: connect INA219 to physical Port 0
    alt Explicit configuration
        Config->>Manager: request type "ina219", Port 0, address 0x40
    else Optional discovery
        Discovery->>Manager: propose type "ina219", Port 0, address 0x40
    end
    Manager->>Registry: find("ina219")
    Registry-->>Manager: &spaghetti_ina219_driver
    Manager->>Port: resolve Port 0 and check required capabilities
    Port-->>Manager: Port exists, READY, I2C supported
    Manager->>Module: create provisional struct spaghetti_module
    Manager->>Driver: driver->ops->init(&module, config, config_size)
    Driver->>Port: spaghetti_port_i2c_device(module->port)
    Port-->>Driver: stable Zephyr I2C device
    Driver->>Hardware: initialize through I2C using address 0x40
    Hardware-->>Driver: success
    Driver-->>Manager: 0
    Manager->>Module: commit state READY
    Runtime->>Manager: spaghetti_module_manager_read(module_id, &sample)
    Manager->>Module: verify that the instance is READY
    Manager->>Driver: module->driver->ops->read(&module, &sample)
    Driver->>Port: obtain and use the Port I2C device
    Driver->>Hardware: read bus voltage, current, and power registers
    Hardware-->>Driver: raw register values
    Driver-->>Manager: spaghetti_sample
    Manager-->>Runtime: spaghetti_sample
```

1. **The physical connection uses Port 0.** The user connects the INA219 to the
   I2C lines exposed by Port 0. The Port represents the connector and the bus
   capability already described for this Core; connecting a module does not
   change Devicetree and, by itself, does not imply automatic discovery.

   See also:

   - [Port](subsys/port/README.md)
   - [Board support](boards/spaghettilab/README.md)

2. **Config or Discovery identifies the requested module.** Config can provide
   the validated assignment explicitly. An optional Discovery strategy can
   instead propose the same normalized information: type `"ina219"`, Port 0,
   and I2C address `0x40`. Discovery identifies a candidate; it does not create
   or own the Module. Only one of these paths is needed for a given request.

   See also:

   - [Config](subsys/config/README.md)
   - [Discovery](subsys/discovery/README.md)

3. **Module Manager receives the request.** The Manager is the lifecycle owner.
   It validates the request, rejects an unavailable or already assigned Port,
   and coordinates lookup, initialization, commit, later reads, and removal.
   No caller creates a live Module directly.

   See also:

   - [Module Manager](subsys/module_manager/README.md)

4. **Driver Registry resolves the type.** The Manager asks for `"ina219"`.
   Registry returns `&spaghetti_ina219_driver`, a pointer to the immutable
   descriptor compiled into the firmware. Registry owns descriptors, not live
   instances; an unknown type makes configuration fail before hardware access.

   See also:

   - [Driver Registry](subsys/driver_registry/README.md)

5. **Module Manager verifies Port capabilities.** The INA219 descriptor requires
   I2C. The Manager resolves Port 0, checks that it is ready, and confirms that
   `SPAGHETTI_PORT_CAP_I2C` is present. This prevents calling an I2C driver on an
   incompatible connector.

   See also:

   - [Port](subsys/port/README.md)
   - [External module drivers](spaghetti_modules/README.md)

6. **Module Manager creates a provisional Module.** It fills one private
   `struct spaghetti_module` slot with its ID, Port pointer, driver pointer,
   initial state, and per-instance context. The Manager owns this structure for
   the whole connection lifetime; Runtime and other callers refer to it by ID
   and do not retain writable pointers to it.

   See also:

   - [Public Module interfaces](include/spaghetti/README.md)
   - [Module Manager](subsys/module_manager/README.md)

7. **The Module Driver initializes the instance.** The Manager calls
   `driver->ops->init(&module, config, config_size)`. The INA219 driver validates
   its configuration, asks the Port for the stable Zephyr I2C device, and uses
   the runtime address `0x40` for the device transaction. It keeps only
   per-instance protocol state in the Module context; it does not own the Port
   or the Zephyr device.

   See also:

   - [External module drivers](spaghetti_modules/README.md)
   - [Port](subsys/port/README.md)

8. **The Module becomes READY only after successful initialization.** When
   `init()` returns `0`, the Manager commits the provisional slot and publishes
   its ID in state `SPAGHETTI_MODULE_READY`. If initialization fails, it discards
   the provisional instance and leaves Port 0 available instead of exposing a
   half-initialized Module.

   See also:

   - [Module Manager](subsys/module_manager/README.md)
   - [Public Module interfaces](include/spaghetti/README.md)

9. **Runtime requests one reading through Module Manager.** Runtime schedules
   the product behavior and calls
   `spaghetti_module_manager_read(module_id, &sample)`. It knows the Module ID
   and the generic sample contract, but it does not know INA219 registers or
   which Zephyr I2C controller is behind Port 0.

   See also:

   - [Runtime](subsys/runtime/README.md)
   - [Module Manager](subsys/module_manager/README.md)

10. **The driver reads through Port and returns a generic sample.** The Manager
    verifies that the instance is READY, then calls
    `module->driver->ops->read(&module, &sample)`. The INA219 driver obtains the
    I2C device from `module->port`, reads bus voltage, current, and power, and
    converts the result into `struct spaghetti_sample`. The sample returns
    through the Manager to Runtime and can then enter the generic Data path;
    hardware-specific register details do not escape the driver.

    See also:

    - [External module drivers](spaghetti_modules/README.md)
    - [Port](subsys/port/README.md)
    - [Data](subsys/data/README.md)
    - [Runtime](subsys/runtime/README.md)

## Driver Registry and Module Manager

The Registry and Manager have different jobs:

- **Driver Registry:** owns no live module; it maps a type identifier to an
  immutable driver descriptor compiled into the firmware.
- **Module Manager:** owns every live module instance, its state, its Port
  assignment, and all lifecycle transitions.

### Practical example: assign a module

```mermaid
sequenceDiagram
    participant Caller
    participant Manager as Module Manager
    participant Port
    participant Registry as Driver Registry
    participant Driver as Module driver

    Caller->>Manager: configure Port 0 as "temperature-sensor"
    Manager->>Port: get Port 0 and capabilities
    Port-->>Manager: I2C available
    Manager->>Registry: find "temperature-sensor"
    Registry-->>Manager: immutable descriptor
    Manager->>Driver: init new instance
    alt initialization succeeds
        Driver-->>Manager: OK
        Manager-->>Caller: module ID, READY
    else initialization fails
        Driver-->>Manager: error
        Manager->>Manager: discard provisional instance
        Manager-->>Caller: error, Port remains free
    end
```

Only the Manager may create, replace, or destroy module instances. This makes
rollback and ownership predictable.

## Config

Config represents the **desired state** after validation. It is independent of
how configuration arrives and how it is stored.

Possible sources include:

- a compiled default;
- a local command;
- a file or flash record;
- a network request.

Those sources must all produce the same internal Config model.

### Practical example

A request asks for a temperature sensor on Port 0 with a 1000 ms sample period.
Config first validates the complete request. Only then does it ask the Manager
to apply the assignment. Invalid input must not leave half-applied live state.

```mermaid
flowchart LR
    SOURCE["Any input source"]
    VALIDATE["Validate complete Config"]
    APPLY["Apply desired state"]
    LIVE["Manager-owned live state"]
    ERROR["Reject with no partial change"]

    SOURCE --> VALIDATE
    VALIDATE -->|"valid"| APPLY --> LIVE
    VALIDATE -->|"invalid"| ERROR
```

Persistence is optional. If configuration must survive reboot, a storage adapter
saves and restores the same Config model; persistence rules do not belong in
module drivers.

## Data

Data defines application-level values and events independently of a specific
driver or output protocol.

A useful measurement contains enough context to stand on its own:

- source module ID;
- value and unit or fixed representation;
- timestamp;
- sequence number;
- validity or quality flags.

### Practical example

The sensor driver returns a raw result. The application turns it into a generic
temperature value. A logger, a local display, and an optional network adapter
can consume the same value without knowing how the sensor speaks I2C.

```mermaid
flowchart LR
    SENSOR["Module driver <br/> raw sensor result"]
    VALUE["Data <br/> temperature, source, time"]
    LOG["Logger"]
    RULE["Runtime rule"]
    OUTPUT["Optional output adapter"]

    SENSOR --> VALUE
    VALUE --> LOG
    VALUE --> RULE
    VALUE --> OUTPUT
```

Data is not a database and does not decide product behavior.

## Runtime

Runtime owns autonomous product behavior: when something should be sampled and
how values should cause actions. It depends on generic Module Manager and Data
contracts, not on a concrete sensor implementation.

### Practical example

Every second, Runtime requests a value from one module. When the temperature is
above 25 °C, it commands another module.

```mermaid
sequenceDiagram
    participant Timer
    participant Runtime
    participant Manager as Module Manager
    participant Sensor
    participant Data
    participant Actuator

    Timer-->>Runtime: wake-up signal
    Runtime->>Manager: read sensor module
    Manager->>Sensor: read()
    Sensor-->>Manager: 26.2 °C
    Manager-->>Runtime: normalized sample
    Runtime->>Data: publish sample
    Runtime->>Manager: command actuator ON
    Manager->>Actuator: command(ON)
```

The timer callback only wakes Runtime. Blocking bus access and rule evaluation
run in thread context.

## Input and output adapters

Adapters translate between the generic firmware contracts and an external
interface. They must remain replaceable.

### Input adapter example

A USB command and a network request may both ask for the same assignment. Each
adapter parses its transport format and produces the same Config request.

```mermaid
flowchart LR
    USB["USB command"] --> ADAPTER1["USB adapter"]
    NET["Network request"] --> ADAPTER2["Network adapter"]
    ADAPTER1 --> CONFIG["Same Config contract"]
    ADAPTER2 --> CONFIG
```

### Output adapter example

A Data value may be formatted for a serial console, a display, or a network
protocol. MQTT belongs here if the product chooses it.

An adapter does not own modules, modify Manager internals, or define the common
Data representation.

## Discovery strategies

Discovery is optional. It answers one question: “what module identity is being
proposed for this Port?” It does not create the module itself.

Possible strategies include:

- manual assignment from configuration;
- reading an identity memory;
- a verified electrical detection method;
- no discovery at all.

### Practical example

```mermaid
flowchart LR
    MANUAL["Manual assignment"]
    MEMORY["Identity memory"]
    PROBE["Hardware-specific probe"]
    RESULT["Normalized proposal <br/> Port + type + config"]
    MANAGER["Module Manager"]

    MANUAL --> RESULT
    MEMORY --> RESULT
    PROBE --> RESULT
    RESULT -->|"after policy and validation"| MANAGER
```

The Manager must not care which strategy produced the proposal.

## Choosing calls, queues, and publish/subscribe

Use the simplest mechanism that satisfies the real behavior.

| Need | Mechanism | Practical example |
|---|---|---|
| Immediate result or error | Direct call | Manager asks a driver to initialize |
| Protect short shared state | Mutex | Serialize one Port transaction |
| Wake a worker without doing work in a callback | Semaphore or work item | Timer wakes Runtime |
| Preserve ordered commands with bounded capacity | Message queue | Queue actuator commands |
| Send one value to several independent consumers | Publish/subscribe | Temperature reaches logger and UI |

```mermaid
flowchart TB
    CONTROL["Control operation <br/> needs success or error"]
    DIRECT["DIRECT CALL"]
    EVENT["One event, one worker"]
    QUEUE["SEMAPHORE / WORK / MESSAGE QUEUE"]
    VALUE["One value, several consumers"]
    PUBSUB["PUBLISH / SUBSCRIBE"]

    CONTROL --> DIRECT
    EVENT --> QUEUE
    VALUE --> PUBSUB
```

Do not introduce asynchronous messaging merely to make components look
decoupled. A queue adds capacity limits, overflow policy, memory use, and more
states to debug.

## Execution-context rules

- **Thread:** may perform bounded blocking work such as I2C access.
- **Timer callback:** signals work and returns; it does not access a sensor.
- **ISR:** captures the hardware event, signals deferred work, and returns.
- **Workqueue:** performs deferred work that is short enough for the selected
  queue; long-lived state machines deserve a dedicated thread.

### Practical example

```mermaid
sequenceDiagram
    participant IRQ as Hardware ISR
    participant Worker as Worker thread
    participant Driver

    IRQ->>Worker: signal event, non-blocking
    IRQ-->>IRQ: return immediately
    Worker->>Driver: perform blocking bus transaction
    Driver-->>Worker: result
```

## Supporting multiple Core variants

Board definitions and Devicetree absorb physical differences. Higher layers
query Port capabilities instead of branching on MCU or board names.

```mermaid
flowchart LR
    A["Core variant A <br/> 2 I2C Ports"]
    B["Core variant B <br/> 1 SPI + 3 I2C Ports"]
    C["Future Core variant"]
    PORT["Same Port contract"]
    COMMON["Same Manager, drivers, Data, Runtime"]

    A --> PORT
    B --> PORT
    C --> PORT
    PORT --> COMMON
```

Adding a new Core variant should primarily add static board description. It
should not add `if (board == ...)` branches to Module Manager or Runtime.

## End-to-end example

This example combines the pieces without making any concrete technology a
requirement.

```mermaid
sequenceDiagram
    autonumber
    participant Input as Optional input adapter
    participant Config
    participant Manager as Module Manager
    participant Registry as Driver Registry
    participant Sensor as Sensor driver
    participant Port
    participant Runtime
    participant Data
    participant Output as Optional output adapter
    participant Actuator as Actuator driver

    Input->>Config: assign sensor to Port 0
    Config->>Config: validate complete desired state
    Config->>Manager: apply assignment
    Manager->>Registry: find sensor driver
    Registry-->>Manager: immutable descriptor
    Manager->>Sensor: initialize instance
    Sensor->>Port: use required bus
    Runtime->>Manager: read sensor instance
    Manager->>Sensor: read()
    Sensor-->>Runtime: value
    Runtime->>Data: publish generic measurement
    Data-->>Output: optional delivery
    Runtime->>Manager: command actuator if rule matches
    Manager->>Actuator: command()
```

Replace the sensor, actuator, input transport, output transport, or Core board:
the central ownership and data flow stay the same.

## Architectural rules

1. Describe physical Core hardware at build time; represent removable modules
   at runtime.
2. Keep board details below the Port contract.
3. Let Module Manager be the sole owner of live module instances.
4. Keep driver descriptors immutable and runtime state per instance.
5. Validate desired Config completely before changing live state.
6. Keep Data independent of concrete drivers and transports.
7. Keep product rules in Runtime, not inside drivers or adapters.
8. Treat discovery, persistence, networking, and shared-resource coordination as
   optional capabilities.
9. Prefer direct calls until real concurrency requires a queue or pub/sub.
10. Never perform blocking work in ISR or timer callback context.

## Detailed component documentation

- [Public interfaces](include/spaghetti/README.md)
- [Board support](boards/spaghettilab/README.md)
- [Devicetree bindings](dts/bindings/spaghetti/README.md)
- [Core](subsys/core/README.md)
- [Port](subsys/port/README.md)
- [Driver Registry](subsys/driver_registry/README.md)
- [Module Manager](subsys/module_manager/README.md)
- [Config](subsys/config/README.md)
- [Data](subsys/data/README.md)
- [Runtime](subsys/runtime/README.md)
- [Communication adapters](subsys/communication/README.md)
- [External module drivers](spaghetti_modules/README.md)
