# TASK-120-04 — Implement Runtime load, start, and stop

**Status:** ⬜ TODO  
**Phase:** 120 — Runtime V0  
**Depends on:** [TASK-120-03](TASK-120-03-implement-the-runtime-sampling-thread.md)  
**Estimated scope:** Small

---

## Goal

Complete **Implement Runtime load, start, and stop** and produce this focused outcome:

One sample event per period.

---

## Open

`subsys/runtime/runtime.c`.

---

## Write / Modify

Implement validation and state for init/load/start/stop. Reject zero period, invalid module, double start, and stop-before-start. Start and stop the Timer service without doing work in the timer callback.

---

## Why

The manual loop has proved all lower layers.

---

## Called / used by

Core/Config starts; Zephyr timer wakes Runtime.

---

## Trigger

RUNTIME TIMER.

---

## Invocation mechanism

K_TIMER -> K_SEM -> THREAD -> DIRECT CALL.

---

## Execution context

Timer expiry gives semaphore; Runtime thread does I/O.

---

## Calls / dependencies

Kernel timer/semaphore/thread, Manager read, Data publish.

---

## Inputs

Loaded task.

---

## Outputs

One sample event per period.

---

## Errors to handle

Missed/coalesced tick is observable with semaphore max=1;
read/publish failure; invalid task on start.

---

## Do NOT implement yet

- zbus-driven scheduler, multiple timers, dynamic thread

---

## Steps

- [ ] Open only `subsys/runtime/runtime.c`.
- [ ] Implement validation and state for init/load/start/stop.
- [ ] Reject zero period, invalid module, double start, and stop-before-start.
- [ ] Start and stop the Timer service without doing work in the timer callback.
- [ ] Handle only these realistic errors: Missed/coalesced tick is observable with semaphore max=1; read/publish failure; invalid task on start.
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

Fake Manager counter before hardware test.

---

## Expected result

Timer callback contains no blocking call.

---

## Completion checklist

- [ ] Required documentation or implementation file changed as specified
- [ ] Named type, function, configuration, or test exists
- [ ] Build succeeds when this task requires a build
- [ ] Task-specific test passes
- [ ] No unrelated functionality was added

---

## Commit suggestion

`runtime: implement runtime load start and stop`

---

## Next task

[TASK-120-05](TASK-120-05-integrate-runtime-with-core-and-config.md) — Integrate Runtime with Core and Config
