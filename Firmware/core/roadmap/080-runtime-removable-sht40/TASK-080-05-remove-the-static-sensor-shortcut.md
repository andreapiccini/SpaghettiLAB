# TASK-080-05 — Remove the static sensor shortcut

**Status:** ⬜ TODO  
**Phase:** 080 — Runtime-removable SHT40  
**Depends on:** [TASK-080-04](TASK-080-04-validate-crc-and-convert-sht40-samples.md)  
**Estimated scope:** Small

---

## Goal

Complete **Remove the static sensor shortcut** and produce this focused outcome:

Same values with no static module DT node.

---

## Open

`boards/esp32c3_devkitm_esp32c3.overlay`, `prj.conf`, `spaghetti_modules/sht40/sht40.h`, and `spaghetti_modules/sht40/sht40.c`.

---

## Write / Modify

Delete the `sht40_test` Devicetree node, temporary test API, `DT_NODELABEL(sht40_test)`, and all `sensor_*` calls. Remove `CONFIG_SENSOR=y` if no other consumer needs it; retain `CONFIG_I2C=y` and the runtime address path.

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

## Zephyr note

Removing the node proves removable identity is runtime state. The board Devicetree must continue to describe only the physical I2C controller and Port wiring.

---

## Steps

- [ ] Open only `boards/esp32c3_devkitm_esp32c3.overlay`, `prj.conf`, `spaghetti_modules/sht40/sht40.h`, and `spaghetti_modules/sht40/sht40.c`.
- [ ] Delete the `sht40_test` Devicetree node, temporary test API, `DT_NODELABEL(sht40_test)`, and all `sensor_*` calls.
- [ ] Remove `CONFIG_SENSOR=y` if no other consumer needs it
- [ ] retain `CONFIG_I2C=y` and the runtime address path.
- [ ] Handle only these realistic errors: Kconfig/source still depending on Sensor API.
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

Search source/final DTS for `sht40_test` and static compatible; confirm
none, then verify measurement.

---

## Expected result

Port 0/SHT40 is runtime-configured and working.

---

## Completion checklist

- [ ] Required documentation or implementation file changed as specified
- [ ] Named type, function, configuration, or test exists
- [ ] Build succeeds when this task requires a build
- [ ] Task-specific test passes
- [ ] No unrelated functionality was added

---

## Commit suggestion

`runtime-removable: remove the static sensor shortcut`

---

## Next task

[TASK-080-06](TASK-080-06-regression-test-the-runtime-sht40.md) — Regression-test the runtime SHT40
