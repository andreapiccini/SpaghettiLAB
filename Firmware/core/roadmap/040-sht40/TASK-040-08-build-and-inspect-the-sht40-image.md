# TASK-040-08 — Build and inspect the SHT40 image

**Status:** ⬜ TODO  
**Phase:** 040 — SHT40 vertical slice  
**Depends on:** [TASK-040-07](TASK-040-07-call-the-sht40-wrapper-from-main.md)  
**Estimated scope:** Small

---

## Goal

Complete **Build and inspect the SHT40 image** and produce this focused outcome:

Temperature and humidity once per second.

---

## Open

`build/zephyr/.config`, `build/zephyr/zephyr.dts`, and `build/zephyr/zephyr.bin`.

---

## Write / Modify

Run a pristine build. Confirm `CONFIG_SENSOR=y`, `CONFIG_SHT4X=y`, the `sht40_test` node is enabled at the verified address, and the firmware binary exists. Do not edit generated files.

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

- [ ] Open only `build/zephyr/.config`, `build/zephyr/zephyr.dts`, and `build/zephyr/zephyr.bin`.
- [ ] Run a pristine build.
- [ ] Confirm `CONFIG_SENSOR=y`, `CONFIG_SHT4X=y`, the `sht40_test` node is enabled at the verified address, and the firmware binary exists.
- [ ] Do not edit generated files.
- [ ] Handle only these realistic errors: Init/read failure; log and retry only with a clear policy.
- [ ] Confirm no item from **Do NOT implement yet** was added
- [ ] Run the task test and compare it with **Expected result**

---

## Build

YES — `make pristine`

---

## Flash

NO

---

## Test

Observe plausible temperature/humidity; disconnect sensor and verify a
bounded error rather than crash/hang; reconnect/reset.

---

## Expected result

The static SHT4x instance and wrapper compile into a flashable image.

---

## Completion checklist

- [ ] Required documentation or implementation file changed as specified
- [ ] Named type, function, configuration, or test exists
- [ ] Build succeeds when this task requires a build
- [ ] Task-specific test passes
- [ ] No unrelated functionality was added

---

## Commit suggestion

`sht40: build and inspect the sht40 image`

---

## Next task

[TASK-040-09](TASK-040-09-flash-and-test-the-real-sht40.md) — Flash and test the real SHT40
