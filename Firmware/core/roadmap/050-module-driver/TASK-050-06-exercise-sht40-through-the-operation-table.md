# TASK-050-06 — Exercise SHT40 through the operation table

**Status:** ⬜ TODO  
**Phase:** 050 — Module + Module Driver  
**Depends on:** [TASK-050-05](TASK-050-05-adapt-sht40-to-driver-operations.md)  
**Estimated scope:** Small

---

## Goal

Complete **Exercise SHT40 through the operation table** and produce this focused outcome:

Same real values as Milestone 4.

---

## Open

`src/main.c`, `CMakeLists.txt`, and the serial console.

---

## Write / Modify

Construct one temporary `spaghetti_module` in `main`, point it at Port 0 and `spaghetti_sht40_driver`, and replace direct wrapper calls with `driver->ops->init/read/deinit`. Preserve the one-second display loop.

> [!WARNING]
> TEMPORARY SHORTCUT
>
> The main-owned module instance is intentionally temporary and will be removed in [TASK-070-05](../070-module-manager/TASK-070-05-integrate-manager-into-core-and-main.md).


---

## Why

Registry should store a tested driver descriptor.

---

## Called / used by

Temporary main harness.

---

## Trigger

BOOT/PERIODIC READ.

---

## Invocation mechanism

DIRECT CALL through operation table.

---

## Execution context

Main thread.

---

## Calls / dependencies

Temporary SHT4x Sensor wrapper.

---

## Inputs

Module with Port 0 and output sample.

---

## Outputs

Same real values as Milestone 4.

---

## Errors to handle

Missing op, incompatible Port, prior sensor errors.

---

## Do NOT implement yet

- Registry/Manager lookup or zbus

---

## Steps

- [ ] Open only `src/main.c`, `CMakeLists.txt`, and the serial console.
- [ ] Construct one temporary `spaghetti_module` in `main`, point it at Port 0 and `spaghetti_sht40_driver`, and replace direct wrapper calls with `driver->ops->init/read/deinit`. Preserve the one-second display loop.
- [ ] Handle only these realistic errors: Missing op, incompatible Port, prior sensor errors.
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

Ensure main never calls `sensor_*` or SHT40 concrete functions directly;
it calls operation pointers.

---

## Expected result

Real readings are unchanged and `main` no longer calls the SHT40 implementation API directly.

---

## Completion checklist

- [ ] Required documentation or implementation file changed as specified
- [ ] Named type, function, configuration, or test exists
- [ ] Build succeeds when this task requires a build
- [ ] Task-specific test passes
- [ ] No unrelated functionality was added

---

## Commit suggestion

`module: exercise sht40 through the operation table`

---

## Next task

[TASK-060-01](../060-driver-registry/TASK-060-01-declare-the-driver-registry-api.md) — Declare the Driver Registry API
