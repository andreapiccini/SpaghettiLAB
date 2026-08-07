# TASK-030-04 — Implement the private Port descriptor

**Status:** ⬜ TODO  
**Phase:** 030 — Port  
**Depends on:** [TASK-030-03](TASK-030-03-declare-the-port-public-api.md)  
**Estimated scope:** Small

---

## Goal

Complete **Implement the private Port descriptor** and produce this focused outcome:

One ready Port or `-ENODEV`.

---

## Open

`subsys/port/port.c`.

---

## Write / Modify

Define private `struct spaghetti_port` fields `id`, `capabilities`, and `const struct device *i2c`. Create one fixed Port 0 descriptor and implement count, lookup, and capability checks with null and bounds validation.

> [!WARNING]
> TEMPORARY SHORTCUT
>
> This is intentionally temporary and will be removed in [TASK-180-05](../180-multi-core/TASK-180-05-enumerate-devicetree-ports.md).


---

## Why

Hardware feedback is more valuable than designing all Port variants.

---

## Called / used by

Core and SHT40 wrapper.

---

## Trigger

BOOT.

---

## Invocation mechanism

DIRECT CALL.

---

## Execution context

Main thread.

---

## Calls / dependencies

Devicetree macros, `DEVICE_DT_GET`, `device_is_ready`.

---

## Inputs

Static compiled DTS.

---

## Outputs

One ready Port or `-ENODEV`.

---

## Errors to handle

Controller absent/not ready and invalid lookup.

---

## Do NOT implement yet

- Mutex unless two actual users share multi-step access

---

## Steps

- [ ] Open only `subsys/port/port.c`.
- [ ] Define private `struct spaghetti_port` fields `id`, `capabilities`, and `const struct device *i2c`.
- [ ] Create one fixed Port 0 descriptor and implement count, lookup, and capability checks with null and bounds validation.
- [ ] Handle only these realistic errors: Controller absent/not ready and invalid lookup.
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

Unit-level inspection of ID bounds/null behavior.

---

## Expected result

One private descriptor and no module knowledge.

---

## Completion checklist

- [ ] Required documentation or implementation file changed as specified
- [ ] Named type, function, configuration, or test exists
- [ ] Build succeeds when this task requires a build
- [ ] Task-specific test passes
- [ ] No unrelated functionality was added

---

## Commit suggestion

`port: implement the private port descriptor`

---

## Next task

[TASK-030-05](TASK-030-05-bind-port-0-to-the-i2c-device.md) — Bind Port 0 to the I2C device
