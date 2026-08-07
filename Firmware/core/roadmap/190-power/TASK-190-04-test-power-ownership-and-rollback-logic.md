# TASK-190-04 — Test Power ownership and rollback logic

**Status:** ⬜ TODO  
**Phase:** 190 — Power  
**Depends on:** [TASK-190-03](TASK-190-03-implement-reference-counting-with-a-fake-backend.md)  
**Estimated scope:** Small

---

## Goal

Complete **Test Power ownership and rollback logic** and produce this focused outcome:

Correct transition/count/status.

---

## Open

`subsys/power/power.c` and a focused fake-backend test harness.

---

## Write / Modify

Exercise two owners acquiring/releasing in both orders, duplicate/invalid releases, overflow boundary, fake on failure, and fake off failure. Confirm counts and state remain coherent after each error.

---

## Why

Exact acquire/release points are established by Manager.

---

## Called / used by

Manager/driver.

---

## Trigger

MODULE LIFECYCLE.

---

## Invocation mechanism

DIRECT CALL + K_MUTEX.

---

## Execution context

Thread only, never ISR.

---

## Calls / dependencies

Port/Zephyr GPIO or runtime PM.

---

## Inputs

Valid owner/resource.

---

## Outputs

Correct transition/count/status.

---

## Errors to handle

Hardware on/off error, overflow/underflow, rollback after init failure.

---

## Do NOT implement yet

- System sleep until runtime/device PM requirements are measured

---

## Steps

- [ ] Open only `subsys/power/power.c` and a focused fake-backend test harness.
- [ ] Exercise two owners acquiring/releasing in both orders, duplicate/invalid releases, overflow boundary, fake on failure, and fake off failure.
- [ ] Confirm counts and state remain coherent after each error.
- [ ] Handle only these realistic errors: Hardware on/off error, overflow/underflow, rollback after init failure.
- [ ] Confirm no item from **Do NOT implement yet** was added
- [ ] Run the task test and compare it with **Expected result**

---

## Build

YES — `make build`

---

## Flash

NO

---

## Test

Two owners acquire/release in both orders; inject failed driver init and
confirm count/rail rollback.

---

## Expected result

One on transition, one final off transition, no premature off.

---

## Completion checklist

- [ ] Required documentation or implementation file changed as specified
- [ ] Named type, function, configuration, or test exists
- [ ] Build succeeds when this task requires a build
- [ ] Task-specific test passes
- [ ] No unrelated functionality was added

---

## Commit suggestion

`power: test power ownership and rollback logic`

---

## Next task

[TASK-190-05](TASK-190-05-connect-power-to-the-real-control.md) — Connect Power to the real control
