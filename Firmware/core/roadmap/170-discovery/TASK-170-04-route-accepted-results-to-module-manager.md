# TASK-170-04 — Route accepted results to Module Manager

**Status:** ⬜ TODO  
**Phase:** 170 — Discovery  
**Depends on:** [TASK-170-03](TASK-170-03-implement-manual-discovery-validation.md)  
**Estimated scope:** Small

---

## Goal

Complete **Route accepted results to Module Manager** and produce this focused outcome:

Same SHT40 instance/readings.

---

## Open

`subsys/discovery/discovery.c`, `CMakeLists.txt`, and `subsys/core/core.c`.

---

## Write / Modify

Implement a sink that directly calls the existing Manager configure API unchanged. Add Discovery source to CMake and initialize it from Core before Config can submit assignments.

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

- [ ] Open only `subsys/discovery/discovery.c`, `CMakeLists.txt`, and `subsys/core/core.c`.
- [ ] Implement a sink that directly calls the existing Manager configure API unchanged.
- [ ] Add Discovery source to CMake and initialize it from Core before Config can submit assignments.
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

`discovery: route accepted results to module manager`

---

## Next task

[TASK-170-05](TASK-170-05-route-config-assignments-through-discovery.md) — Route Config assignments through Discovery
