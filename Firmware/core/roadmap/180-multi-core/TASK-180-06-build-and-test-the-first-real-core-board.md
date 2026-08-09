# TASK-180-06 — Build and test the first real Core board

**Status:** ⬜ TODO  
**Phase:** 180 — Multiple Core variants  
**Depends on:** [TASK-180-05](TASK-180-05-enumerate-devicetree-ports.md)  
**Estimated scope:** Small

---

## Goal

Complete **Build and test the first real Core board** and produce this focused outcome:

Same Port 0/SHT40 behavior on custom board target.

---

## Open

Board files, generated DTS/config, and the connected Core hardware.

---

## Write / Modify

Select the new board through the existing `BOARD` environment/configuration path, run a pristine build, inspect generated Port nodes, flash, and repeat the SHT40/Relay paths without higher-layer changes.

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

- [ ] Open only Board files, generated DTS/config, and the connected Core hardware.
- [ ] Select the new board through the existing `BOARD` environment/configuration path, run a pristine build, inspect generated Port nodes, flash, and repeat the SHT40/Relay paths without higher-layer changes.
- [ ] Handle only these realistic errors: Board discovery, DTS validation, device readiness.
- [ ] Confirm no item from **Do NOT implement yet** was added
- [ ] Run the task test and compare it with **Expected result**

---

## Build

YES — `make pristine`

---

## Flash

YES — run `make flash`, then `make screen`; pass `PORT=...` only when needed.

---

## Test

Compare Port capability/status and real measurement with old devkit target.

---

## Expected result

The real board boots and exposes its actual Port count/capabilities through the unchanged public API.

---

## Completion checklist

- [ ] Required documentation or implementation file changed as specified
- [ ] Named type, function, configuration, or test exists
- [ ] Build succeeds when this task requires a build
- [ ] Task-specific test passes
- [ ] No unrelated functionality was added

---

## Commit suggestion

`multiple: build and test the first real core board`

---

## Next task

[TASK-180-07](TASK-180-07-build-a-second-core-variant.md) — Build a second Core variant
