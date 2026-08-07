# Core

## 1. Purpose

Core is the boot coordinator and hardware-platform abstraction. It prevents the
rest of the firmware from branching on ESP32-C3, ESP32-S3, or future MCU names.

## 2. Responsibility

- Own overall boot/readiness state and immutable Core information.
- Initialize common subsystems in dependency order.
- Expose capabilities, firmware identity, and degraded/failure state.

## 3. Non-responsibility

- No sensor protocols, module instances, runtime rules, or MQTT state machine.
- No hard-coded board pin mappings.
- No ownership of Port or Module Manager internal objects.

## 4. Files

- Public API: `include/spaghetti/core.h`; stable contract visible to `main` and
  diagnostics.
- Implementation: `subsys/core/core.c`; boot ordering and private Core state.

## 5. Data structures to implement

- `spaghetti_core_info`: immutable identity/version/capabilities; created and
  owned by Core for firmware lifetime; read by Communication and diagnostics.
- `spaghetti_core_state`: booting, ready, degraded, failed; owned and modified
  only by Core; others read snapshots. Add only states with observable meaning.

## 6. Functions to implement

### `spaghetti_core_init()`

- **Purpose:** initialize mandatory architecture layers in a known order.
- **Called by:** `main`.
- **Trigger:** firmware boot.
- **Invocation mechanism:** BOOT INIT, then DIRECT CALL.
- **Execution context:** main thread; may block for bounded initialization.
- **Inputs:** none or a future immutable startup configuration.
- **Outputs:** success or negative error; Core state becomes ready/degraded/error.
- **State modified:** Core state and private initialization flags.
- **Failure cases:** invalid static hardware, mandatory dependency unavailable.
- **Called next:** Port, Storage, Config, Manager, Communication initialization by
  DIRECT CALL in documented order.

### `spaghetti_core_start()`

- **Purpose:** start asynchronous services after construction succeeds.
- **Called by:** `main` after `init`.
- **Trigger/mechanism:** boot; DIRECT CALL in main thread.
- **Inputs/outputs:** no mutable input; status result.
- **State modified:** running flag.
- **Failure cases:** service start or dependency failure.
- **Called next:** Runtime/Communication/service start APIs by DIRECT CALL.

### `spaghetti_core_get_info()` / `spaghetti_core_get_state()`

- **Purpose:** return read-only diagnostics and capability state.
- **Called by:** Communication, shell/diagnostics, tests.
- **Trigger/mechanism:** request; DIRECT CALL in caller thread.
- **Inputs:** output snapshot or returned const view.
- **Outputs:** stable data or not-initialized error.
- **State modified:** none.
- **Failure cases:** called before initialization, invalid output pointer.
- **Called next:** no lower dependency.

## 7. Interaction diagram

```text
Zephyr -> main --BOOT INIT / DIRECT CALL--> Core
                                             |
                  DIRECT CALL                +--> Port
                                             +--> Storage -> Config
                                             +--> Module Manager
                                             +--> Communication/Runtime
```

## 8. State / lifecycle

```text
UNINITIALIZED -> INITIALIZING -> READY -> RUNNING
                       +------> DEGRADED / FAILED
```

## 9. Concurrency considerations

Initialization is single-threaded. State reads may later need an atomic value or
short mutex. Core should not own a thread. Never call blocking boot logic from an
ISR. zbus is unnecessary for ordinary getters; it may later publish rare Core
state changes.

## 10. Zephyr concepts involved

- `main` is a Zephyr thread after kernel/device initialization.
- Logging provides per-module levels and structured diagnostics; needed early.
- Devicetree supplies static hardware indirectly through Port; Core does not
  parse board-specific GPIOs.
- Kconfig will later compile optional capabilities; it is not runtime config.

## 11. Implementation steps

1. Define minimal info/state types.
2. Implement state getters.
3. Implement ordered initialization with one dependency.
4. Add structured logging and explicit error propagation.
5. Add start separation only when an asynchronous service exists.

## 12. Expected result

Boot reports a board-independent Core identity and a clear ready/failure result.

## 13. Minimal test

Run successful init, then inject one dependency failure and verify state/error.

## 14. Dependencies

Logging first; Port becomes the first architecture dependency.

## 15. Not yet

Do not add networking, OTA, discovery provider logic, or board-specific branches.

| Function | Called by | Trigger | Mechanism | Execution context | Calls |
|---|---|---|---|---|---|
| `spaghetti_core_init` | main | boot | BOOT INIT / DIRECT CALL | main thread | subsystem init APIs |
| `spaghetti_core_start` | main | init complete | DIRECT CALL | main thread | service start APIs |
| `spaghetti_core_get_info` | Communication/tests | query | DIRECT CALL | caller thread | none |
| `spaghetti_core_get_state` | diagnostics/tests | query | DIRECT CALL | caller thread | none |
