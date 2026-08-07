# TASK-170-02 — Define the Discovery provider API

**Status:** ⬜ TODO  
**Phase:** 170 — Discovery  
**Depends on:** [TASK-170-01](TASK-170-01-define-discovery-result-types.md)  
**Estimated scope:** Small

---

## Goal

Complete **Define the Discovery provider API** and produce this focused outcome:

Normalized result.

---

## Open

`include/spaghetti/discovery.h`.

---

## Write / Modify

Define the provider operation table and declare Discovery init, manual submission, and accepted-result sink registration. Do not add an asynchronous worker until a real provider requires it.

---

## Why

Manual Config/Manager path already works and becomes the reference.

---

## Called / used by

Communication/Config/manual provider; future providers.

---

## Trigger

CONFIG COMMAND/PROVIDER RESULT.

---

## Invocation mechanism

DIRECT CALL initially.

---

## Execution context

Communication/Config caller thread.

---

## Calls / dependencies

Port/type/config value types only.

---

## Inputs

Port 0/SHT40/manual/generation.

---

## Outputs

Normalized result.

---

## Errors to handle

Invalid/stale/conflicting result.

---

## Do NOT implement yet

- EEPROM, probe, LLM transport, or meaning AUTO=EEPROM

---

## Steps

- [ ] Open only `include/spaghetti/discovery.h`.
- [ ] Define the provider operation table and declare Discovery init, manual submission, and accepted-result sink registration.
- [ ] Do not add an asynchronous worker until a real provider requires it.
- [ ] Handle only these realistic errors: Invalid/stale/conflicting result.
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

Ownership and generation review.

---

## Expected result

Provider-neutral result.

---

## Completion checklist

- [ ] Required documentation or implementation file changed as specified
- [ ] Named type, function, configuration, or test exists
- [ ] Build succeeds when this task requires a build
- [ ] Task-specific test passes
- [ ] No unrelated functionality was added

---

## Commit suggestion

`discovery: define the discovery provider api`

---

## Next task

[TASK-170-03](TASK-170-03-implement-manual-discovery-validation.md) — Implement manual Discovery validation
