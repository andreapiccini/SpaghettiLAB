# TASK-030-06 — Add Port to CMake

**Status:** ⬜ TODO  
**Phase:** 030 — Port  
**Depends on:** [TASK-030-05](TASK-030-05-bind-port-0-to-the-i2c-device.md)  
**Estimated scope:** Small

---

## Goal

Complete **Add Port to CMake** and produce this focused outcome:

`Port 0: I2C ready`-equivalent log.

---

## Open

`CMakeLists.txt`.

---

## Write / Modify

Add `subsys/port/port.c` to the existing `target_sources(app PRIVATE ...)` list. Make no other build-system changes.

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

BUILD TIME

---

## Execution context

build time

---

## Calls / dependencies

Port init/count/capability.

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

- [ ] Open only `CMakeLists.txt`.
- [ ] Add `subsys/port/port.c` to the existing `target_sources(app PRIVATE ...)` list.
- [ ] Make no other build-system changes.
- [ ] Handle only these realistic errors: Propagate negative Port error; no silent READY.
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

`port: add port to cmake`

---

## Next task

[TASK-030-07](TASK-030-07-initialize-port-from-core.md) — Initialize Port from Core
