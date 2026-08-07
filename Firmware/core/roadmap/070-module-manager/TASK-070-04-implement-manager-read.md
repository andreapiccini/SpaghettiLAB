# TASK-070-04 — Implement Manager read

**Status:** ⬜ TODO  
**Phase:** 070 — Module Manager  
**Depends on:** [TASK-070-03](TASK-070-03-implement-manager-configure.md)  
**Estimated scope:** Small

---

## Goal

Complete **Implement Manager read** and produce this focused outcome:

Instance ID and sample.

---

## Open

`subsys/module_manager/module_manager.c`.

---

## Write / Modify

Implement `spaghetti_module_manager_get_by_port()` and `spaghetti_module_manager_read()`. Validate ID, used state, READY state, output pointer, descriptor, and `read` operation before making one direct driver call.

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
- [ ] Implement `spaghetti_module_manager_get_by_port()` and `spaghetti_module_manager_read()`.
- [ ] Validate ID, used state, READY state, output pointer, descriptor, and `read` operation before making one direct driver call.
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

`module: implement manager read`

---

## Next task

[TASK-070-05](TASK-070-05-integrate-manager-into-core-and-main.md) — Integrate Manager into Core and main
