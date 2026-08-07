# TASK-020-06 — Flash the I2C baseline

**Status:** ⬜ TODO  
**Phase:** 020 — Current board / I2C  
**Depends on:** [TASK-020-05](TASK-020-05-inspect-generated-i2c-configuration.md)  
**Estimated scope:** Small

---

## Goal

Complete **Flash the I2C baseline** and produce this focused outcome:

I2C API linked.

---

## Open

`README.md` and the serial console.

---

## Write / Modify

Do not add code. Flash the pristine image and verify enabling the unused controller did not break boot or the USB console.

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

- [ ] Open only `README.md` and the serial console.
- [ ] Do not add code. Flash the pristine image and verify enabling the unused controller did not break boot or the USB console.
- [ ] Handle only these realistic errors: Unsatisfied controller dependency shown by Kconfig warning.
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

Find enabled controller and real pins in `build/zephyr/zephyr.dts`; find
`CONFIG_I2C=y` in `build/zephyr/.config`.

---

## Expected result

The firmware boots normally with the verified I2C controller enabled.

---

## Completion checklist

- [ ] Required documentation or implementation file changed as specified
- [ ] Named type, function, configuration, or test exists
- [ ] Build succeeds when this task requires a build
- [ ] Task-specific test passes
- [ ] No unrelated functionality was added

---

## Commit suggestion

`current: flash the i2c baseline`

---

## Next task

[TASK-030-01](../030-port/TASK-030-01-define-the-port-identifier.md) — Define the Port identifier
