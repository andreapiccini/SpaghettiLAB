# SHT40 Module

[← Project README](../../README.md) · [Architecture](../../ARCHITECTURE.md) · [Roadmap](../../IMPLEMENTATION_ROADMAP.md)

> [!NOTE]
> This is a design contract. See the roadmap for current implementation status.

## Purpose

This future implementation controls an external SHT40-class environmental module
through a compatible Spaghetti Port and exposes temperature and humidity.

## Responsibility

Validate required bus capability, initialize per-instance context, perform the
documented sensor transaction, validate/convert response, and produce normalized
temperature/humidity values.

## Non-responsibility

No port assignment, discovery claim, periodic scheduling, threshold automation,
MQTT publish, real GPIO mapping, or assumption that the device is always present.

## Files

Only this implementation plan exists. Future source/header files remain local;
the public generic contract stays in `include/spaghetti/module_driver.h`.

## Data structures to implement

- immutable SHT40 driver descriptor: static lifetime, owned here, read by Registry.
- per-instance SHT40 context: Manager-provided storage; contains only protocol
  state/configuration required by the real datasheet; modified by this driver.
- channel descriptors for temperature and humidity: immutable, driver-owned.
- sample result: caller/Data-owned value with both channels or explicit partial
  validity, depending on the final Data contract.

## Functions to implement

### SHT40 `init`

- **Purpose:** verify compatible Port/bus and establish a ready context.
- **Called by:** Module Manager.
- **Trigger/mechanism/context:** accepted `Port = SHT40`; DIRECT CALL; Manager
  thread/caller, never ISR.
- **Inputs:** instance context, Port handle, validated options.
- **Outputs:** ready/error.
- **State modified:** SHT40 private context.
- **Failure cases:** no I2C capability, bus unavailable, absent/invalid response.
- **Called next:** Port acquire/I2C operation by DIRECT CALL if verification is
  part of init.

### SHT40 `read`

- **Purpose:** acquire temperature and humidity on demand.
- **Called by:** Module Manager for Runtime/diagnostic request.
- **Trigger/mechanism/context:** periodic timer reaches Runtime, then DIRECT CALL;
  executes in Runtime/Manager thread and may block only for bounded sensor timing.
- **Inputs:** instance/context, requested channel(s), timeout.
- **Outputs:** normalized sample or precise error.
- **State modified:** last diagnostic/sequence, not global Data ownership.
- **Failure cases:** bus timeout/NACK, checksum/protocol error, not ready.
- **Called next:** Port -> Zephyr I2C by DIRECT CALL; result then Data publish by
  Manager/acquisition layer.

### SHT40 `deinit`

- **Purpose:** cancel/clear instance state before removal.
- **Called by:** Module Manager.
- **Trigger/mechanism/context:** remove/replace/rollback; DIRECT CALL; thread.
- **Inputs/outputs:** context; status.
- **State modified:** context becomes inactive.
- **Failure cases:** operation in progress or bus cleanup failure if applicable.
- **Called next:** Port/Power release.

## Interaction diagram

```text
Timer --deferred event--> Runtime
Runtime --DIRECT CALL--> Manager --DIRECT CALL--> SHT40 read
SHT40 --DIRECT CALL--> Port --DIRECT CALL--> Zephyr I2C
SHT40 result --DIRECT CALL--> Data publish
Data --ZBUS/MSGQ TBD--> Runtime + MQTT + Communication
```

## State / lifecycle

Manager authoritative state: allocated -> initializing -> ready -> reading ->
ready/error -> deinitializing -> removed.

## Concurrency considerations

Start with synchronous direct reads because the sensor transaction is bounded and
one caller is simpler. Do not add a driver thread. Port/Manager serializes reads
and removal. zbus is useful only after the completed sample reaches Data and has
multiple consumers; using zbus inside the driver would blur ownership.

## Zephyr concepts involved

Zephyr I2C controller API performs bus transfers through a static controller
device. A mutex may protect a multi-step transaction. `k_sleep` in a driver call
blocks its thread, so use only bounded datasheet-required delays; delayed work is
an alternative if latency later proves harmful.

## Implementation steps

1. Read the exact module schematic and SHT40 datasheet.
2. State I2C Port capability requirement without pin/address invention.
3. Implement and test protocol conversion as pure functions.
4. Implement synchronous transaction through fake Port.
5. Test real init/read with temperature and humidity.
6. Test absent device, bad response, timeout, removal.
7. Connect completed sample to Data.

## Expected result

An assigned SHT40 returns valid temperature/humidity on request and reports
deterministic errors when missing or faulty.

## Minimal test

One explicit read on known hardware; log both channels, then disconnect and verify
the expected error without crash or stuck bus.

## Dependencies

Module Driver contract, Port I2C capability, Registry/Manager for runtime use,
Data for distribution.

## Not yet

No guessed address/pins/timing, periodic thread, zbus channel owned by driver,
MQTT formatting, or auto-discovery claim.

| Function | Called by | Trigger | Mechanism | Execution context | Calls |
|---|---|---|---|---|---|
| SHT40 `init` | Module Manager | assignment | DIRECT CALL | Manager/caller thread | Port/I2C |
| SHT40 `read` | Module Manager | Runtime timer/user read | DIRECT CALL | Runtime/Manager thread | Port/I2C, then Data path |
| SHT40 `deinit` | Module Manager | remove/rollback | DIRECT CALL | Manager/caller thread | Port/Power release |
