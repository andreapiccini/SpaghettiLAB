# Timer Service

## 1. Purpose

Timer gives Runtime stable named/identified schedules without embedding Zephyr
timer objects inside user-program data.

## 2. Responsibility

Own bounded timer slots, start/stop/restart, one-shot/periodic semantics,
generation handling, and deferred expiry delivery.

## 3. Non-responsibility

No rule evaluation, sensor read, actuator command, wall-clock scheduler, or long
work inside timer expiry callbacks.

## 4. Files

Only this design README exists. Introduce service files with the Runtime
milestone after timer IDs, capacity, and delivery semantics are fixed.

## 5. Data structures to implement

- timer handle/ID: created and destroyed by Timer, referenced by Runtime.
- timer slot: Timer-owned `k_timer`, period, generation, destination metadata.
- expiry event: bounded value copied to Runtime queue; owned by queue/consumer.

## 6. Functions to implement

### `spaghetti_timer_init()`

- **Purpose:** initialize fixed timer pool.
- **Called by:** Core or Runtime init.
- **Trigger/mechanism/context:** boot; DIRECT CALL; main thread.
- **Inputs:** capacity and expiry sink.
- **Outputs:** status.
- **State modified:** timer pool.
- **Failure cases:** invalid capacity/sink.
- **Called next:** `k_timer_init` for slots.

### `spaghetti_timer_create()`

- **Purpose:** allocate one timer identity and metadata.
- **Called by:** Runtime while loading a program.
- **Trigger/mechanism/context:** program deployment; DIRECT CALL; Runtime thread.
- **Inputs:** one-shot/periodic mode, interval, user correlation/generation.
- **Outputs:** handle or capacity/validation error.
- **State modified:** pool slot.
- **Failure cases:** no slot, zero/unsupported interval, stale program.
- **Called next:** no start unless explicitly requested.

### `spaghetti_timer_start()` / `_stop()` / `_destroy()`

- **Purpose:** control slot lifecycle explicitly.
- **Called by:** Runtime.
- **Trigger/mechanism/context:** runtime start/stop/program replacement; DIRECT
  CALL; Runtime thread.
- **Inputs:** handle and timing parameters where relevant.
- **Outputs:** status.
- **State modified:** active flag/generation/slot.
- **Failure cases:** invalid/stale handle, already destroyed.
- **Called next:** Zephyr `k_timer_start/stop`.

### Internal expiry callback

- **Purpose:** turn kernel expiry into a bounded Runtime event.
- **Called by:** Zephyr timer subsystem.
- **Trigger/mechanism/context:** TIMER; timer expiry context; must not block.
- **Inputs:** timer slot reference.
- **Outputs:** `k_msgq` put with `K_NO_WAIT` or submitted work.
- **State modified:** expiry/drop counters only.
- **Failure cases:** full queue/stale generation.
- **Called next:** Runtime MESSAGE QUEUE; never Module Manager directly.

## 7. Interaction diagram

```text
Runtime --DIRECT CALL--> Timer service --DIRECT CALL--> k_timer
k_timer --TIMER callback--> K_NO_WAIT MESSAGE QUEUE --> Runtime THREAD
```

## 8. State / lifecycle

```text
FREE -> CREATED -> RUNNING <-> STOPPED -> DESTROYED/FREE
                    |
                    +--expiry--> RUNNING or STOPPED(one-shot)
```

## 9. Concurrency considerations

Runtime should own create/start/stop calls initially, avoiding a mutex. Expiry
can race with stop/replacement, so generation IDs are required. Callback cannot
block; queue overflow must increment diagnostics. A dedicated Timer thread is not
needed.

## 10. Zephyr concepts involved

`k_timer` schedules kernel timeouts; its expiry function has restricted context.
`k_msgq` with `K_NO_WAIT` safely defers bounded events. Delayable work is an
alternative for one-shot internal tasks but can execute on shared workqueue.

## 11. Implementation steps

1. Define handle/generation and fixed capacity.
2. Wrap one one-shot `k_timer`.
3. Deliver expiry into fake queue consumer.
4. Add periodic mode.
5. Test stop/replace race and queue full.
6. Integrate Runtime.

## 12. Expected result

A one-second periodic timer produces ordered Runtime events without executing
Runtime or I/O inside expiry context.

## 13. Minimal test

Count ten expiries, verify interval tolerance, stop behavior, and stale generation.

## 14. Dependencies

Zephyr kernel timing; Runtime event contract for final integration.

## 15. Not yet

No cron/time-zone calendar, sensor work, dynamic heap timer count, or busy waiting.

| Function | Called by | Trigger | Mechanism | Execution context | Calls |
|---|---|---|---|---|---|
| `spaghetti_timer_init` | Core/Runtime | boot | DIRECT CALL | main thread | `k_timer_init` |
| `spaghetti_timer_create` | Runtime | program load | DIRECT CALL | Runtime thread | pool allocation |
| `spaghetti_timer_start` | Runtime | runtime start | DIRECT CALL | Runtime thread | `k_timer_start` |
| `spaghetti_timer_stop` | Runtime | stop/replace | DIRECT CALL | Runtime thread | `k_timer_stop` |
| `spaghetti_timer_destroy` | Runtime | program removal | DIRECT CALL | Runtime thread | pool release |
| expiry callback | Zephyr | deadline | TIMER + MESSAGE QUEUE | timer context | `k_msgq_put(K_NO_WAIT)` |
