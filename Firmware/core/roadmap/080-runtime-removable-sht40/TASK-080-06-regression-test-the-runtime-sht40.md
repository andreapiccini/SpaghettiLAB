# TASK-080-06 — Regression-test the runtime SHT40

**Status:** ⬜ TODO  
**Phase:** 080 — Runtime-removable SHT40  
**Depends on:** [TASK-080-05](TASK-080-05-remove-the-static-sensor-shortcut.md)  
**Estimated scope:** Small

---

## Goal

Complete **Regression-test the runtime SHT40** and produce this focused outcome:

Same values with no static module DT node.

---

## Open

`build/zephyr/.config`, `build/zephyr/zephyr.dts`, and the serial console.

---

## Write / Modify

Confirm generated output has no SHT4x instance or Sensor API dependency. Flash and test valid address, invalid address, missing sensor, CRC failure where injectable, and a remove/reconfigure cycle.

---

## Why

Both paths were compared on real hardware.

---

## Called / used by

Build and final SHT40 driver.

---

## Trigger

REFACTOR AFTER HARDWARE PROOF.

---

## Invocation mechanism

BUILD TIME plus DIRECT CALL runtime path.

---

## Execution context

Build/main thread.

---

## Calls / dependencies

Port I2C only.

---

## Inputs

Runtime Port/address.

---

## Outputs

Same values with no static module DT node.

---

## Errors to handle

Kconfig/source still depending on Sensor API.

---

## Do NOT implement yet

- Custom Port DT binding

---

## Steps

- [ ] Open only `build/zephyr/.config`, `build/zephyr/zephyr.dts`, and the serial console.
- [ ] Confirm generated output has no SHT4x instance or Sensor API dependency. Flash and test valid address, invalid address, missing sensor, CRC failure where injectable, and a remove/reconfigure cycle.
- [ ] Handle only these realistic errors: Kconfig/source still depending on Sensor API.
- [ ] Confirm no item from **Do NOT implement yet** was added
- [ ] Run the task test and compare it with **Expected result**

---

## Build

YES — `make pristine`

---

## Flash

YES — use the host-specific workflow in the root `README.md`.

---

## Test

Search source/final DTS for `sht40_test` and static compatible; confirm
none, then verify measurement.

---

## Expected result

The real SHT40 is readable through Port and direct I2C with no static sensor shortcut.

---

## Completion checklist

- [ ] Required documentation or implementation file changed as specified
- [ ] Named type, function, configuration, or test exists
- [ ] Build succeeds when this task requires a build
- [ ] Task-specific test passes
- [ ] No unrelated functionality was added

---

## Commit suggestion

`runtime-removable: regression-test the runtime sht40`

---

## Next task

[TASK-090-01](../090-config/TASK-090-01-define-the-internal-config-model.md) — Define the internal Config model
