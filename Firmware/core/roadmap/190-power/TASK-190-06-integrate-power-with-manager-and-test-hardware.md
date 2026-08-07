# TASK-190-06 — Integrate Power with Manager and test hardware

**Status:** ⬜ TODO  
**Phase:** 190 — Power  
**Depends on:** [TASK-190-05](TASK-190-05-connect-power-to-the-real-control.md)  
**Estimated scope:** Small

---

## Goal

Complete **Integrate Power with Manager and test hardware** and produce this focused outcome:

Correct transition/count/status.

---

## Open

`CMakeLists.txt`, `subsys/core/core.c`, `subsys/module_manager/module_manager.c`, and real measurement equipment.

---

## Write / Modify

Add Power source and initialize it from Core. Manager acquires before driver init and releases after deinit or every rollback. Measure first-on/final-off transitions and inject driver-init failure to confirm release.

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

- [ ] Open only `CMakeLists.txt`, `subsys/core/core.c`, `subsys/module_manager/module_manager.c`, and real measurement equipment.
- [ ] Add Power source and initialize it from Core. Manager acquires before driver init and releases after deinit or every rollback. Measure first-on/final-off transitions and inject driver-init failure to confirm release.
- [ ] Handle only these realistic errors: Hardware on/off error, overflow/underflow, rollback after init failure.
- [ ] Confirm no item from **Do NOT implement yet** was added
- [ ] Run the task test and compare it with **Expected result**

---

## Build

YES — `make pristine`

---

## Flash

YES — use the host-specific workflow in the root `README.md`.

---

## Test

Two owners acquire/release in both orders; inject failed driver init and
confirm count/rail rollback.

---

## Expected result

Two owners share one real resource without premature off, and failed module initialization releases it.

---

## Completion checklist

- [ ] Required documentation or implementation file changed as specified
- [ ] Named type, function, configuration, or test exists
- [ ] Build succeeds when this task requires a build
- [ ] Task-specific test passes
- [ ] No unrelated functionality was added

---

## Commit suggestion

`power: integrate power with manager and test hardware`

---

## Next task

[Backlog index](../README.md) — define the next requirement before adding work.
