# TASK-170-03 — Implement manual Discovery validation

**Status:** ⬜ TODO  
**Phase:** 170 — Discovery  
**Depends on:** [TASK-170-02](TASK-170-02-define-the-discovery-provider-api.md)  
**Estimated scope:** Small

---

## Goal

Complete **Implement manual Discovery validation** and produce this focused outcome:

Same SHT40 instance/readings.

---

## Open

`subsys/discovery/discovery.c`.

---

## Write / Modify

Implement MANUAL-only submission validation for mode, Port, type/config bounds, source, and generation. Reject stale generations and call the registered sink only after the full result validates.

---

## Why

Existing behavior is a regression oracle.

---

## Called / used by

Config/Communication -> Discovery -> Manager.

---

## Trigger

CONFIG COMMAND.

---

## Invocation mechanism

DIRECT CALL chain.

---

## Execution context

Config/Communication thread.

---

## Calls / dependencies

Port validation and unchanged Manager API.

---

## Inputs

Manual result.

---

## Outputs

Same SHT40 instance/readings.

---

## Errors to handle

Stale generation, unsupported mode, Manager error propagation.

---

## Do NOT implement yet

- Async provider worker
- Add K_WORK only when provider needs it

---

## Steps

- [ ] Open only `subsys/discovery/discovery.c`.
- [ ] Implement MANUAL-only submission validation for mode, Port, type/config bounds, source, and generation.
- [ ] Reject stale generations and call the registered sink only after the full result validates.
- [ ] Handle only these realistic errors: Stale generation, unsupported mode, Manager error propagation.
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

Apply same CBOR/manual assignment and compare status/measurement to before.

---

## Expected result

Behavior unchanged; Manager has no source/provider knowledge.

---

## Completion checklist

- [ ] Required documentation or implementation file changed as specified
- [ ] Named type, function, configuration, or test exists
- [ ] Build succeeds when this task requires a build
- [ ] Task-specific test passes
- [ ] No unrelated functionality was added

---

## Commit suggestion

`discovery: implement manual discovery validation`

---

## Next task

[TASK-170-04](TASK-170-04-route-accepted-results-to-module-manager.md) — Route accepted results to Module Manager
