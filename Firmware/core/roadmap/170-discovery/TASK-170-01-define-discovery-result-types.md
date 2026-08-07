# TASK-170-01 — Define Discovery result types

**Status:** ⬜ TODO  
**Phase:** 170 — Discovery  
**Depends on:** [TASK-160-08](../160-mqtt/TASK-160-08-move-mqtt-settings-into-config.md)  
**Estimated scope:** Small

---

## Goal

Complete **Define Discovery result types** and produce this focused outcome:

Normalized result.

---

## Open

`include/spaghetti/discovery.h`.

---

## Write / Modify

Define MANUAL/AUTO/HYBRID mode, a source enum independent of mode, and `spaghetti_discovery_result` containing Port, bounded type/config data, source, and generation. Keep ownership explicit.

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
- [ ] Define MANUAL/AUTO/HYBRID mode, a source enum independent of mode, and `spaghetti_discovery_result` containing Port, bounded type/config data, source, and generation.
- [ ] Keep ownership explicit.
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

`discovery: define discovery result types`

---

## Next task

[TASK-170-02](TASK-170-02-define-the-discovery-provider-api.md) — Define the Discovery provider API
