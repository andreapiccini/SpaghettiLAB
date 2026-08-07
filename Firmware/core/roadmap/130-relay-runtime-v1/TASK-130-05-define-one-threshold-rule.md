# TASK-130-05 — Define one threshold rule

**Status:** ⬜ TODO  
**Phase:** 130 — Relay + Runtime V1  
**Depends on:** [TASK-130-04](TASK-130-04-route-commands-through-module-manager.md)  
**Estimated scope:** Small

---

## Goal

Complete **Define one threshold rule** and produce this focused outcome:

Relay ON only for values strictly above threshold.

---

## Open

`include/spaghetti/runtime.h`.

---

## Write / Modify

Define only `spaghetti_runtime_threshold_rule` with source module/channel, fixed-unit threshold, target relay ID, and target boolean. Declare `spaghetti_runtime_load_threshold_rule()` with bounded single-rule semantics.

---

## Why

Both sensor Data and relay command work independently.

---

## Called / used by

Config loads; Runtime evaluates.

---

## Trigger

DATA ARRIVAL.

---

## Invocation mechanism

ZBUS MSG SUBSCRIBER -> Runtime THREAD -> DIRECT CALL.

---

## Execution context

Runtime thread.

---

## Calls / dependencies

Data subscriber and Manager command.

---

## Inputs

Temperature sample and one rule.

---

## Outputs

Relay ON only for values strictly above threshold.

---

## Errors to handle

Missing target/source, wrong channel, command failure.

---

## Do NOT implement yet

- Generic operators/actions, hysteresis unless required for safe physical test, rule arrays, scripting

---

## Steps

- [ ] Open only `include/spaghetti/runtime.h`.
- [ ] Define only `spaghetti_runtime_threshold_rule` with source module/channel, fixed-unit threshold, target relay ID, and target boolean.
- [ ] Declare `spaghetti_runtime_load_threshold_rule()` with bounded single-rule semantics.
- [ ] Handle only these realistic errors: Missing target/source, wrong channel, command failure.
- [ ] Confirm no item from **Do NOT implement yet** was added
- [ ] Run the task test and compare it with **Expected result**

---

## Build

NO

---

## Flash

NO

---

## Test

Inject 24.9, 25.0, 25.1 fixed-unit samples; expect no/no/one command.

---

## Expected result

Exact threshold semantics and real relay response.

---

## Completion checklist

- [ ] Required documentation or implementation file changed as specified
- [ ] Named type, function, configuration, or test exists
- [ ] Build succeeds when this task requires a build
- [ ] Task-specific test passes
- [ ] No unrelated functionality was added

---

## Commit suggestion

`relay: define one threshold rule`

---

## Next task

[TASK-130-06](TASK-130-06-evaluate-temperature-in-the-runtime-thread.md) — Evaluate temperature in the Runtime thread
