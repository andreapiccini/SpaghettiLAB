# TASK-090-04 — Implement Config apply

**Status:** ⬜ TODO  
**Phase:** 090 — Internal Config  
**Depends on:** [TASK-090-03](TASK-090-03-implement-config-validation.md)  
**Estimated scope:** Small

---

## Goal

Complete **Implement Config apply** and produce this focused outcome:

Applied module(s) or exact validation/apply error.

---

## Open

`subsys/config/config.c`.

---

## Write / Modify

Validate the entire snapshot first, then call Manager configure for each initial module in order. Preserve and report the first failure index/code. Store the sampling fields as accepted but inactive until Runtime exists.

---

## Why

Main hardcode can be replaced without serialization.

---

## Called / used by

Main now; Communication/decoder later.

---

## Trigger

CONFIG COMMAND.

---

## Invocation mechanism

DIRECT CALL.

---

## Execution context

Main/calling thread.

---

## Calls / dependencies

Module Manager configure.

---

## Inputs

Complete internal config.

---

## Outputs

Applied module(s) or exact validation/apply error.

---

## Errors to handle

Partial apply. For one module, rollback is simple; document
transaction strategy before multiple modules.

---

## Do NOT implement yet

- Persistent state, CBOR, async config worker

---

## Steps

- [ ] Open only `subsys/config/config.c`.
- [ ] Validate the entire snapshot first, then call Manager configure for each initial module in order. Preserve and report the first failure index/code.
- [ ] Store the sampling fields as accepted but inactive until Runtime exists.
- [ ] Handle only these realistic errors: Partial apply. For one module, rollback is simple; document transaction strategy before multiple modules.
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

Validate valid config plus bad version, duplicate/invalid Port, zero period.

---

## Expected result

Invalid config never calls Manager.

---

## Completion checklist

- [ ] Required documentation or implementation file changed as specified
- [ ] Named type, function, configuration, or test exists
- [ ] Build succeeds when this task requires a build
- [ ] Task-specific test passes
- [ ] No unrelated functionality was added

---

## Commit suggestion

`internal: implement config apply`

---

## Next task

[TASK-090-05](TASK-090-05-add-and-apply-one-hardcoded-c-config.md) — Add and apply one hardcoded C config
