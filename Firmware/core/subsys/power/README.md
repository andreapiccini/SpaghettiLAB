# Power

[← Project README](../../README.md) · [Architecture](../../ARCHITECTURE.md) · [Roadmap](../../IMPLEMENTATION_ROADMAP.md)

> [!NOTE]
> This is a design contract. See the roadmap for current implementation status.

## Purpose

Power coordinates Core and module power requirements above board-specific rails
and Zephyr PM so shared resources are not disabled while still in use.

## Responsibility

Capability checks, usage/reference tracking, port power requests, transition
coordination, diagnostics, and later suspend/resume constraints.

## Non-responsibility

No invented power pins, application policy guesses, direct sensor protocol, or
replacement of Zephyr's device/system PM implementations.

## Files

- Public API: `include/spaghetti/power.h`.
- Implementation: `subsys/power/power.c`.
- Static rails/pins/domains belong to board Devicetree and Port.

## Data structures to implement

- power resource/capability descriptor: derived from Port/static hardware, owned
  by Power/Port for firmware lifetime, read by Manager/drivers.
- lease/token: created on acquire, owned by caller but validated by Power,
  destroyed on release.
- resource state/reference count: Power-owned and modified only under lock.

## Functions to implement

### `spaghetti_power_init()`

- **Purpose:** build/validate known resource state.
- **Called by:** Core after Port.
- **Trigger/mechanism/context:** boot; DIRECT CALL; main thread.
- **Inputs:** static Port/power capabilities.
- **Outputs:** status.
- **State modified:** resource table.
- **Failure cases:** inconsistent dependency/unready control device.
- **Called next:** Port/device readiness calls.

### `spaghetti_power_acquire()` / `_release()`

- **Purpose:** reference-count a required powered resource.
- **Called by:** Manager lifecycle or driver operation.
- **Trigger/mechanism/context:** init/operation/deinit; DIRECT CALL; thread only.
- **Inputs:** resource/port, owner, timeout.
- **Outputs:** lease/status.
- **State modified:** count, state, owner records.
- **Failure cases:** unsupported, transition failure, timeout, invalid/double release.
- **Called next:** Port power control or Zephyr runtime PM by DIRECT CALL.

### `spaghetti_power_prepare_suspend()` / `_resume()`

- **Purpose:** coordinate future system transition with live modules.
- **Called by:** Core/PM policy integration.
- **Trigger/mechanism/context:** power state transition; CALLBACK/DIRECT CALL in
  Zephyr-defined PM context, details DECISION REQUIRED.
- **Inputs:** target state/reason.
- **Outputs:** allowed/busy/error.
- **State modified:** transition state.
- **Failure cases:** busy resource, unsupported wake requirement, driver failure.
- **Called next:** Manager/Port/Zephyr PM hooks with strict context rules.

### `spaghetti_power_get_status()`

- **Purpose:** diagnostics snapshot.
- **Called by:** Communication/tests.
- **Trigger/mechanism/context:** query; DIRECT CALL; caller thread.
- **Inputs/outputs:** resource/status snapshot.
- **State modified:** none.
- **Failure cases:** invalid ID/output.
- **Called next:** none.

## Interaction diagram

```text
Manager/driver --DIRECT CALL acquire--> Power --DIRECT CALL--> Port/Zephyr PM
Core/PM policy --CALLBACK/DIRECT CALL TBD--> Power transition coordinator
```

## State / lifecycle

```text
OFF --first acquire--> STARTING -> ON --last release--> STOPPING -> OFF
                            +----> FAULT <--------------+
```

## Concurrency considerations

Reference count/state require a short mutex; do not hold it across callbacks that
can re-enter Power. No dedicated thread initially. PM callbacks have strict
context and blocking rules that must be checked when integrating a specific
Zephyr PM path.

## Zephyr concepts involved

System PM chooses CPU/SoC states; device PM controls individual devices; runtime
device PM uses get/put reference counts. GPIO-controlled external rails may remain
a Spaghetti Port/Power concern rather than a generic Zephyr device initially.

## Implementation steps

1. Wait for real power hardware requirements.
2. Define one capability/resource ID.
3. Implement reference count with fake backend.
4. Integrate one real Port power control.
5. Add fault/diagnostics.
6. Consider Zephyr PM transitions only after measurement.

## Expected result

A shared resource powers on once, remains on for two users, and turns off only
after both release it.

## Minimal test

Two fake consumers acquire/release in different orders; test double release/error.

## Dependencies

Port capability and Module Manager lifecycle; real board power description.

## Not yet

No speculative GPIO mappings, battery algorithm, deep sleep, or automatic policy.

| Function | Called by | Trigger | Mechanism | Execution context | Calls |
|---|---|---|---|---|---|
| `spaghetti_power_init` | Core | boot | DIRECT CALL | main thread | Port/device readiness |
| `spaghetti_power_acquire` | Manager/driver | lifecycle/operation | DIRECT CALL | caller thread | Port/Zephyr PM |
| `spaghetti_power_release` | Manager/driver | operation complete | DIRECT CALL | caller thread | Port/Zephyr PM |
| `spaghetti_power_prepare_suspend` | Core/PM integration | state transition | CALLBACK/DIRECT CALL TBD | PM-defined context | Manager/Port/PM |
| `spaghetti_power_resume` | Core/PM integration | resume | CALLBACK/DIRECT CALL TBD | PM-defined context | Port/Manager |
| `spaghetti_power_get_status` | Communication | query | DIRECT CALL | caller thread | none |
