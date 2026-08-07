# TASK-130-02 — Implement safe Relay lifecycle and SET

**Status:** ⬜ TODO  
**Phase:** 130 — Relay + Runtime V1  
**Depends on:** [TASK-130-01](TASK-130-01-define-the-relay-command-contract.md)  
**Estimated scope:** Medium

---

## Goal

Complete **Implement safe Relay lifecycle and SET** and produce this focused outcome:

Applied state/status.

---

## Open

`spaghetti_modules/relay/relay.c` and the verified Port/GPIO API.

---

## Write / Modify

Implement relay init to establish the verified safe state, command to set one boolean output, and deinit to restore the safe state. Use Port rather than board GPIO constants and propagate real hardware errors.

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

- [ ] Open only `spaghetti_modules/relay/relay.c` and the verified Port/GPIO API.
- [ ] Implement relay init to establish the verified safe state, command to set one boolean output, and deinit to restore the safe state.
- [ ] Use Port rather than board GPIO constants and propagate real hardware errors.
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

`relay: implement safe relay lifecycle and set`

---

## Next task

[TASK-130-03](TASK-130-03-register-and-build-the-relay-driver.md) — Register and build the Relay driver
