# TASK-070-05 — Integrate Manager into Core and main

**Status:** ⬜ TODO  
**Phase:** 070 — Module Manager  
**Depends on:** [TASK-070-04](TASK-070-04-implement-manager-read.md)  
**Estimated scope:** Small

---

## Goal

Complete **Integrate Manager into Core and main** and produce this focused outcome:

Instance READY and values.

---

## Open

`CMakeLists.txt`, `subsys/core/core.c`, and `src/main.c`.

---

## Write / Modify

Add Manager source to CMake. Initialize it from Core after Registry. In `main`, remove the main-owned module object, configure Port 0 as `sht40`, retain the returned module ID, and read only through Manager.

> [!WARNING]
> TEMPORARY SHORTCUT
>
> The hardcoded Port 0/SHT40 assignment is intentionally temporary and will be removed in [TASK-090-05](../090-config/TASK-090-05-add-and-apply-one-hardcoded-c-config.md).


---

## Why

Internal Config can later call exactly this Manager API.

---

## Called / used by

Main test.

---

## Trigger

BOOT/PERIODIC LOOP.

---

## Invocation mechanism

DIRECT CALL.

---

## Execution context

Main thread.

---

## Calls / dependencies

Manager -> Registry -> driver -> current static sensor.

---

## Inputs

Port 0, `sht40`.

---

## Outputs

Instance READY and values.

---

## Errors to handle

Log exact configure/read errno.

---

## Do NOT implement yet

- Config struct or CBOR

---

## Steps

- [ ] Open only `CMakeLists.txt`, `subsys/core/core.c`, and `src/main.c`.
- [ ] Add Manager source to CMake. Initialize it from Core after Registry. In `main`, remove the main-owned module object, configure Port 0 as `sht40`, retain the returned module ID, and read only through Manager.
- [ ] Handle only these realistic errors: Log exact configure/read errno.
- [ ] Confirm no item from **Do NOT implement yet** was added
- [ ] Run the task test and compare it with **Expected result**

---

## Build

YES — `make build`

---

## Flash

NO

---

## Test

Also request unknown type and occupied Port in controlled test, then
restore valid path.

---

## Expected result

Real values now pass through Manager.

---

## Completion checklist

- [ ] Required documentation or implementation file changed as specified
- [ ] Named type, function, configuration, or test exists
- [ ] Build succeeds when this task requires a build
- [ ] Task-specific test passes
- [ ] No unrelated functionality was added

---

## Commit suggestion

`module: integrate manager into core and main`

---

## Next task

[TASK-070-06](TASK-070-06-test-manager-success-and-rollback.md) — Test Manager success and rollback
