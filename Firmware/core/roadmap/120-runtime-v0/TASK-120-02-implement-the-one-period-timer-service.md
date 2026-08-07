# TASK-120-02 — Implement the one-period Timer service

**Status:** ⬜ TODO  
**Phase:** 120 — Runtime V0  
**Depends on:** [TASK-120-01](TASK-120-01-define-the-runtime-sampling-task-api.md)  
**Estimated scope:** Small

---

## Goal

Complete **Implement the one-period Timer service** and produce this focused outcome:

One sample event per period.

---

## Open

Create `subsys/services/timer/timer.h` and `subsys/services/timer/timer.c`.

---

## Write / Modify

Wrap one `k_timer`. Its expiry callback must only signal a supplied `k_sem` with `k_sem_give()`. Implement bounded init/start/stop calls and keep the callback free of I2C, Manager, and Data operations.

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

K_TIMER + K_SEM

---

## Execution context

timer callback context

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

## Zephyr note

A `k_timer` expiry runs in a context where blocking I2C work is inappropriate. It should signal a thread and return quickly.

---

## Steps

- [ ] Open only Create `subsys/services/timer/timer.h` and `subsys/services/timer/timer.c`.
- [ ] Wrap one `k_timer`. Its expiry callback must only signal a supplied `k_sem` with `k_sem_give()`.
- [ ] Implement bounded init/start/stop calls and keep the callback free of I2C, Manager, and Data operations.
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

`runtime: implement the one-period timer service`

---

## Next task

[TASK-120-03](TASK-120-03-implement-the-runtime-sampling-thread.md) — Implement the Runtime sampling thread
