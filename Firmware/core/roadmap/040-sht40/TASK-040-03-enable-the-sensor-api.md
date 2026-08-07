# TASK-040-03 — Enable the Sensor API

**Status:** ⬜ TODO  
**Phase:** 040 — SHT40 vertical slice  
**Depends on:** [TASK-040-02](TASK-040-02-add-the-temporary-sht40-devicetree-node.md)  
**Estimated scope:** Small

---

## Goal

Complete **Enable the Sensor API** and produce this focused outcome:

`0` and two sensor values.

---

## Open

`prj.conf`.

---

## Write / Modify

Add `CONFIG_SENSOR=y`. After configuration, confirm `CONFIG_SHT4X=y` is selected automatically by the enabled compatible node; do not force unrelated sensor drivers.

---

## Why

A working sensor result is the next vertical-slice proof.

---

## Called / used by

Temporary `main` test.

---

## Trigger

BOOT and periodic test call.

---

## Invocation mechanism

DIRECT CALL.

---

## Execution context

Main thread.

---

## Calls / dependencies

Zephyr Device and Sensor APIs.

---

## Inputs

Two output pointers.

---

## Outputs

`0` and two sensor values.

---

## Errors to handle

`-EINVAL`, device not ready, fetch/get error.

---

## Do NOT implement yet

- zbus, driver registry, own thread, heater

---

## Zephyr note

Kconfig selects the Sensor API and driver code at build time. The board overlay selects the concrete SHT4x device instance.

---

## Steps

- [ ] Open only `prj.conf`.
- [ ] Add `CONFIG_SENSOR=y`. After configuration, confirm `CONFIG_SHT4X=y` is selected automatically by the enabled compatible node
- [ ] do not force unrelated sensor drivers.
- [ ] Handle only these realistic errors: `-EINVAL`, device not ready, fetch/get error.
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

Review every lower call's return value.

---

## Expected result

Thin wrapper, no loop.

---

## Completion checklist

- [ ] Required documentation or implementation file changed as specified
- [ ] Named type, function, configuration, or test exists
- [ ] Build succeeds when this task requires a build
- [ ] Task-specific test passes
- [ ] No unrelated functionality was added

---

## Commit suggestion

`sht40: enable the sensor api`

---

## Next task

[TASK-040-04](TASK-040-04-declare-the-temporary-sht40-wrapper-api.md) — Declare the temporary SHT40 wrapper API
