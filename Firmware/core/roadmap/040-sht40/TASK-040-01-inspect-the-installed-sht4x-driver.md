# TASK-040-01 — Inspect the installed SHT4x driver

**Status:** ⬜ TODO  
**Phase:** 040 — SHT40 vertical slice  
**Depends on:** [TASK-030-08](../030-port/TASK-030-08-test-port-success-and-invalid-ids.md)  
**Estimated scope:** Small

---

## Goal

Complete **Inspect the installed SHT4x driver** and produce this focused outcome:

Deliberate temporary/static plan.

---

## Open

Installed Zephyr files inside `make shell`:
`drivers/sensor/sensirion/sht4x/`,
`dts/bindings/sensor/sensirion,sht4x.yaml`, and `samples/sensor/sht4x/`.

---

## Write / Modify

Inspect the installed driver, binding, and sample. Confirm compatible string, required `repeatability`, channel names, and address expectations. Record the decision to use the static Zephyr driver only for bring-up; do not change production files.

---

## Why

The installed environment already has `CONFIG_SHT4X`,
`sensirion,sht4x`, and Sensor API support.

---

## Called / used by

SHT40 vertical slice.

---

## Trigger

DESIGN DECISION.

---

## Invocation mechanism

BUILD-TIME STATIC DEVICE for OPTION A.

---

## Execution context

Developer review.

---

## Calls / dependencies

Zephyr Device/Sensor/I2C model.

---

## Inputs

Confirmed module wiring and address.

---

## Outputs

Deliberate temporary/static plan.

---

## Errors to handle

If the actual module is not SHT4x-compatible, stop.

---

## Do NOT implement yet

- Direct-I2C protocol or generic module operations

---

## Zephyr note

Zephyr's Sensor API requires a statically instantiated Devicetree device. That is acceptable for bring-up but not for the final removable-module model.

---

## Steps

- [ ] Open only Installed Zephyr files inside `make shell`:
`drivers/sensor/sensirion/sht4x/`,
`dts/bindings/sensor/sensirion,sht4x.yaml`, and `samples/sensor/sht4x/`.
- [ ] Inspect the installed driver, binding, and sample.
- [ ] Confirm compatible string, required `repeatability`, channel names, and address expectations.
- [ ] Record the decision to use the static Zephyr driver only for bring-up
- [ ] do not change production files.
- [ ] Handle only these realistic errors: If the actual module is not SHT4x-compatible, stop.
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

Confirm installed binding requires `repeatability` and I2C address.

---

## Expected result

No ambiguity about why the static node is temporary.

---

## Completion checklist

- [ ] Required documentation or implementation file changed as specified
- [ ] Named type, function, configuration, or test exists
- [ ] Build succeeds when this task requires a build
- [ ] Task-specific test passes
- [ ] No unrelated functionality was added

---

## Commit suggestion

`sht40: inspect the installed sht4x driver`

---

## Next task

[TASK-040-02](TASK-040-02-add-the-temporary-sht40-devicetree-node.md) — Add the temporary SHT40 Devicetree node
