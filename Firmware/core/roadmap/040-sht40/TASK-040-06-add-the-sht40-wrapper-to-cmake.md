# TASK-040-06 — Add the SHT40 wrapper to CMake

**Status:** ⬜ TODO  
**Phase:** 040 — SHT40 vertical slice  
**Depends on:** [TASK-040-05](TASK-040-05-implement-the-temporary-sht40-wrapper.md)  
**Estimated scope:** Small

---

## Goal

Complete **Add the SHT40 wrapper to CMake** and produce this focused outcome:

Temperature and humidity once per second.

---

## Open

`CMakeLists.txt`.

---

## Write / Modify

Add `spaghetti_modules/sht40/sht40.c` to `target_sources(app PRIVATE ...)` without changing other sources.

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

BUILD TIME

---

## Execution context

build time

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

- [ ] Open only `CMakeLists.txt`.
- [ ] Add `spaghetti_modules/sht40/sht40.c` to `target_sources(app PRIVATE ...)` without changing other sources.
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

`sht40: add the sht40 wrapper to cmake`

---

## Next task

[TASK-040-07](TASK-040-07-call-the-sht40-wrapper-from-main.md) — Call the SHT40 wrapper from main
