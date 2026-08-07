# TASK-070-02 — Implement the one-slot Manager state

**Status:** ⬜ TODO  
**Phase:** 070 — Module Manager  
**Depends on:** [TASK-070-01](TASK-070-01-declare-the-module-manager-api.md)  
**Estimated scope:** Small

---

## Goal

Complete **Implement the one-slot Manager state** and produce this focused outcome:

Instance ID and sample.

---

## Open

`subsys/module_manager/module_manager.c`.

---

## Write / Modify

Create one private `spaghetti_module` slot plus a used flag. Implement `spaghetti_module_manager_init()` to clear all state and define strict ID/occupancy helpers without calling a driver yet.

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
- [ ] Create one private `spaghetti_module` slot plus a used flag.
- [ ] Implement `spaghetti_module_manager_init()` to clear all state and define strict ID/occupancy helpers without calling a driver yet.
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

`module: implement the one-slot manager state`

---

## Next task

[TASK-070-03](TASK-070-03-implement-manager-configure.md) — Implement Manager configure
