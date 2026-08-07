# TASK-120-03 — Implement the Runtime sampling thread

**Status:** ⬜ TODO  
**Phase:** 120 — Runtime V0  
**Depends on:** [TASK-120-02](TASK-120-02-implement-the-one-period-timer-service.md)  
**Estimated scope:** Medium

---

## Goal

Complete **Implement the Runtime sampling thread** and produce this focused outcome:

One sample event per period.

---

## Open

`subsys/runtime/runtime.c`.

---

## Write / Modify

Create one bounded semaphore and one dedicated Runtime thread. The thread waits with `k_sem_take()`, directly calls Manager read for the loaded module, converts the sample, and publishes through Data. Define stack size and priority explicitly.

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
- [ ] Create one bounded semaphore and one dedicated Runtime thread. The thread waits with `k_sem_take()`, directly calls Manager read for the loaded module, converts the sample, and publishes through Data.
- [ ] Define stack size and priority explicitly.
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

`runtime: implement the runtime sampling thread`

---

## Next task

[TASK-120-04](TASK-120-04-implement-runtime-load-start-and-stop.md) — Implement Runtime load, start, and stop
