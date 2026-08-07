# TASK-010-04 — Call Core from main

**Status:** ⬜ TODO  
**Phase:** 010 — Core  
**Depends on:** [TASK-010-03](TASK-010-03-add-core-to-the-application-build.md)  
**Estimated scope:** Small

---

## Goal

Complete **Call Core from main** and produce this focused outcome:

Core log then uptime.

---

## Open

`src/main.c`.

---

## Write / Modify

Include `<spaghetti/core.h>`, call
`spaghetti_core_init()` once before the existing uptime loop, log/print its
negative return and stop/return on failure. Keep the uptime loop for proof.

---

## Why

The boundary is useful only when exercised.

---

## Called / used by

Zephyr invokes `main`; `main` calls Core.

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

`spaghetti_core_init()`.

---

## Inputs

None.

---

## Outputs

Core log then uptime.

---

## Errors to handle

Negative init result.

---

## Do NOT implement yet

- Move the loop into Core or start other threads

---

## Steps

- [ ] Open only `src/main.c`.
- [ ] Include `<spaghetti/core.h>`, call `spaghetti_core_init()` once before the existing uptime loop, log/print its negative return and stop/return on failure.
- [ ] Keep the uptime loop for proof.
- [ ] Handle only these realistic errors: Negative init result.
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

Reset and read console.

---

## Expected result

`Spaghetti Core ready`, then unchanged uptime behavior.

---

## Completion checklist

- [ ] Required documentation or implementation file changed as specified
- [ ] Named type, function, configuration, or test exists
- [ ] Build succeeds when this task requires a build
- [ ] Task-specific test passes
- [ ] No unrelated functionality was added

---

## Commit suggestion

`core: call core from main`

---

## Next task

[TASK-010-05](TASK-010-05-build-and-flash-the-core-boundary.md) — Build and flash the Core boundary
