# TASK-020-04 — Enable Zephyr I2C support

**Status:** ⬜ TODO  
**Phase:** 020 — Current board / I2C  
**Depends on:** [TASK-020-03](TASK-020-03-enable-the-i2c-node-in-the-board-overlay.md)  
**Estimated scope:** Small

---

## Goal

Complete **Enable Zephyr I2C support** and produce this focused outcome:

I2C API linked.

---

## Open

`prj.conf`.

---

## Write / Modify

Add `CONFIG_I2C=y`. This permanently compiles the generic
I2C controller API required by I2C-capable ports.

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

## Zephyr note

`CONFIG_I2C=y` compiles the generic Zephyr I2C API and selected controller driver. It does not describe pins and is not runtime configuration.

---

## Steps

- [ ] Open only `prj.conf`.
- [ ] Add `CONFIG_I2C=y`. This permanently compiles the generic I2C controller API required by I2C-capable ports.
- [ ] Handle only these realistic errors: Unsatisfied controller dependency shown by Kconfig warning.
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

Find enabled controller and real pins in `build/zephyr/zephyr.dts`; find
`CONFIG_I2C=y` in `build/zephyr/.config`.

---

## Expected result

Build succeeds; controller node is `okay`.

---

## Completion checklist

- [ ] Required documentation or implementation file changed as specified
- [ ] Named type, function, configuration, or test exists
- [ ] Build succeeds when this task requires a build
- [ ] Task-specific test passes
- [ ] No unrelated functionality was added

---

## Commit suggestion

`current: enable zephyr i2c support`

---

## Next task

[TASK-020-05](TASK-020-05-inspect-generated-i2c-configuration.md) — Inspect generated I2C configuration
