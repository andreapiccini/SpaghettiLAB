# TASK-050-05 — Adapt SHT40 to driver operations

**Status:** ⬜ TODO  
**Phase:** 050 — Module + Module Driver  
**Depends on:** [TASK-050-04](TASK-050-04-declare-the-sht40-driver-descriptor.md)  
**Estimated scope:** Small

---

## Goal

Complete **Adapt SHT40 to driver operations** and produce this focused outcome:

Same real values as Milestone 4.

---

## Open

`spaghetti_modules/sht40/sht40.c`.

---

## Write / Modify

Implement SHT40 `init`, `read`, and `deinit` callbacks around the already working static Zephyr SHT4x device. Define the private ops table and exported descriptor with type ID `sht40` and I2C capability. Keep calls synchronous and propagate Sensor API errors.

---

## Why

Registry should store a tested driver descriptor.

---

## Called / used by

Temporary main harness.

---

## Trigger

BOOT/PERIODIC READ.

---

## Invocation mechanism

DIRECT CALL through operation table.

---

## Execution context

Main thread.

---

## Calls / dependencies

Temporary SHT4x Sensor wrapper.

---

## Inputs

Module with Port 0 and output sample.

---

## Outputs

Same real values as Milestone 4.

---

## Errors to handle

Missing op, incompatible Port, prior sensor errors.

---

## Do NOT implement yet

- Registry/Manager lookup or zbus

---

## Steps

- [ ] Open only `spaghetti_modules/sht40/sht40.c`.
- [ ] Implement SHT40 `init`, `read`, and `deinit` callbacks around the already working static Zephyr SHT4x device.
- [ ] Define the private ops table and exported descriptor with type ID `sht40` and I2C capability.
- [ ] Keep calls synchronous and propagate Sensor API errors.
- [ ] Handle only these realistic errors: Missing op, incompatible Port, prior sensor errors.
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

Ensure main never calls `sensor_*` or SHT40 concrete functions directly;
it calls operation pointers.

---

## Expected result

Measurements unchanged through generic driver contract.

---

## Completion checklist

- [ ] Required documentation or implementation file changed as specified
- [ ] Named type, function, configuration, or test exists
- [ ] Build succeeds when this task requires a build
- [ ] Task-specific test passes
- [ ] No unrelated functionality was added

---

## Commit suggestion

`module: adapt sht40 to driver operations`

---

## Next task

[TASK-050-06](TASK-050-06-exercise-sht40-through-the-operation-table.md) — Exercise SHT40 through the operation table
