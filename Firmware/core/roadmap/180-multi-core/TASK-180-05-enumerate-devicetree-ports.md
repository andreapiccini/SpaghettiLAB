# TASK-180-05 — Enumerate Devicetree Ports

**Status:** ⬜ TODO  
**Phase:** 180 — Multiple Core variants  
**Depends on:** [TASK-180-04](TASK-180-04-move-verified-hardware-facts-into-board-dts.md)  
**Estimated scope:** Medium

---

## Goal

Complete **Enumerate Devicetree Ports** and produce this focused outcome:

Same Port 0/SHT40 behavior on custom board target.

---

## Open

`subsys/port/port.c`.

---

## Write / Modify

Replace the single hardcoded descriptor and `DT_NODELABEL(i2c...)` reference with compile-time enumeration of enabled `spaghettilab,port` instances. Populate fixed descriptors from generated properties and delete the temporary Port 0 hardcode.

---

## Why

The abstraction is already proven, so refactor has observable parity.

---

## Called / used by

West/CMake/Port.

---

## Trigger

BUILD/BOOT.

---

## Invocation mechanism

BUILD TIME descriptors then BOOT DIRECT CALL.

---

## Execution context

Build tools/main thread.

---

## Calls / dependencies

Generated macros and Device Model.

---

## Inputs

Real first-Core board description.

---

## Outputs

Same Port 0/SHT40 behavior on custom board target.

---

## Errors to handle

Board discovery, DTS validation, device readiness.

---

## Do NOT implement yet

- Copy all devkit definitions blindly or add second board guesses

---

## Steps

- [ ] Open only `subsys/port/port.c`.
- [ ] Replace the single hardcoded descriptor and `DT_NODELABEL(i2c...)` reference with compile-time enumeration of enabled `spaghettilab,port` instances. Populate fixed descriptors from generated properties and delete the temporary Port 0 hardcode.
- [ ] Handle only these realistic errors: Board discovery, DTS validation, device readiness.
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

Compare Port capability/status and real measurement with old devkit target.

---

## Expected result

No C3 pin/controller label in higher layers or Port catalog data.

---

## Completion checklist

- [ ] Required documentation or implementation file changed as specified
- [ ] Named type, function, configuration, or test exists
- [ ] Build succeeds when this task requires a build
- [ ] Task-specific test passes
- [ ] No unrelated functionality was added

---

## Commit suggestion

`multiple: enumerate devicetree ports`

---

## Next task

[TASK-180-06](TASK-180-06-build-and-test-the-first-real-core-board.md) — Build and test the first real Core board
