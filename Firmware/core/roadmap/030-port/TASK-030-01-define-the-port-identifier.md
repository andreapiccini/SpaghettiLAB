# TASK-030-01 — Define the Port identifier

**Status:** ⬜ TODO  
**Phase:** 030 — Port  
**Depends on:** [TASK-020-06](../020-board-i2c/TASK-020-06-flash-the-i2c-baseline.md)  
**Estimated scope:** Small

---

## Goal

Complete **Define the Port identifier** and produce this focused outcome:

Opaque const Port or `NULL`; boolean/device pointer.

---

## Open

`include/spaghetti/port.h`.

---

## Write / Modify

Add an include guard and the minimum standard includes, then define `typedef uint8_t spaghetti_port_id_t;`. Do not expose an ESP32 type or GPIO number.

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
- [ ] Add an include guard and the minimum standard includes, then define `typedef uint8_t spaghetti_port_id_t;`.
- [ ] Do not expose an ESP32 type or GPIO number.
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

`port: define the port identifier`

---

## Next task

[TASK-030-02](TASK-030-02-define-port-capabilities.md) — Define Port capabilities
