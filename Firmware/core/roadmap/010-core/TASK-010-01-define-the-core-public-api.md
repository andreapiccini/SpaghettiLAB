# TASK-010-01 — Define the Core public API

**Status:** ⬜ TODO  
**Phase:** 010 — Core  
**Depends on:** [TASK-000-02](../000-baseline/TASK-000-02-flash-and-observe-the-baseline.md)  
**Estimated scope:** Small

---

## Goal

Complete **Define the Core public API** and produce this focused outcome:

Declaration contract only.

---

## Open

`include/spaghetti/core.h`.

---

## Write / Modify

Add an include guard; declare
`enum spaghetti_core_state { SPAGHETTI_CORE_UNINITIALIZED,
SPAGHETTI_CORE_READY, SPAGHETTI_CORE_ERROR };`,
`int spaghetti_core_init(void);`, and
`enum spaghetti_core_state spaghetti_core_get_state(void);`.

---

## Why

All later subsystem initialization needs one coordinator.

---

## Called / used by

`src/main.c`; future Communication reads state.

---

## Trigger

BOOT.

---

## Invocation mechanism

DIRECT CALL.

---

## Execution context

Main Zephyr thread.

---

## Calls / dependencies

No lower subsystem yet.

---

## Inputs

None.

---

## Outputs

Declaration contract only.

---

## Errors to handle

None in header; document negative errno convention.

---

## Do NOT implement yet

- Capability flags, Wi-Fi/BLE, subsystem arrays, threads

---

## Steps

- [ ] Open only `include/spaghetti/core.h`.
- [ ] Add an include guard
- [ ] declare `enum spaghetti_core_state { SPAGHETTI_CORE_UNINITIALIZED, SPAGHETTI_CORE_READY, SPAGHETTI_CORE_ERROR };`, `int spaghetti_core_init(void);`, and `enum spaghetti_core_state spaghetti_core_get_state(void);`.
- [ ] Handle only these realistic errors: None in header; document negative errno convention.
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

Review ownership: only Core may modify its state.

---

## Expected result

Small header with no board-specific field.

---

## Completion checklist

- [ ] Required documentation or implementation file changed as specified
- [ ] Named type, function, configuration, or test exists
- [ ] Build succeeds when this task requires a build
- [ ] Task-specific test passes
- [ ] No unrelated functionality was added

---

## Commit suggestion

`core: define the core public api`

---

## Next task

[TASK-010-02](TASK-010-02-implement-core-state-and-initialization.md) — Implement Core state and initialization
