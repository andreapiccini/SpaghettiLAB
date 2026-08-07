# TASK-080-04 — Validate CRC and convert SHT40 samples

**Status:** ⬜ TODO  
**Phase:** 080 — Runtime-removable SHT40  
**Depends on:** [TASK-080-03](TASK-080-03-implement-direct-i2c-sht40-measurement.md)  
**Estimated scope:** Small

---

## Goal

Complete **Validate CRC and convert SHT40 samples** and produce this focused outcome:

Same real values as static driver path.

---

## Open

`spaghetti_modules/sht40/sht40.c`.

---

## Write / Modify

Implement the datasheet CRC check for both raw values. Convert raw temperature and humidity into the existing bounded sample representation, clamp only where the datasheet requires it, and return an error for a CRC mismatch.

---

## Why

The standard Zephyr SHT4x driver requires static DT instantiation.

---

## Called / used by

Manager through driver ops.

---

## Trigger

MODULE INIT/READ.

---

## Invocation mechanism

DIRECT CALL.

---

## Execution context

Manager/Runtime thread; bounded sleep if datasheet requires.

---

## Calls / dependencies

Port API and Zephyr I2C API.

---

## Inputs

Port, runtime address, output sample.

---

## Outputs

Same real values as static driver path.

---

## Errors to handle

NACK, timeout, CRC, invalid raw response, removal during read.

---

## Do NOT implement yet

- Async I2C, heater modes, automatic probing

---

## Steps

- [ ] Open only `spaghetti_modules/sht40/sht40.c`.
- [ ] Implement the datasheet CRC check for both raw values. Convert raw temperature and humidity into the existing bounded sample representation, clamp only where the datasheet requires it, and return an error for a CRC mismatch.
- [ ] Handle only these realistic errors: NACK, timeout, CRC, invalid raw response, removal during read.
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

Real reading and disconnected-sensor error; compare plausible values with
Milestone 4 output.

---

## Expected result

Driver no longer calls Sensor API.

---

## Completion checklist

- [ ] Required documentation or implementation file changed as specified
- [ ] Named type, function, configuration, or test exists
- [ ] Build succeeds when this task requires a build
- [ ] Task-specific test passes
- [ ] No unrelated functionality was added

---

## Commit suggestion

`runtime-removable: validate crc and convert sht40 samples`

---

## Next task

[TASK-080-05](TASK-080-05-remove-the-static-sensor-shortcut.md) — Remove the static sensor shortcut
