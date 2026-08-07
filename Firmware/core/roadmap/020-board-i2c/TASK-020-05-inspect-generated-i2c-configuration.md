# TASK-020-05 — Inspect generated I2C configuration

**Status:** ⬜ TODO  
**Phase:** 020 — Current board / I2C  
**Depends on:** [TASK-020-04](TASK-020-04-enable-zephyr-i2c-support.md)  
**Estimated scope:** Small

---

## Goal

Complete **Inspect generated I2C configuration** and produce this focused outcome:

I2C API linked.

---

## Open

`build/zephyr/zephyr.dts` and `build/zephyr/.config`.

---

## Write / Modify

After a pristine build, confirm the selected controller is `okay`, the generated pins match the verified schematic, and `.config` contains `CONFIG_I2C=y`. Do not edit either generated file.

---

## Why

DTS describes hardware; Kconfig includes software support.

---

## Called / used by

Port and later SHT40.

---

## Trigger

BUILD.

---

## Invocation mechanism

BUILD TIME.

---

## Execution context

Kconfig/CMake.

---

## Calls / dependencies

Installed ESP32 I2C driver.

---

## Inputs

`CONFIG_I2C=y`.

---

## Outputs

I2C API linked.

---

## Errors to handle

Unsatisfied controller dependency shown by Kconfig warning.

---

## Do NOT implement yet

- `CONFIG_SENSOR`, zbus, MQTT

---

## Steps

- [ ] Open only `build/zephyr/zephyr.dts` and `build/zephyr/.config`.
- [ ] After a pristine build, confirm the selected controller is `okay`, the generated pins match the verified schematic, and `.config` contains `CONFIG_I2C=y`.
- [ ] Do not edit either generated file.
- [ ] Handle only these realistic errors: Unsatisfied controller dependency shown by Kconfig warning.
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

Search the generated DTS for the controller node and `.config` for `CONFIG_I2C=y`.

---

## Expected result

Generated configuration proves both the hardware node and I2C software are enabled.

---

## Completion checklist

- [ ] Required documentation or implementation file changed as specified
- [ ] Named type, function, configuration, or test exists
- [ ] Build succeeds when this task requires a build
- [ ] Task-specific test passes
- [ ] No unrelated functionality was added

---

## Commit suggestion

`current: inspect generated i2c configuration`

---

## Next task

[TASK-020-06](TASK-020-06-flash-the-i2c-baseline.md) — Flash the I2C baseline
