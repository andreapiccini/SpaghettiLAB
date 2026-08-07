# TASK-120-01 — Define the Runtime sampling task API

**Status:** ⬜ TODO  
**Phase:** 120 — Runtime V0  
**Depends on:** [TASK-110-06](../110-data-zbus/TASK-110-06-test-zbus-fan-out-and-backpressure.md)  
**Estimated scope:** Small

---

## Goal

Complete **Define the Runtime sampling task API** and produce this focused outcome:

Valid loaded task/status.

---

## Open

`include/spaghetti/runtime.h`.

---

## Write / Modify

Define `spaghetti_runtime_sampling_task` with module ID, period milliseconds, and enabled flag. Declare Runtime init, load, start, and stop functions only; do not add a scripting language.

---

## Why

Config already contains a sample period and Data already distributes.

---

## Called / used by

Core/Config; Runtime owns task copy while loaded.

---

## Trigger

BOOT/CONFIG APPLY.

---

## Invocation mechanism

DIRECT CALL for lifecycle.

---

## Execution context

Main/calling thread.

---

## Calls / dependencies

Module Manager/Data/Timer service later.

---

## Inputs

READY module ID and period 1000 ms.

---

## Outputs

Valid loaded task/status.

---

## Errors to handle

Zero/overflow period, unknown module, already running.

---

## Do NOT implement yet

- Conditions, actions, graph, bytecode, multiple tasks

---

## Steps

- [ ] Open only `include/spaghetti/runtime.h`.
- [ ] Define `spaghetti_runtime_sampling_task` with module ID, period milliseconds, and enabled flag.
- [ ] Declare Runtime init, load, start, and stop functions only
- [ ] do not add a scripting language.
- [ ] Handle only these realistic errors: Zero/overflow period, unknown module, already running.
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

Validate 1000; reject zero and unknown ID.

---

## Expected result

Minimal task contract.

---

## Completion checklist

- [ ] Required documentation or implementation file changed as specified
- [ ] Named type, function, configuration, or test exists
- [ ] Build succeeds when this task requires a build
- [ ] Task-specific test passes
- [ ] No unrelated functionality was added

---

## Commit suggestion

`runtime: define the runtime sampling task api`

---

## Next task

[TASK-120-02](TASK-120-02-implement-the-one-period-timer-service.md) — Implement the one-period Timer service
