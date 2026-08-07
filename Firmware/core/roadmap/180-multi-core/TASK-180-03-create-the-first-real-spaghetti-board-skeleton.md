# TASK-180-03 — Create the first real Spaghetti board skeleton

**Status:** ⬜ TODO  
**Phase:** 180 — Multiple Core variants  
**Depends on:** [TASK-180-02](TASK-180-02-validate-the-port-binding.md)  
**Estimated scope:** Medium

---

## Goal

Complete **Create the first real Spaghetti board skeleton** and produce this focused outcome:

Same Port 0/SHT40 behavior on custom board target.

---

## Open

Create the required files under `boards/spaghettilab/<real_core_name>/` following the installed Zephyr board model.

---

## Write / Modify

Add only the verified `board.yml`, board DTS, `Kconfig.<board>`, defconfig, and required qualifier/runner metadata. Use installed Zephyr 4.4 board conventions and no speculative variants.

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

- [ ] Open only Create the required files under `boards/spaghettilab/<real_core_name>/` following the installed Zephyr board model.
- [ ] Add only the verified `board.yml`, board DTS, `Kconfig.<board>`, defconfig, and required qualifier/runner metadata.
- [ ] Use installed Zephyr 4.4 board conventions and no speculative variants.
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

`multiple: create the first real spaghetti board skeleton`

---

## Next task

[TASK-180-04](TASK-180-04-move-verified-hardware-facts-into-board-dts.md) — Move verified hardware facts into board DTS
