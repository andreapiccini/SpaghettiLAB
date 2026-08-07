# TASK-060-04 — Initialize the Registry from Core

**Status:** ⬜ TODO  
**Phase:** 060 — Driver Registry  
**Depends on:** [TASK-060-03](TASK-060-03-validate-registry-entries.md)  
**Estimated scope:** Small

---

## Goal

Complete **Initialize the Registry from Core** and produce this focused outcome:

Exact pointer/null behavior.

---

## Open

`CMakeLists.txt` and `subsys/core/core.c`.

---

## Write / Modify

Add `subsys/driver_registry/driver_registry.c` to the application sources. Call registry init from Core after Port initialization and propagate a negative result before Core becomes READY.

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

- [ ] Open only `CMakeLists.txt` and `subsys/core/core.c`.
- [ ] Add `subsys/driver_registry/driver_registry.c` to the application sources.
- [ ] Call registry init from Core after Port initialization and propagate a negative result before Core becomes READY.
- [ ] Handle only these realistic errors: Registry init error stops Core readiness.
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

Observe known success/unknown rejection and continued sensor reading.

---

## Expected result

No crash or fallback for unknown ID.

---

## Completion checklist

- [ ] Required documentation or implementation file changed as specified
- [ ] Named type, function, configuration, or test exists
- [ ] Build succeeds when this task requires a build
- [ ] Task-specific test passes
- [ ] No unrelated functionality was added

---

## Commit suggestion

`driver: initialize the registry from core`

---

## Next task

[TASK-060-05](TASK-060-05-test-known-and-unknown-driver-lookup.md) — Test known and unknown driver lookup
