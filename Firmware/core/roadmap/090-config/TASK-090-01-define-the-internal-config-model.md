# TASK-090-01 — Define the internal Config model

**Status:** ⬜ TODO  
**Phase:** 090 — Internal Config  
**Depends on:** [TASK-080-06](../080-runtime-removable-sht40/TASK-080-06-regression-test-the-runtime-sht40.md)  
**Estimated scope:** Small

---

## Goal

Complete **Define the internal Config model** and produce this focused outcome:

Valid internal configuration.

---

## Open

`include/spaghetti/config.h`.

---

## Write / Modify

Define fixed capacity limits plus `spaghetti_module_config`, `spaghetti_runtime_sampling_config`, and `spaghetti_config` with only version, bounded module assignments, verified I2C address, and one sample period. Declare validate and apply APIs.

---

## Why

CBOR must fill a proven model, not define architecture.

---

## Called / used by

Main test, future decoder/Communication, Manager/Runtime.

---

## Trigger

CONFIG COMMAND/BOOT TEST.

---

## Invocation mechanism

DIRECT CALL.

---

## Execution context

Caller thread.

---

## Calls / dependencies

Port/module IDs.

---

## Inputs

Version, Port 0/SHT40/address, 1000 ms.

---

## Outputs

Valid internal configuration.

---

## Errors to handle

Wrong version/count, duplicate port, empty type, zero period.

---

## Do NOT implement yet

- CBOR, MQTT fields, discovery policy, giant union

---

## Steps

- [ ] Open only `include/spaghetti/config.h`.
- [ ] Define fixed capacity limits plus `spaghetti_module_config`, `spaghetti_runtime_sampling_config`, and `spaghetti_config` with only version, bounded module assignments, verified I2C address, and one sample period.
- [ ] Declare validate and apply APIs.
- [ ] Handle only these realistic errors: Wrong version/count, duplicate port, empty type, zero period.
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

Ownership/lifetime review for type strings and arrays.

---

## Expected result

Small bounded config.

---

## Completion checklist

- [ ] Required documentation or implementation file changed as specified
- [ ] Named type, function, configuration, or test exists
- [ ] Build succeeds when this task requires a build
- [ ] Task-specific test passes
- [ ] No unrelated functionality was added

---

## Commit suggestion

`internal: define the internal config model`

---

## Next task

[TASK-090-02](TASK-090-02-make-config-string-ownership-explicit.md) — Make Config string ownership explicit
