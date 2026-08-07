# TASK-070-03 — Implement Manager configure

**Status:** ⬜ TODO  
**Phase:** 070 — Module Manager  
**Depends on:** [TASK-070-02](TASK-070-02-implement-the-one-slot-manager-state.md)  
**Estimated scope:** Small

---

## Goal

Complete **Implement Manager configure** and produce this focused outcome:

Instance ID and sample.

---

## Open

`subsys/module_manager/module_manager.c`.

---

## Write / Modify

Implement configure in this order: validate output pointer and free slot; call `spaghetti_port_get()`; call `spaghetti_driver_registry_find()`; verify required capabilities; populate provisional state; call driver `init`; commit READY and output ID only on success. Clear the slot on every failure.

---

## Why

One slot makes failure/ownership visible before adding complexity.

---

## Called / used by

Main test/Runtime.

---

## Trigger

MODULE CONFIGURATION/READ.

---

## Invocation mechanism

DIRECT CALL chain.

---

## Execution context

Main/calling thread.

---

## Calls / dependencies

`port_get` -> `registry_find` -> `driver->init/read`.

---

## Inputs

Valid IDs and output pointers.

---

## Outputs

Instance ID and sample.

---

## Errors to handle

`-EINVAL`, `-ENOENT`, `-ENOTSUP`, `-EBUSY`, driver errno.

---

## Do NOT implement yet

- Threads, queues, replacement, callbacks

---

## Steps

- [ ] Open only `subsys/module_manager/module_manager.c`.
- [ ] Implement configure in this order: validate output pointer and free slot
- [ ] call `spaghetti_port_get()`
- [ ] call `spaghetti_driver_registry_find()`
- [ ] verify required capabilities
- [ ] populate provisional state
- [ ] call driver `init`
- [ ] commit READY and output ID only on success. Clear the slot on every failure.
- [ ] Handle only these realistic errors: `-EINVAL`, `-ENOENT`, `-ENOTSUP`, `-EBUSY`, driver errno.
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

Mentally trace rollback before compiling.

---

## Expected result

No partially READY instance after failure.

---

## Completion checklist

- [ ] Required documentation or implementation file changed as specified
- [ ] Named type, function, configuration, or test exists
- [ ] Build succeeds when this task requires a build
- [ ] Task-specific test passes
- [ ] No unrelated functionality was added

---

## Commit suggestion

`module: implement manager configure`

---

## Next task

[TASK-070-04](TASK-070-04-implement-manager-read.md) — Implement Manager read
