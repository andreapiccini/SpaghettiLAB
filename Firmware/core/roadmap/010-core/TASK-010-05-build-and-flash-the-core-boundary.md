# TASK-010-05 — Build and flash the Core boundary

**Status:** ⬜ TODO  
**Phase:** 010 — Core  
**Depends on:** [TASK-010-04](TASK-010-04-call-core-from-main.md)  
**Estimated scope:** Small

---

## Goal

Complete **Build and flash the Core boundary** and produce this focused outcome:

Core log then uptime.

---

## Open

`README.md`, `src/main.c`, and the serial console.

---

## Write / Modify

Do not add code. Build, flash, reset the board, and capture the boot output that proves Core initializes before the existing uptime loop.

---

## Why

The boundary is useful only when exercised.

---

## Called / used by

Zephyr invokes `main`; `main` calls Core.

---

## Trigger

BOOT.

---

## Invocation mechanism

DIRECT CALL.

---

## Execution context

Main thread.

---

## Calls / dependencies

`spaghetti_core_init()`.

---

## Inputs

None.

---

## Outputs

Core log then uptime.

---

## Errors to handle

Negative init result.

---

## Do NOT implement yet

- Move the loop into Core or start other threads

---

## Steps

- [ ] Open only `README.md`, `src/main.c`, and the serial console.
- [ ] Do not add code. Build, flash, reset the board, and capture the boot output that proves Core initializes before the existing uptime loop.
- [ ] Handle only these realistic errors: Negative init result.
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

Reset with the serial monitor open and confirm `Spaghetti Core ready` appears once before uptime output.

---

## Expected result

The board boots through Core and preserves the original uptime behavior.

---

## Completion checklist

- [ ] Required documentation or implementation file changed as specified
- [ ] Named type, function, configuration, or test exists
- [ ] Build succeeds when this task requires a build
- [ ] Task-specific test passes
- [ ] No unrelated functionality was added

---

## Commit suggestion

`core: build and flash the core boundary`

---

## Next task

[TASK-020-01](../020-board-i2c/TASK-020-01-verify-the-real-i2c-controller-and-pins.md) — Verify the real I2C controller and pins
