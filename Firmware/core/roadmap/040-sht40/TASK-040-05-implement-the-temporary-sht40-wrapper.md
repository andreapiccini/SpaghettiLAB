# TASK-040-05 — Implement the temporary SHT40 wrapper

**Status:** ⬜ TODO  
**Phase:** 040 — SHT40 vertical slice  
**Depends on:** [TASK-040-04](TASK-040-04-declare-the-temporary-sht40-wrapper-api.md)  
**Estimated scope:** Small

---

## Goal

Complete **Implement the temporary SHT40 wrapper** and produce this focused outcome:

`0` and two sensor values.

---

## Open

Create `spaghetti_modules/sht40/sht40.c`.

---

## Write / Modify

Obtain `DEVICE_DT_GET(DT_NODELABEL(sht40_test))`; implement init with `device_is_ready()`. Implement read with `sensor_sample_fetch()` followed by `sensor_channel_get()` for ambient temperature and humidity. Validate both output pointers and propagate each Zephyr error.

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

The Sensor API normalizes sensor channels through `struct sensor_value`. Keep this wrapper synchronous and do not add a thread.

---

## Steps

- [ ] Open only Create `spaghetti_modules/sht40/sht40.c`.
- [ ] Obtain `DEVICE_DT_GET(DT_NODELABEL(sht40_test))`
- [ ] implement init with `device_is_ready()`.
- [ ] Implement read with `sensor_sample_fetch()` followed by `sensor_channel_get()` for ambient temperature and humidity.
- [ ] Validate both output pointers and propagate each Zephyr error.
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

`sht40: implement the temporary sht40 wrapper`

---

## Next task

[TASK-040-06](TASK-040-06-add-the-sht40-wrapper-to-cmake.md) — Add the SHT40 wrapper to CMake
