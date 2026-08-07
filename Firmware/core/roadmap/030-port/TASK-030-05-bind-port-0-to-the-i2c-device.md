# TASK-030-05 — Bind Port 0 to the I2C device

**Status:** ⬜ TODO  
**Phase:** 030 — Port  
**Depends on:** [TASK-030-04](TASK-030-04-implement-the-private-port-descriptor.md)  
**Estimated scope:** Small

---

## Goal

Complete **Bind Port 0 to the I2C device** and produce this focused outcome:

One ready Port or `-ENODEV`.

---

## Open

`subsys/port/port.c`.

---

## Write / Modify

In `spaghetti_port_init_all()`, obtain the verified controller with `DEVICE_DT_GET(DT_NODELABEL(...))`, store it in Port 0, and return `-ENODEV` when `device_is_ready()` is false. Implement `spaghetti_port_i2c_device()` with null and capability checks.

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

## Zephyr note

`DEVICE_DT_GET` converts a compile-time Devicetree node into a Zephyr device pointer. Readiness must still be checked at runtime with `device_is_ready()`.

---

## Steps

- [ ] Open only `subsys/port/port.c`.
- [ ] In `spaghetti_port_init_all()`, obtain the verified controller with `DEVICE_DT_GET(DT_NODELABEL(...))`, store it in Port 0, and return `-ENODEV` when `device_is_ready()` is false.
- [ ] Implement `spaghetti_port_i2c_device()` with null and capability checks.
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

`port: bind port 0 to the i2c device`

---

## Next task

[TASK-030-06](TASK-030-06-add-port-to-cmake.md) — Add Port to CMake
