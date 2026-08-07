# Driver Registry

[← Project README](../../README.md) · [Architecture](../../ARCHITECTURE.md) · [Roadmap](../../IMPLEMENTATION_ROADMAP.md)

> [!NOTE]
> This is a design contract. See the roadmap for current implementation status.

## Purpose

Driver Registry maps a stable module type such as `sht40` to the immutable
module-driver implementation compiled into the firmware.

## Responsibility

Own the searchable collection, validate descriptors/duplicates, and enumerate
supported module types.

## Non-responsibility

It creates no module instance, touches no port, performs no discovery, and calls
no driver lifecycle operation.

## Files

- Public API: `include/spaghetti/driver_registry.h`.
- Implementation: `subsys/driver_registry/driver_registry.c`.
- Driver descriptors originate in `spaghetti_modules/<module>/`.

## Data structures to implement

- registry table/index: created during boot, owned by Registry for firmware
  lifetime, modified only during initialization, read by Manager/Communication.
- driver descriptor references: objects remain owned by concrete drivers and
  must have static lifetime.

## Functions to implement

### `spaghetti_driver_registry_init()`

- **Purpose:** construct/validate the known-driver collection.
- **Called by:** Core before Module Manager becomes usable.
- **Trigger/mechanism/context:** boot; DIRECT CALL; main thread.
- **Inputs:** explicit descriptor array initially.
- **Outputs:** status.
- **State modified:** Registry index.
- **Failure cases:** duplicate/empty ID, invalid operation table, capacity limit.
- **Called next:** validation only; no driver init.

### `spaghetti_driver_registry_find()`

- **Purpose:** resolve module type to descriptor.
- **Called by:** Module Manager; Communication for capability queries.
- **Trigger/mechanism/context:** configure/query; DIRECT CALL; caller thread.
- **Inputs:** stable type identifier.
- **Outputs:** const descriptor or not-found error.
- **State modified:** none.
- **Failure cases:** invalid ID, registry unavailable, unknown type.
- **Called next:** none; caller decides whether to invoke driver.

### `spaghetti_driver_registry_count()` / `_get()`

- **Purpose:** enumerate firmware-supported module types.
- **Called by:** Communication and tests.
- **Trigger/mechanism/context:** query; DIRECT CALL; caller thread.
- **Inputs:** index for `_get`.
- **Outputs:** count/const descriptor.
- **State modified:** none.
- **Failure cases:** invalid index.
- **Called next:** none.

## Interaction diagram

```text
Module implementation --BOOT REGISTRATION--> Registry
Manager --DIRECT CALL find("sht40")--> Registry --const pointer--> Manager
```

## State / lifecycle

```text
EMPTY -> INITIALIZING -> FROZEN/READY
                    +-> INVALID
```

## Concurrency considerations

Freeze after boot so lookup needs no mutex. OPTION A: explicit descriptor array,
simple and debuggable. OPTION B: Zephyr iterable sections, convenient at scale
but more link-time magic. RECOMMENDATION: explicit array first.

## Zephyr concepts involved

No kernel primitive is needed for an immutable registry. Iterable sections are
a future Zephyr linker feature, not a requirement. Kconfig will later determine
which drivers are compiled.

## Implementation steps

1. Define stable type-ID rules.
2. Validate one fake descriptor.
3. Implement linear lookup.
4. Detect duplicates.
5. Add enumeration.
6. Optimize only after measurement.

## Expected result

Known IDs resolve predictably; unknown and duplicate IDs fail explicitly.

## Minimal test

Register two fake descriptors and test find, unknown, enumeration, duplicate.

## Dependencies

`module_driver.h` contract.

## Not yet

No dynamic loading, hash table, driver initialization, or runtime registration.

| Function | Called by | Trigger | Mechanism | Execution context | Calls |
|---|---|---|---|---|---|
| `spaghetti_driver_registry_init` | Core | boot | DIRECT CALL | main thread | descriptor validation |
| `spaghetti_driver_registry_find` | Manager | module configuration | DIRECT CALL | caller thread | none |
| `spaghetti_driver_registry_count` | Communication | capability query | DIRECT CALL | caller thread | none |
| `spaghetti_driver_registry_get` | Communication/tests | enumeration | DIRECT CALL | caller thread | none |
