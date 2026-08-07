# TASK-030-03 — Declare the Port public API

**Status:** ⬜ TODO  
**Phase:** 030 — Port  
**Depends on:** [TASK-030-02](TASK-030-02-define-port-capabilities.md)  
**Estimated scope:** Small

---

## Goal

Complete **Declare the Port public API** and produce this focused outcome:

Opaque const Port or `NULL`; boolean/device pointer.

---

## Open

`include/spaghetti/port.h`.

---

## Write / Modify

Forward-declare `struct spaghetti_port` and `struct device`. Declare `spaghetti_port_init_all()`, `spaghetti_port_count()`, `spaghetti_port_get()`, `spaghetti_port_has_capability()`, and `spaghetti_port_i2c_device()` with the signatures in the long-form roadmap.

---

## Why

SHT40 code needs one verified abstraction immediately.

---

## Called / used by

Core, SHT40 test driver; later Manager.

---

## Trigger

BOOT/LOOKUP/MODULE OPERATION.

---

## Invocation mechanism

DIRECT CALL.

---

## Execution context

Main/calling thread.

---

## Calls / dependencies

Zephyr `struct device` declaration and basic types.

---

## Inputs

Port ID/capability.

---

## Outputs

Opaque const Port or `NULL`; boolean/device pointer.

---

## Errors to handle

Invalid ID/null port/not initialized.

---

## Do NOT implement yet

- SPI/GPIO/power, module occupancy, dynamic allocation

---

## Steps

- [ ] Open only `include/spaghetti/port.h`.
- [ ] Forward-declare `struct spaghetti_port` and `struct device`.
- [ ] Declare `spaghetti_port_init_all()`, `spaghetti_port_count()`, `spaghetti_port_get()`, `spaghetti_port_has_capability()`, and `spaghetti_port_i2c_device()` with the signatures in the long-form roadmap.
- [ ] Handle only these realistic errors: Invalid ID/null port/not initialized.
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

Confirm no ESP32 or pin identifier is public.

---

## Expected result

Small API sufficient for one I2C vertical slice.

---

## Completion checklist

- [ ] Required documentation or implementation file changed as specified
- [ ] Named type, function, configuration, or test exists
- [ ] Build succeeds when this task requires a build
- [ ] Task-specific test passes
- [ ] No unrelated functionality was added

---

## Commit suggestion

`port: declare the port public api`

---

## Next task

[TASK-030-04](TASK-030-04-implement-the-private-port-descriptor.md) — Implement the private Port descriptor
