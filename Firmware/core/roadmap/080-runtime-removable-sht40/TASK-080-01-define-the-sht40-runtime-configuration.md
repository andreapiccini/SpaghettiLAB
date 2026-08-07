# TASK-080-01 — Define the SHT40 runtime configuration

**Status:** ⬜ TODO  
**Phase:** 080 — Runtime-removable SHT40  
**Depends on:** [TASK-070-06](../070-module-manager/TASK-070-06-test-manager-success-and-rollback.md)  
**Estimated scope:** Small

---

## Goal

Complete **Define the SHT40 runtime configuration** and produce this focused outcome:

Per-instance context has address and Port.

---

## Open

`spaghetti_modules/sht40/sht40.h`.

---

## Write / Modify

Define `struct spaghetti_sht40_config` with only the verified I2C address. Document its ownership and valid address range; do not include a Zephyr sensor device pointer.

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

- [ ] Open only `spaghetti_modules/sht40/sht40.h`.
- [ ] Define `struct spaghetti_sht40_config` with only the verified I2C address.
- [ ] Document its ownership and valid address range
- [ ] do not include a Zephyr sensor device pointer.
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

`runtime-removable: define the sht40 runtime configuration`

---

## Next task

[TASK-080-02](TASK-080-02-pass-bounded-driver-configuration-through-manager.md) — Pass bounded driver configuration through Manager
