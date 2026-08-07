# TASK-170-05 — Route Config assignments through Discovery

**Status:** ⬜ TODO  
**Phase:** 170 — Discovery  
**Depends on:** [TASK-170-04](TASK-170-04-route-accepted-results-to-module-manager.md)  
**Estimated scope:** Small

---

## Goal

Complete **Route Config assignments through Discovery** and produce this focused outcome:

Same SHT40 instance/readings.

---

## Open

`subsys/config/config.c`, Communication apply path, and the serial console.

---

## Write / Modify

Replace Config's direct Manager module assignment with a normalized manual Discovery result. Keep Runtime and service config directed to their own owners. Test valid, stale, invalid, and unknown-type results.

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

- [ ] Open only `subsys/config/config.c`, Communication apply path, and the serial console.
- [ ] Replace Config's direct Manager module assignment with a normalized manual Discovery result.
- [ ] Keep Runtime and service config directed to their own owners.
- [ ] Test valid, stale, invalid, and unknown-type results.
- [ ] Handle only these realistic errors: Stale generation, unsupported mode, Manager error propagation.
- [ ] Confirm no item from **Do NOT implement yet** was added
- [ ] Run the task test and compare it with **Expected result**

---

## Build

YES — `make build`

---

## Flash

YES — use the host-specific workflow in the root `README.md`.

---

## Test

Apply same CBOR/manual assignment and compare status/measurement to before.

---

## Expected result

The existing manual configuration still creates and reads SHT40 while Manager remains provider-independent.

---

## Completion checklist

- [ ] Required documentation or implementation file changed as specified
- [ ] Named type, function, configuration, or test exists
- [ ] Build succeeds when this task requires a build
- [ ] Task-specific test passes
- [ ] No unrelated functionality was added

---

## Commit suggestion

`discovery: route config assignments through discovery`

---

## Next task

[TASK-180-01](../180-multi-core/TASK-180-01-define-the-spaghetti-port-binding.md) — Define the Spaghetti Port binding
