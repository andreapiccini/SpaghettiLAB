# TASK-060-01 — Declare the Driver Registry API

**Status:** ⬜ TODO  
**Phase:** 060 — Driver Registry  
**Depends on:** [TASK-050-06](../050-module-driver/TASK-050-06-exercise-sht40-through-the-operation-table.md)  
**Estimated scope:** Small

---

## Goal

Complete **Declare the Driver Registry API** and produce this focused outcome:

Const descriptor or `NULL` for unknown.

---

## Open

`include/spaghetti/driver_registry.h`.

---

## Write / Modify

Declare `int spaghetti_driver_registry_init(void);`,
`const struct spaghetti_module_driver *spaghetti_driver_registry_find(const char
*type_id);`, and optionally `size_t spaghetti_driver_registry_count(void);`.

---

## Why

The tested SHT40 descriptor is ready to register.

---

## Called / used by

Core initializes; Manager finds; Communication later counts.

---

## Trigger

BOOT/MODULE CONFIGURATION.

---

## Invocation mechanism

DIRECT CALL.

---

## Execution context

Main/calling thread.

---

## Calls / dependencies

Module Driver type.

---

## Inputs

Null-terminated bounded type ID.

---

## Outputs

Const descriptor or `NULL` for unknown.

---

## Errors to handle

Null/empty key and duplicate descriptors during init.

---

## Do NOT implement yet

- Runtime registration, hash table, iterable sections

---

## Steps

- [ ] Open only `include/spaghetti/driver_registry.h`.
- [ ] Declare `int spaghetti_driver_registry_init(void);`, `const struct spaghetti_module_driver *spaghetti_driver_registry_find(const char *type_id);`, and optionally `size_t spaghetti_driver_registry_count(void);`.
- [ ] Handle only these realistic errors: Null/empty key and duplicate descriptors during init.
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

API review: Registry never initializes the driver.

---

## Expected result

Minimal immutable lookup contract.

---

## Completion checklist

- [ ] Required documentation or implementation file changed as specified
- [ ] Named type, function, configuration, or test exists
- [ ] Build succeeds when this task requires a build
- [ ] Task-specific test passes
- [ ] No unrelated functionality was added

---

## Commit suggestion

`driver: declare the driver registry api`

---

## Next task

[TASK-060-02](TASK-060-02-implement-the-fixed-driver-table.md) — Implement the fixed driver table
