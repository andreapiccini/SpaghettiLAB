# TASK-050-03 — Define the module-driver operation table

**Status:** ⬜ TODO  
**Phase:** 050 — Module + Module Driver  
**Depends on:** [TASK-050-02](TASK-050-02-define-the-temporary-sample-contract.md)  
**Estimated scope:** Small

---

## Goal

Complete **Define the module-driver operation table** and produce this focused outcome:

`0` or negative errno.

---

## Open

`include/spaghetti/module_driver.h`.

---

## Write / Modify

Define `spaghetti_module_driver_ops` with synchronous `init`, `read`, and `deinit` pointers. Define immutable `spaghetti_module_driver` fields `type_id`, `required_capabilities`, and `ops`. Forward-declare module and sample types instead of creating cyclic includes.

---

## Why

SHT40 must prove the operation table before Registry exists.

---

## Called / used by

SHT40 implementation and future Manager.

---

## Trigger

MODULE LIFECYCLE/READ.

---

## Invocation mechanism

DIRECT CALL through function pointers.

---

## Execution context

Caller thread.

---

## Calls / dependencies

Module and Port capability types.

---

## Inputs

Module pointer and sample output.

---

## Outputs

`0` or negative errno.

---

## Errors to handle

Null ops/module, unsupported capability, I/O failure.

---

## Do NOT implement yet

- Command/configure/probe/power callback or ABI version

---

## Steps

- [ ] Open only `include/spaghetti/module_driver.h`.
- [ ] Define `spaghetti_module_driver_ops` with synchronous `init`, `read`, and `deinit` pointers.
- [ ] Define immutable `spaghetti_module_driver` fields `type_id`, `required_capabilities`, and `ops`. Forward-declare module and sample types instead of creating cyclic includes.
- [ ] Handle only these realistic errors: Null ops/module, unsupported capability, I/O failure.
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

Review that driver does not own the module instance.

---

## Expected result

Three-operation contract only.

---

## Completion checklist

- [ ] Required documentation or implementation file changed as specified
- [ ] Named type, function, configuration, or test exists
- [ ] Build succeeds when this task requires a build
- [ ] Task-specific test passes
- [ ] No unrelated functionality was added

---

## Commit suggestion

`module: define the module-driver operation table`

---

## Next task

[TASK-050-04](TASK-050-04-declare-the-sht40-driver-descriptor.md) — Declare the SHT40 driver descriptor
