# TASK-030-07 — Initialize Port from Core

**Status:** ⬜ TODO  
**Phase:** 030 — Port  
**Depends on:** [TASK-030-06](TASK-030-06-add-port-to-cmake.md)  
**Estimated scope:** Small

---

## Goal

Complete **Initialize Port from Core** and produce this focused outcome:

`Port 0: I2C ready`-equivalent log.

---

## Open

`subsys/core/core.c`.

---

## Write / Modify

Call `spaghetti_port_init_all()` from `spaghetti_core_init()`. Propagate a negative result before setting Core READY. On success, log the Port count and whether Port 0 has I2C.

---

## Why

SHT40 should not be added until Port reports the real controller ready.

---

## Called / used by

Build and Core.

---

## Trigger

BOOT.

---

## Invocation mechanism

BUILD TIME then DIRECT CALL.

---

## Execution context

Main thread.

---

## Calls / dependencies

`spaghetti_port_init_all()`, `spaghetti_port_count()`, `spaghetti_port_get()`, and `spaghetti_port_has_capability()`.

---

## Inputs

Enabled controller from Milestone 2.

---

## Outputs

`Port 0: I2C ready`-equivalent log.

---

## Errors to handle

Propagate negative Port error; no silent READY.

---

## Do NOT implement yet

- SHT40 or registry

---

## Steps

- [ ] Open only `subsys/core/core.c`.
- [ ] Call `spaghetti_port_init_all()` from `spaghetti_core_init()`. Propagate a negative result before setting Core READY. On success, log the Port count and whether Port 0 has I2C.
- [ ] Handle only these realistic errors: Propagate negative Port error; no silent READY.
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

Boot normally, then temporarily disable the controller in a test branch
and confirm Port init fails; restore it immediately.

---

## Expected result

One port found; invalid ID returns `NULL`; I2C device ready.

---

## Completion checklist

- [ ] Required documentation or implementation file changed as specified
- [ ] Named type, function, configuration, or test exists
- [ ] Build succeeds when this task requires a build
- [ ] Task-specific test passes
- [ ] No unrelated functionality was added

---

## Commit suggestion

`port: initialize port from core`

---

## Next task

[TASK-030-08](TASK-030-08-test-port-success-and-invalid-ids.md) — Test Port success and invalid IDs
