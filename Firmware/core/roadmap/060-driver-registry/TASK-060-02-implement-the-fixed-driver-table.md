# TASK-060-02 — Implement the fixed driver table

**Status:** ⬜ TODO  
**Phase:** 060 — Driver Registry  
**Depends on:** [TASK-060-01](TASK-060-01-declare-the-driver-registry-api.md)  
**Estimated scope:** Small

---

## Goal

Complete **Implement the fixed driver table** and produce this focused outcome:

SHT40 pointer or `NULL`.

---

## Open

`subsys/driver_registry/driver_registry.c`.

---

## Write / Modify

Create a private immutable pointer array containing `&spaghetti_sht40_driver`. Implement exact-string `spaghetti_driver_registry_find()` and the optional count getter with null-safe behavior.

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
- [ ] Create a private immutable pointer array containing `&spaghetti_sht40_driver`.
- [ ] Implement exact-string `spaghetti_driver_registry_find()` and the optional count getter with null-safe behavior.
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

`driver: implement the fixed driver table`

---

## Next task

[TASK-060-03](TASK-060-03-validate-registry-entries.md) — Validate registry entries
