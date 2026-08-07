# TASK-090-03 — Implement Config validation

**Status:** ⬜ TODO  
**Phase:** 090 — Internal Config  
**Depends on:** [TASK-090-02](TASK-090-02-make-config-string-ownership-explicit.md)  
**Estimated scope:** Small

---

## Goal

Complete **Implement Config validation** and produce this focused outcome:

Applied module(s) or exact validation/apply error.

---

## Open

`subsys/config/config.c`.

---

## Write / Modify

Implement pure validation for version, module count, Port IDs, nonempty terminated type IDs, I2C address range, duplicate Port assignments, and nonzero bounded sample period. Do not mutate live Manager state.

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
- [ ] Implement pure validation for version, module count, Port IDs, nonempty terminated type IDs, I2C address range, duplicate Port assignments, and nonzero bounded sample period.
- [ ] Do not mutate live Manager state.
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

`internal: implement config validation`

---

## Next task

[TASK-090-04](TASK-090-04-implement-config-apply.md) — Implement Config apply
