# TASK-050-01 — Define the minimal module instance

**Status:** ⬜ TODO  
**Phase:** 050 — Module + Module Driver  
**Depends on:** [TASK-040-09](../040-sht40/TASK-040-09-flash-and-test-the-real-sht40.md)  
**Estimated scope:** Small

---

## Goal

Complete **Define the minimal module instance** and produce this focused outcome:

Minimal runtime instance layout.

---

## Open

`include/spaghetti/module.h`.

---

## Write / Modify

Define `spaghetti_module_id_t`, the `UNINITIALIZED`, `READY`, and `ERROR` state values, and `struct spaghetti_module` with only ID, Port pointer, driver pointer, and private context pointer. Forward-declare Port and driver types to avoid cyclic includes.

---

## Why

Registry/Manager need a small common object, not the final huge model.

---

## Called / used by

Driver operations, Manager, Runtime later.

---

## Trigger

MODULE CONFIGURATION.

---

## Invocation mechanism

DIRECT CALL object passing.

---

## Execution context

Calling thread.

---

## Calls / dependencies

Port/driver declarations only.

---

## Inputs

Manager-supplied fields.

---

## Outputs

Minimal runtime instance layout.

---

## Errors to handle

None in type; document invalid/null relationships.

---

## Do NOT implement yet

- Names, discovery metadata, data queues, MQTT state

---

## Steps

- [ ] Open only `include/spaghetti/module.h`.
- [ ] Define `spaghetti_module_id_t`, the `UNINITIALIZED`, `READY`, and `ERROR` state values, and `struct spaghetti_module` with only ID, Port pointer, driver pointer, and private context pointer. Forward-declare Port and driver types to avoid cyclic includes.
- [ ] Handle only these realistic errors: None in type; document invalid/null relationships.
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

Ownership checklist: CREATED/OWNED/MODIFIED/DESTROYED by Manager; READ by
driver/Runtime/Communication.

---

## Expected result

Instance and type are clearly distinct.

---

## Completion checklist

- [ ] Required documentation or implementation file changed as specified
- [ ] Named type, function, configuration, or test exists
- [ ] Build succeeds when this task requires a build
- [ ] Task-specific test passes
- [ ] No unrelated functionality was added

---

## Commit suggestion

`module: define the minimal module instance`

---

## Next task

[TASK-050-02](TASK-050-02-define-the-temporary-sample-contract.md) — Define the temporary sample contract
