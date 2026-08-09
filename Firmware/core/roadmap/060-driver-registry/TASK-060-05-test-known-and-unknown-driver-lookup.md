# TASK-060-05 — Test known and unknown driver lookup

**Status:** ⬜ TODO  
**Phase:** 060 — Driver Registry  
**Depends on:** [TASK-060-04](TASK-060-04-initialize-the-registry-from-core.md)  
**Estimated scope:** Small

---

## Goal

Complete **Test known and unknown driver lookup** and produce this focused outcome:

Exact pointer/null behavior.

---

## Open

`src/main.c` or a temporary focused test location and the serial console.

---

## Write / Modify

Call `spaghetti_driver_registry_find("sht40")`, `find("does-not-exist")`, and `find(NULL)`. Log/assert a non-null known descriptor and null invalid/unknown results, then preserve the current real read path.

---

## Why

Manager must receive a trustworthy Registry.

---

## Called / used by

Core/test.

---

## Trigger

BOOT.

---

## Invocation mechanism

DIRECT CALL.

---

## Execution context

Main thread.

---

## Calls / dependencies

Registry APIs.

---

## Inputs

Known/unknown strings.

---

## Outputs

Exact pointer/null behavior.

---

## Errors to handle

Registry init error stops Core readiness.

---

## Do NOT implement yet

- Manager or dynamic configuration

---

## Steps

- [ ] Open only `src/main.c` or a temporary focused test location and the serial console.
- [ ] Call `spaghetti_driver_registry_find("sht40")`, `find("does-not-exist")`, and `find(NULL)`. Log/assert a non-null known descriptor and null invalid/unknown results, then preserve the current real read path.
- [ ] Handle only these realistic errors: Registry init error stops Core readiness.
- [ ] Confirm no item from **Do NOT implement yet** was added
- [ ] Run the task test and compare it with **Expected result**

---

## Build

YES — `make build`

---

## Flash

YES — run `make flash`, then `make screen`; pass `PORT=...` only when needed.

---

## Test

Observe known success/unknown rejection and continued sensor reading.

---

## Expected result

Known lookup succeeds, unknown and null lookups fail cleanly, and the SHT40 still reads.

---

## Completion checklist

- [ ] Required documentation or implementation file changed as specified
- [ ] Named type, function, configuration, or test exists
- [ ] Build succeeds when this task requires a build
- [ ] Task-specific test passes
- [ ] No unrelated functionality was added

---

## Commit suggestion

`driver: test known and unknown driver lookup`

---

## Next task

[TASK-070-01](../070-module-manager/TASK-070-01-declare-the-module-manager-api.md) — Declare the Module Manager API
