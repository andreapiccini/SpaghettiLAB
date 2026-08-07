# Module Manager

## 1. Purpose

Module Manager turns a normalized assignment into a live module instance and is
the single owner of instance lifecycle.

## 2. Responsibility

Create, configure, initialize, replace, query, and remove instances; associate
port and driver; perform validation and rollback; publish lifecycle status.

## 3. Non-responsibility

It does not identify modules, implement drivers, own persistent Config, or encode
PC/MQTT protocols.

## 4. Files

- Public API: `include/spaghetti/module_manager.h`.
- Shared model: `include/spaghetti/module.h` and driver contract
  `include/spaghetti/module_driver.h`.
- Implementation: `subsys/module_manager/module_manager.c`.

## 5. Data structures to implement

- `spaghetti_module`: created/destroyed and exclusively modified by Manager;
  drivers/Runtime/Communication get validated read-only references or IDs.
- fixed module pool and port-to-instance mapping: Manager-owned for firmware
  lifetime.
- lifecycle request/result: value objects owned by caller during synchronous call
  or copied into a future command queue.
- per-instance private driver context: storage allocated by Manager under size and
  alignment rules declared by driver; initialized by driver, released by Manager.

## 6. Functions to implement

### `spaghetti_module_manager_init()`

- **Purpose:** initialize pool/mappings and validate dependencies.
- **Called by:** Core.
- **Trigger/mechanism/context:** boot; DIRECT CALL; main thread.
- **Inputs:** Port catalog and Driver Registry access.
- **Outputs:** status.
- **State modified:** all Manager-owned tables.
- **Failure cases:** invalid capacity/dependency.
- **Called next:** no driver lifecycle operation yet.

### `spaghetti_module_manager_configure()`

- **Purpose:** apply module type/configuration to one port transactionally.
- **Called by:** Discovery; tests; possibly Config reconciliation.
- **Trigger:** accepted assignment.
- **Invocation mechanism:** DIRECT CALL initially; MESSAGE QUEUE is an option when
  multiple asynchronous producers exist.
- **Execution context:** caller thread initially; dedicated Manager worker if
  command queue is adopted; never ISR.
- **Inputs:** port ID, type ID, configuration, revision.
- **Outputs:** instance ID/status.
- **State modified:** pool, mapping, instance lifecycle.
- **Failure cases:** missing port/driver, incompatible capability, busy, no slot,
  driver init failure; rollback must leave a coherent prior/empty state.
- **Called next:** Port capability query, Registry find, driver `init`, all DIRECT
  CALLS.

### `spaghetti_module_manager_remove()`

- **Purpose:** stop/deinitialize an instance and free its association.
- **Called by:** Discovery invalidation, Communication, Config reconciliation.
- **Trigger/mechanism/context:** removal/replacement; DIRECT CALL or same Manager
  MESSAGE QUEUE; thread context.
- **Inputs:** instance or port ID and expected revision.
- **Outputs:** status.
- **State modified:** state/mapping/pool.
- **Failure cases:** unknown/stale/busy instance, deinit failure.
- **Called next:** driver `deinit`, Port/Power release by DIRECT CALL.

### `spaghetti_module_manager_get_by_id()` / `_get_by_port()`

- **Purpose:** obtain a safe snapshot/reference for query or command routing.
- **Called by:** Runtime, Communication, tests.
- **Trigger/mechanism/context:** query; DIRECT CALL; caller thread.
- **Inputs:** ID.
- **Outputs:** immutable snapshot/handle or not found.
- **State modified:** none.
- **Failure cases:** stale/unknown ID.
- **Called next:** none.

### `spaghetti_module_manager_read()` / `_command()`

- **Purpose:** validate state/capability and invoke the instance driver.
- **Called by:** Runtime, Communication diagnostics.
- **Trigger/mechanism/context:** user action/timer/request; DIRECT CALL; caller or
  Manager worker thread, never ISR.
- **Inputs:** instance ID, operation/channel/payload, timeout.
- **Outputs:** result/data or error.
- **State modified:** driver-private context and diagnostic status.
- **Failure cases:** not ready, unsupported operation, I/O timeout, removal race.
- **Called next:** driver operation -> Port API -> Zephyr peripheral API.

## 7. Interaction diagram

```text
Discovery --DIRECT CALL / future MSGQ--> Module Manager
       Manager --DIRECT CALL--> Port capability
       Manager --DIRECT CALL--> Driver Registry
       Manager --DIRECT CALL--> driver init/read/command/deinit
                                          |
                                          +--DIRECT CALL--> Port -> Zephyr
```

## 8. State / lifecycle

```text
ALLOCATED -> CONFIGURED -> INITIALIZING -> READY
                               |           |
                               v           v
                              ERROR <-> REMOVING -> FREE
```

## 9. Concurrency considerations

All lifecycle mutations must be serialized. OPTION A: one mutex and synchronous
calls, simplest first. OPTION B: bounded command queue plus one Manager thread,
better when Communication/Discovery/presence race. RECOMMENDATION: mutex first;
move to a queue only when concurrency appears. Never hold the Manager mutex while
publishing callbacks that may re-enter Manager.

## 10. Zephyr concepts involved

- `k_mutex` protects Manager-owned tables in thread context.
- `k_msgq` can later serialize copied commands with bounded memory.
- fixed pools make RAM and failure behavior predictable.
- logging should include port, instance, driver, transition, and errno.

## 11. Implementation steps

1. Define IDs, states, immutable snapshot.
2. Implement fixed pool and lookups.
3. Configure a fake driver transactionally.
4. Add remove and replace with rollback.
5. Route read/command.
6. Add minimal locking and lifecycle event reporting.

## 12. Expected result

`Port 0 = SHT40` creates exactly one READY instance; remove frees it; failed
replacement leaves a defined state.

## 13. Minimal test

Fake Port/Registry/driver: add, read, remove, occupied port, init failure rollback.

## 14. Dependencies

Port, Module/Module Driver, Driver Registry; Data only for later status events.

## 15. Not yet

No heap-first allocation, auto discovery, persistent schema, MQTT, or per-module
thread.

| Function | Called by | Trigger | Mechanism | Execution context | Calls |
|---|---|---|---|---|---|
| `spaghetti_module_manager_init` | Core | boot | DIRECT CALL | main thread | Port/Registry validation |
| `spaghetti_module_manager_configure` | Discovery/Config | assignment | DIRECT CALL; future MSGQ | caller/Manager worker | Port, Registry, driver init |
| `spaghetti_module_manager_remove` | Discovery/Communication | removal | DIRECT CALL; future MSGQ | caller/Manager worker | driver deinit, Port/Power |
| `spaghetti_module_manager_get_by_id` | Runtime/Communication | query | DIRECT CALL | caller thread | none |
| `spaghetti_module_manager_get_by_port` | Runtime/Communication | query | DIRECT CALL | caller thread | none |
| `spaghetti_module_manager_read` | Runtime | timer/user action | DIRECT CALL | Runtime/Manager thread | driver read -> Port |
| `spaghetti_module_manager_command` | Runtime/Communication | actuator command | DIRECT CALL | caller/Manager thread | driver command -> Port |
