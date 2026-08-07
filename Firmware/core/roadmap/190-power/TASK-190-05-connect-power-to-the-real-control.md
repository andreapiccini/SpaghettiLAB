# TASK-190-05 — Connect Power to the real control

**Status:** ⬜ TODO  
**Phase:** 190 — Power  
**Depends on:** [TASK-190-04](TASK-190-04-test-power-ownership-and-rollback-logic.md)  
**Estimated scope:** Medium

---

## Goal

Complete **Connect Power to the real control** and produce this focused outcome:

Correct transition/count/status.

---

## Open

The Port binding/board DTS and `subsys/power/power.c`.

---

## Write / Modify

Add the verified power reference to the static hardware description and implement real on/off hooks through Port or the appropriate Zephyr GPIO/runtime-PM API. Preserve the measured safe polarity and propagate transition errors.

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

## Zephyr note

Devicetree identifies the physical control; the Power subsystem owns runtime reference state and transition policy.

---

## Steps

- [ ] Open only The Port binding/board DTS and `subsys/power/power.c`.
- [ ] Add the verified power reference to the static hardware description and implement real on/off hooks through Port or the appropriate Zephyr GPIO/runtime-PM API. Preserve the measured safe polarity and propagate transition errors.
- [ ] Handle only these realistic errors: Hardware on/off error, overflow/underflow, rollback after init failure.
- [ ] Confirm no item from **Do NOT implement yet** was added
- [ ] Run the task test and compare it with **Expected result**

---

## Build

YES — `make pristine`

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

`power: connect power to the real control`

---

## Next task

[TASK-190-06](TASK-190-06-integrate-power-with-manager-and-test-hardware.md) — Integrate Power with Manager and test hardware
