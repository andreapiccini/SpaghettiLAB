# TASK-190-02 — Define the Power public API

**Status:** ⬜ TODO  
**Phase:** 190 — Power  
**Depends on:** [TASK-190-01](TASK-190-01-verify-controllable-power-hardware.md)  
**Estimated scope:** Small

---

## Goal

Complete **Define the Power public API** and produce this focused outcome:

Lease/status and reference-counted state.

---

## Open

`include/spaghetti/power.h`.

---

## Write / Modify

Define one resource ID/state contract and declare Power init, acquire, release, and get-status functions. Document owner identity, reference-count limits, thread-only calls, and underflow behavior.

---

## Why

Module lifecycle and multi-board static facts are stable.

---

## Called / used by

Manager/driver lifecycle; Communication status.

---

## Trigger

MODULE CONFIGURATION/REMOVAL.

---

## Invocation mechanism

DIRECT CALL.

---

## Execution context

Manager/calling thread.

---

## Calls / dependencies

Port power control/Zephyr GPIO or PM based on real hardware.

---

## Inputs

Resource and owner ID.

---

## Outputs

Lease/status and reference-counted state.

---

## Errors to handle

Unsupported resource, transition failure, underflow/double release.

---

## Do NOT implement yet

- Battery policy, deep sleep, speculative wake sources, OTA

---

## Steps

- [ ] Open only `include/spaghetti/power.h`.
- [ ] Define one resource ID/state contract and declare Power init, acquire, release, and get-status functions.
- [ ] Document owner identity, reference-count limits, thread-only calls, and underflow behavior.
- [ ] Handle only these realistic errors: Unsupported resource, transition failure, underflow/double release.
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

Ownership/reference-count design review.

---

## Expected result

Minimal real resource contract.

---

## Completion checklist

- [ ] Required documentation or implementation file changed as specified
- [ ] Named type, function, configuration, or test exists
- [ ] Build succeeds when this task requires a build
- [ ] Task-specific test passes
- [ ] No unrelated functionality was added

---

## Commit suggestion

`power: define the power public api`

---

## Next task

[TASK-190-03](TASK-190-03-implement-reference-counting-with-a-fake-backend.md) — Implement reference counting with a fake backend
