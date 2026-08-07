# TASK-050-04 — Declare the SHT40 driver descriptor

**Status:** ⬜ TODO  
**Phase:** 050 — Module + Module Driver  
**Depends on:** [TASK-050-03](TASK-050-03-define-the-module-driver-operation-table.md)  
**Estimated scope:** Small

---

## Goal

Complete **Declare the SHT40 driver descriptor** and produce this focused outcome:

Same real values as Milestone 4.

---

## Open

`spaghetti_modules/sht40/sht40.h`.

---

## Write / Modify

Declare the immutable exported descriptor `extern const struct spaghetti_module_driver spaghetti_sht40_driver;`. Keep the temporary bring-up API until the operation-table path is proven.

---

## Why

Registry should store a tested driver descriptor.

---

## Called / used by

Temporary main harness.

---

## Trigger

BOOT/PERIODIC READ.

---

## Invocation mechanism

DIRECT CALL through operation table.

---

## Execution context

Main thread.

---

## Calls / dependencies

Temporary SHT4x Sensor wrapper.

---

## Inputs

Module with Port 0 and output sample.

---

## Outputs

Same real values as Milestone 4.

---

## Errors to handle

Missing op, incompatible Port, prior sensor errors.

---

## Do NOT implement yet

- Registry/Manager lookup or zbus

---

## Steps

- [ ] Open only `spaghetti_modules/sht40/sht40.h`.
- [ ] Declare the immutable exported descriptor `extern const struct spaghetti_module_driver spaghetti_sht40_driver;`.
- [ ] Keep the temporary bring-up API until the operation-table path is proven.
- [ ] Handle only these realistic errors: Missing op, incompatible Port, prior sensor errors.
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

Ensure main never calls `sensor_*` or SHT40 concrete functions directly;
it calls operation pointers.

---

## Expected result

Measurements unchanged through generic driver contract.

---

## Completion checklist

- [ ] Required documentation or implementation file changed as specified
- [ ] Named type, function, configuration, or test exists
- [ ] Build succeeds when this task requires a build
- [ ] Task-specific test passes
- [ ] No unrelated functionality was added

---

## Commit suggestion

`module: declare the sht40 driver descriptor`

---

## Next task

[TASK-050-05](TASK-050-05-adapt-sht40-to-driver-operations.md) — Adapt SHT40 to driver operations
