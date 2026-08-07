# TASK-120-05 — Integrate Runtime with Core and Config

**Status:** ⬜ TODO  
**Phase:** 120 — Runtime V0  
**Depends on:** [TASK-120-04](TASK-120-04-implement-runtime-load-start-and-stop.md)  
**Estimated scope:** Small

---

## Goal

Complete **Integrate Runtime with Core and Config** and produce this focused outcome:

Logger sample each second with short main.

---

## Open

`CMakeLists.txt`, `subsys/core/core.c`, and `subsys/config/config.c`.

---

## Write / Modify

Add Runtime and Timer sources. Initialize Runtime from Core. After Config applies the module assignment, resolve the module ID, load the 1000 ms sampling task, and start Runtime. Propagate every failure.

---

## Why

Main must stop owning application behavior.

---

## Called / used by

Core/Config/Runtime.

---

## Trigger

BOOT then periodic timer.

---

## Invocation mechanism

DIRECT CALL then K_TIMER/K_SEM/THREAD.

---

## Execution context

Main for setup; Runtime thread for reads.

---

## Calls / dependencies

Config -> Runtime; Runtime -> Manager -> Data.

---

## Inputs

Internal config period/module.

---

## Outputs

Logger sample each second with short main.

---

## Errors to handle

Runtime start failure must make boot degraded/error.

---

## Do NOT implement yet

- Relay threshold or CBOR

---

## Steps

- [ ] Open only `CMakeLists.txt`, `subsys/core/core.c`, and `subsys/config/config.c`.
- [ ] Add Runtime and Timer sources. Initialize Runtime from Core. After Config applies the module assignment, resolve the module ID, load the 1000 ms sampling task, and start Runtime. Propagate every failure.
- [ ] Handle only these realistic errors: Runtime start failure must make boot degraded/error.
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

Measure ten timestamps; stop Runtime via temporary test and verify reads stop.

---

## Expected result

Automatic one-second samples without main loop logic.

---

## Completion checklist

- [ ] Required documentation or implementation file changed as specified
- [ ] Named type, function, configuration, or test exists
- [ ] Build succeeds when this task requires a build
- [ ] Task-specific test passes
- [ ] No unrelated functionality was added

---

## Commit suggestion

`runtime: integrate runtime with core and config`

---

## Next task

[TASK-120-06](TASK-120-06-remove-the-sampling-loop-from-main-and-test-cadence.md) — Remove the sampling loop from main and test cadence
