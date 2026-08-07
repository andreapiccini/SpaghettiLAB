# External Spaghetti Module Implementations

## 1. Purpose

Each child directory implements one external module type using the common
`spaghetti_module_driver` contract. The external hardware does not run Zephyr;
its implementation executes on the Core.

## 2. Responsibility

- Translate generic lifecycle/read/command operations into module protocol.
- Declare required Port capabilities and offered data/command channels.
- Keep per-instance hardware state in Manager-provided context.

## 3. Non-responsibility

No instance ownership, port assignment, discovery policy, periodic scheduling,
Runtime rules, MQTT, or board pin mapping.

## 4. Files

- `sht40/README.md`: conceptual environmental-sensor plan.
- `relay/README.md`: conceptual actuator plan.
- Future implementation/header/build files are created only at their milestone.
- Shared public contracts are documented in `include/spaghetti/README.md`.

## 5. Data structures to implement

- immutable driver descriptor: created by module implementation at build time,
  owned by it for firmware lifetime, read by Registry/Manager.
- per-instance context: storage created/owned by Manager, initialized and modified
  through the driver, destroyed/released by Manager after driver deinit.
- channel/command descriptors: immutable and driver-owned.

## 6. Functions to implement

### Driver `init` / `deinit`

- **Purpose:** transition one Manager-owned instance into/out of usable state.
- **Called by:** Module Manager on configure/remove/rollback.
- **Trigger/mechanism/context:** lifecycle; DIRECT CALL; Manager/caller thread.
- **Inputs:** instance context, Port handle, validated module config.
- **Outputs:** status.
- **State modified:** per-instance context/hardware state.
- **Failure cases:** incompatible port, device absent, bus/power timeout.
- **Called next:** Port/Power by DIRECT CALL.

### Driver `read` / `command` / `configure`

- **Purpose:** perform one supported operation without choosing when it runs.
- **Called by:** Module Manager routing a Runtime/Communication request.
- **Trigger/mechanism/context:** timer/user command/config update; DIRECT CALL;
  thread context.
- **Inputs:** instance, channel/command/config, timeout.
- **Outputs:** normalized result/error; Data publication ownership is decided by
  the Manager/Data contract.
- **State modified:** private context/device state.
- **Failure cases:** unsupported, not ready, invalid input, I/O/timeout.
- **Called next:** Port API then Zephyr peripheral API.

## 7. Interaction diagram

```text
Runtime module instance
        |
        | DIRECT CALL through operation table
        v
spaghetti_module_driver
        |
        v
specific implementation
        |
        | DIRECT CALL
        v
Port abstraction -> Zephyr peripheral API
```

## 8. State / lifecycle

Driver observes Manager lifecycle: uninitialized -> initialized/ready -> error or
deinitialized. Manager owns authoritative state.

## 9. Concurrency considerations

No per-module thread by default. Manager/Port must define serialization. Driver
operations remain synchronous initially. Interrupt-driven modules may use an ISR
that only captures/signals, then WORKQUEUE/THREAD processing. Never publish a
borrowed stack buffer asynchronously.

## 10. Zephyr concepts involved

I2C/SPI/GPIO APIs operate through static Zephyr devices selected by Port.
Devicetree describes Core wiring, not removable identity. Kconfig later selects
which module implementations are compiled. Logging gets a per-driver module.

## 11. Implementation steps

1. Start with a fake driver and freeze minimal operation contract.
2. Declare exact Port capability requirements.
3. Implement synchronous init/read or command.
4. Normalize errors and data.
5. Test absent/malformed hardware.
6. Add asynchronous behavior only when hardware requires it.

## 12. Expected result

Adding one module type does not modify Runtime, Manager, Discovery, or Port API.

## 13. Minimal test

Invoke a fake driver through the same operation table used by the real driver.

## 14. Dependencies

Module/Module Driver contracts and Port; Manager integration follows.

## 15. Not yet

No top-level Zephyr `modules/` directory, dynamic plugins, or one thread per driver.

| Function | Called by | Trigger | Mechanism | Execution context | Calls |
|---|---|---|---|---|---|
| driver `init` | Module Manager | configure | DIRECT CALL | Manager/caller thread | Port/Power |
| driver `deinit` | Module Manager | remove/rollback | DIRECT CALL | Manager/caller thread | Port/Power |
| driver `read` | Module Manager | acquisition request | DIRECT CALL | Runtime/Manager thread | Port/peripheral API |
| driver `command` | Module Manager | actuator action | DIRECT CALL | Runtime/Manager thread | Port/peripheral API |
| driver `configure` | Module Manager | config update | DIRECT CALL | Manager thread | Port/peripheral API |
