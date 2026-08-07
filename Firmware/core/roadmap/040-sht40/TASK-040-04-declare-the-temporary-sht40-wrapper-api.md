# TASK-040-04 — Declare the temporary SHT40 wrapper API

**Status:** ⬜ TODO  
**Phase:** 040 — SHT40 vertical slice  
**Depends on:** [TASK-040-03](TASK-040-03-enable-the-sensor-api.md)  
**Estimated scope:** Small

---

## Goal

Complete **Declare the temporary SHT40 wrapper API** and produce this focused outcome:

`0` and two sensor values.

---

## Open

Create `spaghetti_modules/sht40/sht40.h`.

---

## Write / Modify

Add an include guard and declare `spaghetti_sht40_test_init()` plus `spaghetti_sht40_test_read(struct sensor_value *temperature, struct sensor_value *humidity)`. Include or forward-declare only what these signatures require.

> [!WARNING]
> TEMPORARY SHORTCUT
>
> This bring-up API is intentionally temporary and will be removed in [TASK-080-05](../080-runtime-removable-sht40/TASK-080-05-remove-the-static-sensor-shortcut.md).


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

## Steps

- [ ] Open only Create `spaghetti_modules/sht40/sht40.h`.
- [ ] Add an include guard and declare `spaghetti_sht40_test_init()` plus `spaghetti_sht40_test_read(struct sensor_value *temperature, struct sensor_value *humidity)`. Include or forward-declare only what these signatures require.
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

`sht40: declare the temporary sht40 wrapper api`

---

## Next task

[TASK-040-05](TASK-040-05-implement-the-temporary-sht40-wrapper.md) — Implement the temporary SHT40 wrapper
