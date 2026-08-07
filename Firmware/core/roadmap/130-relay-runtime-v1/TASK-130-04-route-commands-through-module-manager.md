# TASK-130-04 — Route commands through Module Manager

**Status:** ⬜ TODO  
**Phase:** 130 — Relay + Runtime V1  
**Depends on:** [TASK-130-03](TASK-130-03-register-and-build-the-relay-driver.md)  
**Estimated scope:** Small

---

## Goal

Complete **Route commands through Module Manager** and produce this focused outcome:

Applied state/status.

---

## Open

`include/spaghetti/module_manager.h` and `subsys/module_manager/module_manager.c`.

---

## Write / Modify

Declare and implement `spaghetti_module_manager_command()`. Validate ID, READY state, command support, and value before one direct driver call. Add the Relay module to the current test configuration using verified hardware.

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

- [ ] Open only `include/spaghetti/module_manager.h` and `subsys/module_manager/module_manager.c`.
- [ ] Declare and implement `spaghetti_module_manager_command()`.
- [ ] Validate ID, READY state, command support, and value before one direct driver call.
- [ ] Add the Relay module to the current test configuration using verified hardware.
- [ ] Handle only these realistic errors: Unsupported Port, invalid command, hardware failure.
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

`relay: route commands through module manager`

---

## Next task

[TASK-130-05](TASK-130-05-define-one-threshold-rule.md) — Define one threshold rule
