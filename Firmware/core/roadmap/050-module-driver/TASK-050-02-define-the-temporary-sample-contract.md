# TASK-050-02 — Define the temporary sample contract

**Status:** ⬜ TODO  
**Phase:** 050 — Module + Module Driver  
**Depends on:** [TASK-050-01](TASK-050-01-define-the-minimal-module-instance.md)  
**Estimated scope:** Small

---

## Goal

Complete **Define the temporary sample contract** and produce this focused outcome:

One bounded sample value that can cross the driver operation table.

---

## Open

`include/spaghetti/data.h` or `include/spaghetti/module_driver.h`, choosing one location and documenting it.

---

## Write / Modify

Define only the temperature and humidity fields needed by the current SHT40 read as `struct spaghetti_sample`. Do not add generalized channels, metadata maps, or heap-owned payloads.

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

One bounded sample value that can cross the driver operation table.

---

## Errors to handle

Null ops/module, unsupported capability, I/O failure.

---

## Do NOT implement yet

- Command/configure/probe/power callback or ABI version

---

## Steps

- [ ] Open only `include/spaghetti/data.h` or `include/spaghetti/module_driver.h`, choosing one location and documenting it.
- [ ] Define only the temperature and humidity fields needed by the current SHT40 read as `struct spaghetti_sample`.
- [ ] Do not add generalized channels, metadata maps, or heap-owned payloads.
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

`module: define the temporary sample contract`

---

## Next task

[TASK-050-03](TASK-050-03-define-the-module-driver-operation-table.md) — Define the module-driver operation table
