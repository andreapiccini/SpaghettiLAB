# TASK-020-03 — Enable the I2C node in the board overlay

**Status:** ⬜ TODO  
**Phase:** 020 — Current board / I2C  
**Depends on:** [TASK-020-02](TASK-020-02-inspect-the-current-generated-devicetree.md)  
**Estimated scope:** Small

---

## Goal

Complete **Enable the I2C node in the board overlay** and produce this focused outcome:

Enabled I2C node in final DTS.

---

## Open

`boards/esp32c3_devkitm_esp32c3.overlay`.

---

## Write / Modify

Add/override the real I2C controller and its real pinctrl.
Conceptual template only:

```dts
/* I2C_CONTROLLER and I2C_PINCTRL are placeholders resolved in Step 2.1. */
&I2C_CONTROLLER {
    status = "okay";
    clock-frequency = <I2C_BITRATE_STANDARD>;
    pinctrl-0 = <&I2C_PINCTRL>;
    pinctrl-names = "default";
};
```

Define the corresponding ESP32 pinctrl group using the syntax already used by
the installed ESP32-C3 DTS/bindings; do not copy pin numbers from another board.

---

## Why

Port needs a ready Zephyr controller device.

---

## Called / used by

Devicetree tools and Zephyr I2C driver.

---

## Trigger

BUILD.

---

## Invocation mechanism

BUILD TIME.

---

## Execution context

Devicetree compiler/C compiler.

---

## Calls / dependencies

Existing SoC I2C/pinctrl bindings.

---

## Inputs

Verified controller and pin mapping.

---

## Outputs

Enabled I2C node in final DTS.

---

## Errors to handle

Unknown label, invalid pinctrl, pin conflict.

---

## Do NOT implement yet

- SHT40 child node or removable-module identity

---

## Zephyr note

An overlay changes the board's compile-time hardware description. It should contain physical wiring only, never a removable module assignment.

---

## Steps

- [ ] Open only `boards/esp32c3_devkitm_esp32c3.overlay`.
- [ ] Add/override the real I2C controller and its real pinctrl. Conceptual template only: Add the exact dts template shown in **Write / Modify**.
- [ ] Define the corresponding ESP32 pinctrl group using the syntax already used by the installed ESP32-C3 DTS/bindings
- [ ] do not copy pin numbers from another board.
- [ ] Handle only these realistic errors: Unknown label, invalid pinctrl, pin conflict.
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

Check template contains no unresolved placeholder before building.

---

## Expected result

Overlay describes only static bus wiring.

---

## Completion checklist

- [ ] Required documentation or implementation file changed as specified
- [ ] Named type, function, configuration, or test exists
- [ ] Build succeeds when this task requires a build
- [ ] Task-specific test passes
- [ ] No unrelated functionality was added

---

## Commit suggestion

`current: enable the i2c node in the board overlay`

---

## Next task

[TASK-020-04](TASK-020-04-enable-zephyr-i2c-support.md) — Enable Zephyr I2C support
