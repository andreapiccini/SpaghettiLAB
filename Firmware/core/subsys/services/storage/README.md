# Storage Service

[← Project README](../../../README.md) · [Architecture](../../../ARCHITECTURE.md)

> [!NOTE]
> This is a design contract. See the roadmap for current implementation status.

## Purpose

Storage hides the selected persistent backend so Config owns schema/meaning while
Storage owns reliable byte/key operations and backend errors.

## Responsibility

Backend initialization, bounded read/write/delete, integrity/commit semantics,
serialization, capacity/error reporting, and flash-partition access.

## Non-responsibility

No Spaghetti configuration schema, module lifecycle, measurement retention policy,
or board partition invention.

## Files

Only this design README exists. Future source/header and Kconfig integration are
added with the Config milestone. Static storage partition belongs to board DTS.

## Data structures to implement

- storage key/blob view: caller-owned for synchronous call; Storage copies when
  asynchronous.
- backend context: created/owned/destroyed by Storage for firmware lifetime.
- status/capacity statistics: Storage-owned, read as snapshots.
- commit metadata/version/checksum only where the selected backend requires it.

## Functions to implement

### `spaghetti_storage_init()`

- **Purpose:** initialize selected backend and verify partition/readiness.
- **Called by:** Core before Config load.
- **Trigger/mechanism/context:** boot; DIRECT CALL; main thread.
- **Inputs:** build-time backend and static partition.
- **Outputs:** status/capacity.
- **State modified:** backend context.
- **Failure cases:** missing partition, corrupt backend, flash device unavailable.
- **Called next:** Zephyr Settings/NVS/ZMS initialization.

### `spaghetti_storage_read()`

- **Purpose:** retrieve a bounded record without exposing backend API.
- **Called by:** Config.
- **Trigger/mechanism/context:** boot/query; DIRECT CALL; caller thread.
- **Inputs:** key, destination, capacity.
- **Outputs:** length/status.
- **State modified:** statistics only.
- **Failure cases:** absent, corrupt, destination too small, backend I/O.
- **Called next:** Settings/backend read.

### `spaghetti_storage_write()`

- **Purpose:** commit one bounded record with documented atomicity.
- **Called by:** Config.
- **Trigger/mechanism/context:** validated config update; DIRECT CALL; thread;
  serialization by Storage mutex or owner thread is DECISION REQUIRED.
- **Inputs:** key, bytes, length/version.
- **Outputs:** committed/error result.
- **State modified:** persistent store/statistics.
- **Failure cases:** full/wear/I/O/invalid key/power-loss recovery.
- **Called next:** Settings/backend save.

### `spaghetti_storage_delete()` / `_get_status()`

- **Purpose:** explicit removal and diagnostics.
- **Called by:** Config/reset and Communication/tests.
- **Trigger/mechanism/context:** reset/query; DIRECT CALL; caller thread.
- **Inputs:** key or output snapshot.
- **Outputs:** status.
- **State modified:** persistent record for delete; none for status.
- **Failure cases:** absent key, I/O, invalid output.
- **Called next:** backend delete/status.

## Interaction diagram

```text
Board DTS --build-time--> flash partition
Core --DIRECT CALL--> Storage init --> Zephyr Settings/backend
Config --DIRECT CALL read/write--> Storage --> Settings/NVS/ZMS/flash
```

## State / lifecycle

```text
UNINITIALIZED -> MOUNTING -> READY <-> WRITING
                       +-> RECOVERY/ERROR
```

## Concurrency considerations

Start with synchronous serialized calls because configuration writes are rare.
Use a mutex if multiple callers are later allowed. Do not write flash from ISR or
timer callback. A storage thread is justified only if measured write latency must
not block its caller.

## Zephyr concepts involved

Settings is Zephyr's persistent key/value facade; NVS/ZMS are flash backends;
flash map exposes fixed partitions described in Devicetree. Kconfig selects the
compiled backend. Settings load can invoke registered callbacks.

## Implementation steps

1. Define key/size/error contract.
2. Add a real static storage partition only from known hardware layout.
3. Initialize one Zephyr backend.
4. Implement read/write/delete.
5. Test reboot and power-loss/corruption behavior supported by backend.
6. Add capacity/wear diagnostics.

## Expected result

A versioned record survives reboot; absence/corruption/full storage are distinct
observable failures.

## Minimal test

Write a counter, reboot, read/increment; test missing key and undersized buffer.

## Dependencies

Known board flash layout and chosen Zephyr storage backend; Config consumes it.

## Not yet

No invented partition, database, measurement history, filesystem, or OTA image.

| Function | Called by | Trigger | Mechanism | Execution context | Calls |
|---|---|---|---|---|---|
| `spaghetti_storage_init` | Core | boot | DIRECT CALL | main thread | Settings/backend init |
| `spaghetti_storage_read` | Config | load/query | DIRECT CALL | caller thread | backend read |
| `spaghetti_storage_write` | Config | validated update | DIRECT CALL | caller thread | backend save |
| `spaghetti_storage_delete` | Config | reset | DIRECT CALL | caller thread | backend delete |
| `spaghetti_storage_get_status` | Communication | diagnostics | DIRECT CALL | caller thread | backend status |
