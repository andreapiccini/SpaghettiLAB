# TASK-080-02 — Pass bounded driver configuration through Manager

**Status:** ⬜ TODO  
**Phase:** 080 — Runtime-removable SHT40  
**Depends on:** [TASK-080-01](TASK-080-01-define-the-sht40-runtime-configuration.md)  
**Estimated scope:** Small

---

## Goal

Complete **Pass bounded driver configuration through Manager** and produce this focused outcome:

Per-instance context has address and Port.

---

## Open

`include/spaghetti/module_driver.h`, `include/spaghetti/module_manager.h`, and `subsys/module_manager/module_manager.c`.

---

## Write / Modify

Extend the driver initialization/configure contract with a bounded config pointer and length, or an equally small typed initial config. Validate pointer/length before driver init and ensure the instance owns any data that must outlive the call.

---

## Why

Removable modules cannot rely on one pre-instantiated Zephyr sensor.

---

## Called / used by

Manager creates; SHT40 init/read consumes.

---

## Trigger

MODULE CONFIGURATION.

---

## Invocation mechanism

DIRECT CALL.

---

## Execution context

Manager/caller thread.

---

## Calls / dependencies

Module/driver config contract.

---

## Inputs

Verified address such as 0x44 from configuration.

---

## Outputs

Per-instance context has address and Port.

---

## Errors to handle

Invalid/out-of-range address and wrong config size/type.

---

## Do NOT implement yet

- Full channel schema, EEPROM, alternate addresses guessed

---

## Steps

- [ ] Open only `include/spaghetti/module_driver.h`, `include/spaghetti/module_manager.h`, and `subsys/module_manager/module_manager.c`.
- [ ] Extend the driver initialization/configure contract with a bounded config pointer and length, or an equally small typed initial config.
- [ ] Validate pointer/length before driver init and ensure the instance owns any data that must outlive the call.
- [ ] Handle only these realistic errors: Invalid/out-of-range address and wrong config size/type.
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

Config validation accepts verified address and rejects invalid values.

---

## Expected result

No driver-global runtime address.

---

## Completion checklist

- [ ] Required documentation or implementation file changed as specified
- [ ] Named type, function, configuration, or test exists
- [ ] Build succeeds when this task requires a build
- [ ] Task-specific test passes
- [ ] No unrelated functionality was added

---

## Commit suggestion

`runtime-removable: pass bounded driver configuration through manager`

---

## Next task

[TASK-080-03](TASK-080-03-implement-direct-i2c-sht40-measurement.md) — Implement direct-I2C SHT40 measurement
