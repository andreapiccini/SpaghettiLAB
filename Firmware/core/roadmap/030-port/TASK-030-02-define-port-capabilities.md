# TASK-030-02 — Define Port capabilities

**Status:** ⬜ TODO  
**Phase:** 030 — Port  
**Depends on:** [TASK-030-01](TASK-030-01-define-the-port-identifier.md)  
**Estimated scope:** Small

---

## Goal

Complete **Define Port capabilities** and produce this focused outcome:

One I2C capability bit.

---

## Open

`include/spaghetti/port.h`.

---

## Write / Modify

Define `enum spaghetti_port_capability` with only `SPAGHETTI_PORT_CAP_I2C = BIT(0)`. Add only the include required for `BIT()`.

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

No runtime input; this is a public compile-time contract.

---

## Outputs

One I2C capability bit.

---

## Errors to handle

Invalid ID/null port/not initialized.

---

## Do NOT implement yet

- SPI/GPIO/power, module occupancy, dynamic allocation

---

## Steps

- [ ] Open only `include/spaghetti/port.h`.
- [ ] Define `enum spaghetti_port_capability` with only `SPAGHETTI_PORT_CAP_I2C = BIT(0)`.
- [ ] Add only the include required for `BIT()`.
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

`port: define port capabilities`

---

## Next task

[TASK-030-03](TASK-030-03-declare-the-port-public-api.md) — Declare the Port public API
