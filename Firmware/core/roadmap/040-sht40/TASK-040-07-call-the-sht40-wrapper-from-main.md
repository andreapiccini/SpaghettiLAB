# TASK-040-07 — Call the SHT40 wrapper from main

**Status:** ⬜ TODO  
**Phase:** 040 — SHT40 vertical slice  
**Depends on:** [TASK-040-06](TASK-040-06-add-the-sht40-wrapper-to-cmake.md)  
**Estimated scope:** Small

---

## Goal

Complete **Call the SHT40 wrapper from main** and produce this focused outcome:

Temperature and humidity once per second.

---

## Open

`src/main.c`.

---

## Write / Modify

After Core initialization, call `spaghetti_sht40_test_init()` once. In the existing loop, call the temporary read once per second and print both `sensor_value` values using integer `val1` and six-digit absolute `val2`; handle read errors without float printf.

---

## Why

Do not proceed to abstractions without real bus/sensor proof.

---

## Called / used by

Main test harness.

---

## Trigger

BOOT/PERIODIC TEST LOOP.

---

## Invocation mechanism

DIRECT CALL and `k_sleep`, not `K_TIMER` yet.

---

## Execution context

Main thread.

---

## Calls / dependencies

Temporary wrapper -> Sensor API -> I2C.

---

## Inputs

Connected powered SHT40.

---

## Outputs

Temperature and humidity once per second.

---

## Errors to handle

Init/read failure; log and retry only with a clear policy.

---

## Do NOT implement yet

- Runtime scheduling, zbus, MQTT

---

## Steps

- [ ] Open only `src/main.c`.
- [ ] After Core initialization, call `spaghetti_sht40_test_init()` once. In the existing loop, call the temporary read once per second and print both `sensor_value` values using integer `val1` and six-digit absolute `val2`
- [ ] handle read errors without float printf.
- [ ] Handle only these realistic errors: Init/read failure; log and retry only with a clear policy.
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

Observe plausible temperature/humidity; disconnect sensor and verify a
bounded error rather than crash/hang; reconnect/reset.

---

## Expected result

Real SHT40 values in serial log.

---

## Completion checklist

- [ ] Required documentation or implementation file changed as specified
- [ ] Named type, function, configuration, or test exists
- [ ] Build succeeds when this task requires a build
- [ ] Task-specific test passes
- [ ] No unrelated functionality was added

---

## Commit suggestion

`sht40: call the sht40 wrapper from main`

---

## Next task

[TASK-040-08](TASK-040-08-build-and-inspect-the-sht40-image.md) — Build and inspect the SHT40 image
