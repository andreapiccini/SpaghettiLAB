# TASK-060-03 — Validate registry entries

**Status:** ⬜ TODO  
**Phase:** 060 — Driver Registry  
**Depends on:** [TASK-060-02](TASK-060-02-implement-the-fixed-driver-table.md)  
**Estimated scope:** Small

---

## Goal

Complete **Validate registry entries** and produce this focused outcome:

SHT40 pointer or `NULL`.

---

## Open

`subsys/driver_registry/driver_registry.c`.

---

## Write / Modify

Implement `spaghetti_driver_registry_init()` validation for null descriptors, null/empty type IDs, missing required operation pointers, and duplicate type IDs. Return the first realistic error without modifying the const table.

---

## Why

One driver does not justify linker magic or a hash table.

---

## Called / used by

Core/Manager.

---

## Trigger

BOOT/LOOKUP.

---

## Invocation mechanism

DIRECT CALL.

---

## Execution context

Caller thread; immutable after init.

---

## Calls / dependencies

SHT40 descriptor and standard bounded string comparison.

---

## Inputs

`"sht40"` or another ID.

---

## Outputs

SHT40 pointer or `NULL`.

---

## Errors to handle

Duplicate/invalid table; unknown lookup is normal.

---

## Do NOT implement yet

- Locking
- frozen lookup needs none

---

## Steps

- [ ] Open only `subsys/driver_registry/driver_registry.c`.
- [ ] Implement `spaghetti_driver_registry_init()` validation for null descriptors, null/empty type IDs, missing required operation pointers, and duplicate type IDs.
- [ ] Return the first realistic error without modifying the const table.
- [ ] Handle only these realistic errors: Duplicate/invalid table; unknown lookup is normal.
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

Local test path for known and unknown IDs.

---

## Expected result

Deterministic linear registry.

---

## Completion checklist

- [ ] Required documentation or implementation file changed as specified
- [ ] Named type, function, configuration, or test exists
- [ ] Build succeeds when this task requires a build
- [ ] Task-specific test passes
- [ ] No unrelated functionality was added

---

## Commit suggestion

`driver: validate registry entries`

---

## Next task

[TASK-060-04](TASK-060-04-initialize-the-registry-from-core.md) — Initialize the Registry from Core
