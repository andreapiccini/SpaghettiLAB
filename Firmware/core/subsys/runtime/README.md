# Runtime

[← Project README](../../README.md) · [Architecture](../../ARCHITECTURE.md) · [Roadmap](../../IMPLEMENTATION_ROADMAP.md)

> [!NOTE]
> This is a design contract. See the roadmap for current implementation status.

## Purpose

Runtime executes user-defined scheduling, processing, conditions, and actions
without direct knowledge of sensor registers, GPIOs, or Core variant.

## Responsibility

Own loaded program and execution state; consume timer/data events; validate
references/types; evaluate rules; route commands through Module Manager.

## Non-responsibility

No hardware access, driver lifecycle, discovery, persistence backend, or MQTT
connection management.

## Files

- Public API: `include/spaghetti/runtime.h`.
- Implementation: `subsys/runtime/runtime.c`; program validation and executor.

## Data structures to implement

- runtime program/config: created by parser/Config, copied/owned by Runtime while
  loaded, destroyed/replaced by Runtime.
- rule/trigger/condition/action: bounded representation, Runtime-modified only.
- execution context: Runtime-owned state/counters; diagnostics receive snapshots.
- event/command: copied value objects using stable module IDs, not raw pointers.

## Functions to implement

### `spaghetti_runtime_init()`

- **Purpose:** initialize executor resources without running user logic.
- **Called by:** Core.
- **Trigger/mechanism/context:** boot; DIRECT CALL; main thread.
- **Inputs:** Manager/Data/Timer dependencies and fixed limits.
- **Outputs:** status.
- **State modified:** Runtime internals.
- **Failure cases:** invalid limits or queue/thread creation failure.
- **Called next:** Zephyr queue/thread initialization if selected.

### `spaghetti_runtime_load()`

- **Purpose:** validate and atomically replace the active program.
- **Called by:** Config/Communication deployment path.
- **Trigger/mechanism/context:** backend deployment; DIRECT CALL or Runtime command
  MESSAGE QUEUE; caller/Runtime worker, DECISION REQUIRED before concurrency.
- **Inputs:** versioned program snapshot.
- **Outputs:** accepted/rejected result with diagnostic.
- **State modified:** active program and timer registrations.
- **Failure cases:** invalid graph/type/reference/resources/version.
- **Called next:** Timer service by DIRECT CALL.

### `spaghetti_runtime_start()` / `_stop()`

- **Purpose:** control execution independently from loaded configuration.
- **Called by:** Core, Communication, Config reconciliation.
- **Trigger/mechanism/context:** boot/user command; DIRECT CALL or command queue;
  thread context.
- **Inputs:** optional generation/reason.
- **Outputs:** status.
- **State modified:** running state and timers.
- **Failure cases:** no valid program, already running/stopped, timer failure.
- **Called next:** Timer start/stop.

### `spaghetti_runtime_submit_event()`

- **Purpose:** enqueue Data/timer events for serialized evaluation.
- **Called by:** Data subscriber and Timer service adapter.
- **Trigger:** ZBUS SUBSCRIBER or TIMER deferred notification.
- **Invocation mechanism:** MESSAGE QUEUE into dedicated Runtime THREAD is the
  recommendation for ordered, bounded execution.
- **Execution context:** producer context only copies; evaluation in Runtime
  preemptive thread.
- **Inputs:** bounded event copy.
- **Outputs:** queued/full result.
- **State modified:** queue and later execution state.
- **Failure cases:** queue full, stale program generation, invalid event.
- **Called next:** Runtime thread evaluates, then Manager command by DIRECT CALL.

### `spaghetti_runtime_get_status()`

- **Purpose:** expose immutable diagnostics.
- **Called by:** Communication/tests.
- **Trigger/mechanism/context:** query; DIRECT CALL; caller thread.
- **Inputs/outputs:** status snapshot.
- **State modified:** none.
- **Failure cases:** invalid output/not initialized.
- **Called next:** none.

## Interaction diagram

```text
Timer --TIMER then MSGQ--> Runtime THREAD
Data --ZBUS SUBSCRIBER then MSGQ--> Runtime THREAD
Runtime --DIRECT CALL--> Module Manager --DIRECT CALL--> driver
```

## State / lifecycle

```text
EMPTY -> LOADED -> RUNNING <-> PAUSED -> STOPPED
             |         +-------------> ERROR
             +-----------------------> REPLACED
```

## Concurrency considerations

Use one worker thread initially so event ordering and program replacement are
deterministic. Producers must never execute user logic in zbus/timer callback
context. Queue capacity and overflow policy must be explicit. Synchronous Manager
commands are appropriate from the worker.

## Zephyr concepts involved

`k_thread` owns a stack and scheduled execution context; `k_msgq` serializes
bounded events; `k_timer` callback only signals; zbus may fan Data into the queue.

## Implementation steps

1. Define minimal one-rule program model.
2. Validate stable module/channel references.
3. Create bounded input queue and one worker.
4. Handle synthetic Data event.
5. Add timer event.
6. Route one relay command.
7. Add atomic program replacement and diagnostics.

## Expected result

Every second, a synthetic/real temperature event is evaluated and a threshold
crossing issues a relay command in deterministic thread context.

## Minimal test

Feed below/equal/above-threshold values and verify exact fake Manager calls.

## Dependencies

Module Manager, Data contract, Timer service; Config for persisted deployment.

## Not yet

No general language VM, parallel rules, unbounded graph, cloud execution, or OTA.

| Function | Called by | Trigger | Mechanism | Execution context | Calls |
|---|---|---|---|---|---|
| `spaghetti_runtime_init` | Core | boot | DIRECT CALL | main thread | queue/thread setup |
| `spaghetti_runtime_load` | Config/Communication | deployment | DIRECT CALL / MSGQ TBD | caller/Runtime thread | Timer service |
| `spaghetti_runtime_start` | Core/Communication | start | DIRECT CALL / MSGQ | thread context | Timer service |
| `spaghetti_runtime_stop` | Core/Communication | stop | DIRECT CALL / MSGQ | thread context | Timer service |
| `spaghetti_runtime_submit_event` | Data/Timer adapters | value/expiry | MESSAGE QUEUE | producer -> Runtime thread | rule evaluator, Manager |
| `spaghetti_runtime_get_status` | Communication | query | DIRECT CALL | caller thread | none |
