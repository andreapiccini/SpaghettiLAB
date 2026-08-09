# TASK-040-09 — Flash and test the real SHT40

**Status:** ⬜ TODO  
**Phase:** 040 — SHT40 vertical slice  
**Depends on:** [TASK-040-08](TASK-040-08-build-and-inspect-the-sht40-image.md)  
**Estimated scope:** Small

---

## Goal

Complete **Flash and test the real SHT40** and produce this focused outcome:

Temperature and humidity once per second.

---

## Open

The connected SHT40 hardware, root `README.md`, and serial console.

---

## Write / Modify

Flash the current image, observe plausible temperature and humidity once per second, then disconnect the sensor and verify the read path reports a controlled error. Restore the hardware after the test.

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

- [ ] Open only The connected SHT40 hardware, root `README.md`, and serial console.
- [ ] Flash the current image, observe plausible temperature and humidity once per second, then disconnect the sensor and verify the read path reports a controlled error. Restore the hardware after the test.
- [ ] Handle only these realistic errors: Init/read failure; log and retry only with a clear policy.
- [ ] Confirm no item from **Do NOT implement yet** was added
- [ ] Run the task test and compare it with **Expected result**

---

## Build

YES — `make build`

---

## Flash

YES — run `make flash`, then `make screen`; pass `PORT=...` only when needed.

---

## Test

Observe plausible temperature/humidity; disconnect sensor and verify a
bounded error rather than crash/hang; reconnect/reset.

---

## Expected result

Real temperature and humidity are visible, and a missing sensor does not crash or reset the board.

---

## Completion checklist

- [ ] Required documentation or implementation file changed as specified
- [ ] Named type, function, configuration, or test exists
- [ ] Build succeeds when this task requires a build
- [ ] Task-specific test passes
- [ ] No unrelated functionality was added

---

## Commit suggestion

`sht40: flash and test the real sht40`

---

## Next task

[TASK-050-01](../050-module-driver/TASK-050-01-define-the-minimal-module-instance.md) — Define the minimal module instance
