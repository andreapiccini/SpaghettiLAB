# TASK-040-02 — Add the temporary SHT40 Devicetree node

**Status:** ⬜ TODO  
**Phase:** 040 — SHT40 vertical slice  
**Depends on:** [TASK-040-01](TASK-040-01-inspect-the-installed-sht4x-driver.md)  
**Estimated scope:** Small

---

## Goal

Complete **Add the temporary SHT40 Devicetree node** and produce this focused outcome:

`DT_NODELABEL(sht40_test)` device instance.

---

## Open

`boards/esp32c3_devkitm_esp32c3.overlay`.

---

## Write / Modify

Under the already enabled real I2C controller add:

```dts
/* TEMPORARY SHORTCUT: removed in Milestone 8. */
sht40_test: sht4x@44 {
    compatible = "sensirion,sht4x";
    reg = <0x44>;
    repeatability = <2>;
};
```

Use `0x44` only after verifying the actual module/address selection. The static
node is for bring-up, not the final removable-module model.

> [!WARNING]
> TEMPORARY SHORTCUT
>
> This is intentionally temporary and will be removed in [TASK-080-05](../080-runtime-removable-sht40/TASK-080-05-remove-the-static-sensor-shortcut.md).


---

## Why

Device Model needs a DT instance for the standard sensor driver.

---

## Called / used by

Zephyr SHT4x driver and temporary wrapper.

---

## Trigger

BUILD.

---

## Invocation mechanism

BUILD TIME.

---

## Execution context

Devicetree/CMake.

---

## Calls / dependencies

Real I2C controller and installed binding.

---

## Inputs

Verified address and bus.

---

## Outputs

`DT_NODELABEL(sht40_test)` device instance.

---

## Errors to handle

Address conflict, missing required repeatability, wrong bus.

---

## Do NOT implement yet

- A Spaghetti Port binding or runtime discovery

---

## Zephyr note

This node creates a compile-time Zephyr sensor instance. The removable SHT40 identity must later move to runtime configuration.

---

## Steps

- [ ] Open only `boards/esp32c3_devkitm_esp32c3.overlay`.
- [ ] Under the already enabled real I2C controller add: Add the exact dts template shown in **Write / Modify**.
- [ ] Use `0x44` only after verifying the actual module/address selection. The static node is for bring-up, not the final removable-module model.
- [ ] Handle only these realistic errors: Address conflict, missing required repeatability, wrong bus.
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

No placeholder remains; comment clearly says temporary.

---

## Expected result

Valid static sensor node.

---

## Completion checklist

- [ ] Required documentation or implementation file changed as specified
- [ ] Named type, function, configuration, or test exists
- [ ] Build succeeds when this task requires a build
- [ ] Task-specific test passes
- [ ] No unrelated functionality was added

---

## Commit suggestion

`sht40: add the temporary sht40 devicetree node`

---

## Next task

[TASK-040-03](TASK-040-03-enable-the-sensor-api.md) — Enable the Sensor API
