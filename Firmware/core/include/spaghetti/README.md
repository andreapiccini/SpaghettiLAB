# Spaghetti LAB Public Interfaces

[← Project README](../../README.md) · [Architecture](../../ARCHITECTURE.md)

> [!NOTE]
> This is a design contract. See the roadmap for current implementation status.

## Purpose

This directory contains public contracts shared across architecture components.
Headers should reveal what a subsystem guarantees, not its private storage or
Zephyr backend details.

## Responsibility

- Stable names, opaque handles, value types, operation contracts, error semantics.
- Clear ownership, lifetime, mutability, timeout, and execution-context rules.
- Minimal includes and forward declarations where practical.

## Non-responsibility

No implementation, global mutable storage, board pin mappings, private Zephyr
thread objects, or concrete module-driver internals.

## Files

| Header | Contract | Detailed documentation |
|---|---|---|
| `core.h` | Core boot/info/state | [Core](../../subsys/core/README.md) |
| `port.h` | physical Port abstraction | [Port](../../subsys/port/README.md) |
| `module.h` | runtime module instance model | this README and Manager docs |
| `module_driver.h` | concrete module operation table | this README and module docs |
| `module_manager.h` | instance lifecycle/query/operations | [Module Manager](../../subsys/module_manager/README.md) |
| `discovery.h` | provider/policy/result contract | [Discovery](../../subsys/discovery/README.md) |
| `driver_registry.h` | known-driver lookup | [Driver Registry](../../subsys/driver_registry/README.md) |
| `data.h` | normalized value/event contract | [Data](../../subsys/data/README.md) |
| `runtime.h` | user-program execution contract | [Runtime](../../subsys/runtime/README.md) |
| `config.h` | desired-state snapshot/update | [Config](../../subsys/config/README.md) |
| `communication.h` | external protocol boundary | [Communication](../../subsys/communication/README.md) |
| `power.h` | power resource/transition contract | [Power](../../subsys/power/README.md) |

## Data structures to implement

### `spaghetti_module`

Created, owned, modified, and destroyed by Module Manager. Runtime,
Communication, and drivers receive a stable ID, snapshot, or controlled reference.
It represents an instance, not a module type or implementation.

### `spaghetti_module_driver`

Created by a concrete implementation with static lifetime; owned there; registered
and read by Registry/Manager; never modified after boot. It identifies a module
type, requirements, context needs, and operation callbacks.

### Public value objects

IDs, capabilities, results, Config snapshots, and Data messages should be copied
where bounded. Opaque objects hide private mutexes, queues, and Zephyr devices.

## Functions to implement

Functions are documented with caller, trigger, mechanism, context, state, errors,
and downstream calls in their owning subsystem README. Headers should add concise
API comments with those guarantees when implementation begins; they must not
duplicate private algorithms.

## Interaction diagram

```text
Caller --DIRECT CALL / documented async mechanism--> Public header contract
                                                        |
                                                        v
                                                owning subsystem `.c`
```

## State / lifecycle

Opaque object lifecycle is owned by its subsystem. Public callers must not retain
references beyond the documented generation/lifetime.

## Concurrency considerations

Every API must state thread-only versus ISR-safe, blocking/timeout behavior, and
whether it copies or borrows input. Default assumption: thread context, not ISR;
normal DIRECT CALL; no hidden asynchronous execution.

## Zephyr concepts involved

Zephyr APIs commonly return negative `errno` values. Kernel object types should
remain private unless callers truly operate them. Kconfig gates optional APIs at
build time; Devicetree-generated hardware belongs behind Core/Port.

## Implementation steps

1. Define ownership and failure semantics before fields.
2. Add the smallest value/opaque types required by the current milestone.
3. Add one function contract at a time.
4. Keep implementation-only structures in `.c` or private headers.
5. Compile/test all callers before extending the contract.

## Expected result

Subsystems can evolve internally without forcing unrelated callers to know
Zephyr backend or board details.

## Minimal test

Compile a fake consumer using only public headers and verify no private type is
required for its supported operation.

## Dependencies

Each header should depend only on smaller shared contracts needed in declarations.
Avoid cyclic includes through forward declarations and IDs.

## Not yet

No speculative universal API, ABI promise, heap ownership ambiguity, or generated
hardware contents.

| Contract family | Called by | Trigger | Mechanism | Execution context | Calls |
|---|---|---|---|---|---|
| lifecycle APIs | Core/Manager | boot/config/remove | DIRECT CALL | thread | owning subsystem |
| query APIs | Runtime/Communication/tests | query | DIRECT CALL | caller thread | snapshot only |
| Data/event APIs | producers/consumers | value/event | ZBUS/MSGQ TBD | documented per API | Data transport |
| callback/provider APIs | Zephyr/adapters | hardware/network result | CALLBACK then deferred work | callback/worker | owning subsystem |
