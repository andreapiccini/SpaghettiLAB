# TASK-190-03 — Implement reference counting with a fake backend

**Status:** ⬜ TODO  
**Phase:** 190 — Power  
**Depends on:** [TASK-190-02](TASK-190-02-define-the-power-public-api.md)  
**Estimated scope:** Small

---

## Goal

Complete **Implement reference counting with a fake backend** and produce this focused outcome:

Correct transition/count/status.

---

## Open

`subsys/power/power.c`.

---

## Write / Modify

Implement private state under a short `k_mutex`: first acquire calls a fake power-on hook, intermediate acquire/release only change count, and final release calls power-off. Reject overflow, underflow, and invalid resource/owner.

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

DIRECT CALL + K_MUTEX

---

## Execution context

calling thread

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

Use the mutex only around short state transitions. Never call this blocking API from ISR or timer callback context.

---

## Steps

- [ ] Open only `subsys/power/power.c`.
- [ ] Implement private state under a short `k_mutex`: first acquire calls a fake power-on hook, intermediate acquire/release only change count, and final release calls power-off.
- [ ] Reject overflow, underflow, and invalid resource/owner.
- [ ] Handle only these realistic errors: Hardware on/off error, overflow/underflow, rollback after init failure.
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

`power: implement reference counting with a fake backend`

---

## Next task

[TASK-190-04](TASK-190-04-test-power-ownership-and-rollback-logic.md) — Test Power ownership and rollback logic
