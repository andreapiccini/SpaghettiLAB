# TASK-090-02 — Make Config string ownership explicit

**Status:** ⬜ TODO  
**Phase:** 090 — Internal Config  
**Depends on:** [TASK-090-01](TASK-090-01-define-the-internal-config-model.md)  
**Estimated scope:** Small

---

## Goal

Complete **Make Config string ownership explicit** and produce this focused outcome:

Valid internal configuration.

---

## Open

`include/spaghetti/config.h`.

---

## Write / Modify

Replace any borrowed `const char *type_id` that must outlive decode/input with a bounded owned character array and a named maximum. Document snapshot ownership and termination rules.

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
- [ ] Replace any borrowed `const char *type_id` that must outlive decode/input with a bounded owned character array and a named maximum.
- [ ] Document snapshot ownership and termination rules.
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

`internal: make config string ownership explicit`

---

## Next task

[TASK-090-03](TASK-090-03-implement-config-validation.md) — Implement Config validation
