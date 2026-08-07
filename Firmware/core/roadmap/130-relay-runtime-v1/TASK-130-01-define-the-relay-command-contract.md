# TASK-130-01 — Define the Relay command contract

**Status:** ⬜ TODO  
**Phase:** 130 — Relay + Runtime V1  
**Depends on:** [TASK-120-06](../120-runtime-v0/TASK-120-06-remove-the-sampling-loop-from-main-and-test-cadence.md)  
**Estimated scope:** Small

---

## Goal

Complete **Define the Relay command contract** and produce this focused outcome:

Applied state/status.

---

## Open

`spaghetti_modules/relay/relay.h` and `include/spaghetti/module_driver.h`.

---

## Write / Modify

Add only the driver `command(module, command, value)` operation required for a logical boolean SET. Define the minimum Relay command/value types and a private relay config tied to a real Port capability.

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

- [ ] Open only `spaghetti_modules/relay/relay.h` and `include/spaghetti/module_driver.h`.
- [ ] Add only the driver `command(module, command, value)` operation required for a logical boolean SET.
- [ ] Define the minimum Relay command/value types and a private relay config tied to a real Port capability.
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

`relay: define the relay command contract`

---

## Next task

[TASK-130-02](TASK-130-02-implement-safe-relay-lifecycle-and-set.md) — Implement safe Relay lifecycle and SET
