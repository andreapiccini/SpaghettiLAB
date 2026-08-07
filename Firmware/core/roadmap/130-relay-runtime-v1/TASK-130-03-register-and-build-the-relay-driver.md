# TASK-130-03 — Register and build the Relay driver

**Status:** ⬜ TODO  
**Phase:** 130 — Relay + Runtime V1  
**Depends on:** [TASK-130-02](TASK-130-02-implement-safe-relay-lifecycle-and-set.md)  
**Estimated scope:** Small

---

## Goal

Complete **Register and build the Relay driver** and produce this focused outcome:

Applied state/status.

---

## Open

`subsys/driver_registry/driver_registry.c` and `CMakeLists.txt`.

---

## Write / Modify

Add the immutable Relay descriptor to the fixed Registry and its source to CMake. Extend duplicate/operation validation for the command path without weakening SHT40 requirements.

---

## Why

Runtime V1 needs a tested target.

---

## Called / used by

Manager command routing.

---

## Trigger

MODULE CONFIGURATION/USER ACTION.

---

## Invocation mechanism

DIRECT CALL.

---

## Execution context

Manager/Runtime thread.

---

## Calls / dependencies

Real Port API and Zephyr GPIO/other verified peripheral.

---

## Inputs

Logical ON/OFF.

---

## Outputs

Applied state/status.

---

## Errors to handle

Unsupported Port, invalid command, hardware failure.

---

## Do NOT implement yet

- Invent pin/active level/latching behavior
- use schematic

---

## Steps

- [ ] Open only `subsys/driver_registry/driver_registry.c` and `CMakeLists.txt`.
- [ ] Add the immutable Relay descriptor to the fixed Registry and its source to CMake. Extend duplicate/operation validation for the command path without weakening SHT40 requirements.
- [ ] Handle only these realistic errors: Unsupported Port, invalid command, hardware failure.
- [ ] Confirm no item from **Do NOT implement yet** was added
- [ ] Run the task test and compare it with **Expected result**

---

## Build

YES — `make build`

---

## Flash

NO

---

## Test

Manual Manager configure and OFF->ON->OFF; verify electrically and on log.

---

## Expected result

Logical state controls real/fake relay safely.

---

## Completion checklist

- [ ] Required documentation or implementation file changed as specified
- [ ] Named type, function, configuration, or test exists
- [ ] Build succeeds when this task requires a build
- [ ] Task-specific test passes
- [ ] No unrelated functionality was added

---

## Commit suggestion

`relay: register and build the relay driver`

---

## Next task

[TASK-130-04](TASK-130-04-route-commands-through-module-manager.md) — Route commands through Module Manager
