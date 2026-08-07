# TASK-070-06 — Test Manager success and rollback

**Status:** ⬜ TODO  
**Phase:** 070 — Module Manager  
**Depends on:** [TASK-070-05](TASK-070-05-integrate-manager-into-core-and-main.md)  
**Estimated scope:** Small

---

## Goal

Complete **Test Manager success and rollback** and produce this focused outcome:

Instance READY and values.

---

## Open

`subsys/module_manager/module_manager.c`, `src/main.c`, and the serial console.

---

## Write / Modify

Test the valid Port 0/SHT40 path, an unknown type, an occupied Port, an invalid ID read, and a forced driver-init failure. Confirm each failed configure leaves the slot reusable.

---

## Why

Internal Config can later call exactly this Manager API.

---

## Called / used by

Main test.

---

## Trigger

BOOT/PERIODIC LOOP.

---

## Invocation mechanism

DIRECT CALL.

---

## Execution context

Main thread.

---

## Calls / dependencies

Manager -> Registry -> driver -> current static sensor.

---

## Inputs

Port 0, `sht40`.

---

## Outputs

Instance READY and values.

---

## Errors to handle

Log exact configure/read errno.

---

## Do NOT implement yet

- Config struct or CBOR

---

## Steps

- [ ] Open only `subsys/module_manager/module_manager.c`, `src/main.c`, and the serial console.
- [ ] Test the valid Port 0/SHT40 path, an unknown type, an occupied Port, an invalid ID read, and a forced driver-init failure.
- [ ] Confirm each failed configure leaves the slot reusable.
- [ ] Handle only these realistic errors: Log exact configure/read errno.
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

Also request unknown type and occupied Port in controlled test, then
restore valid path.

---

## Expected result

Manager owns the only module instance, real reads work, and failed configuration rolls back completely.

---

## Completion checklist

- [ ] Required documentation or implementation file changed as specified
- [ ] Named type, function, configuration, or test exists
- [ ] Build succeeds when this task requires a build
- [ ] Task-specific test passes
- [ ] No unrelated functionality was added

---

## Commit suggestion

`module: test manager success and rollback`

---

## Next task

[TASK-080-01](../080-runtime-removable-sht40/TASK-080-01-define-the-sht40-runtime-configuration.md) — Define the SHT40 runtime configuration
