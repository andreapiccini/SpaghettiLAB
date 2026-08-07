# TASK-080-03 — Implement direct-I2C SHT40 measurement

**Status:** ⬜ TODO  
**Phase:** 080 — Runtime-removable SHT40  
**Depends on:** [TASK-080-02](TASK-080-02-pass-bounded-driver-configuration-through-manager.md)  
**Estimated scope:** Medium

---

## Goal

Complete **Implement direct-I2C SHT40 measurement** and produce this focused outcome:

Same real values as static driver path.

---

## Open

`spaghetti_modules/sht40/sht40.c` and the exact SHT40 datasheet.

---

## Write / Modify

Replace Sensor API fetch/get inside driver init/read with `spaghetti_port_i2c_device()` and the minimum `i2c_write`, `i2c_read`, or `i2c_write_read` transaction for the chosen measurement mode. Keep protocol constants traceable to datasheet sections.

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

## Zephyr note

Zephyr I2C calls may block and belong in thread context. The driver must use the Port-owned controller rather than instantiate a removable sensor in Devicetree.

---

## Steps

- [ ] Open only `spaghetti_modules/sht40/sht40.c` and the exact SHT40 datasheet.
- [ ] Replace Sensor API fetch/get inside driver init/read with `spaghetti_port_i2c_device()` and the minimum `i2c_write`, `i2c_read`, or `i2c_write_read` transaction for the chosen measurement mode.
- [ ] Keep protocol constants traceable to datasheet sections.
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

`runtime-removable: implement direct-i2c sht40 measurement`

---

## Next task

[TASK-080-04](TASK-080-04-validate-crc-and-convert-sht40-samples.md) — Validate CRC and convert SHT40 samples
