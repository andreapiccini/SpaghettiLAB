# TASK-010-07 — Build and flash the Core boundary

**Status:** ⬜ TODO
**Phase:** 010 — Core
**Depends on:** [TASK-010-06](TASK-010-06-define-component-type-and-error-conventions.md)
**Estimated scope:** Small

---

## Goal

Complete **Build and flash the Core boundary** and produce this focused outcome:

Structured Core log then structured uptime log.

---

## Open

`README.md`, `src/main.c`, and the serial console.

---

## Write / Modify

Do not add code. Build, flash, reset the board, and capture the boot output that
proves Core initializes before the temporary uptime loop.

---

## Why

The boundary, logging policy, and type conventions are complete only after the
firmware is observed on the real board.

---

## Called / used by

Zephyr invokes `main`; `main` calls Core; the log backend reports both modules.

---

## Trigger

BOOT.

---

## Invocation mechanism

DIRECT CALL and Zephyr Logging.

---

## Execution context

Main thread and Zephyr logging context.

---

## Calls / dependencies

`spaghetti_core_init()` and the configured logging backend.

---

## Inputs

None.

---

## Outputs

Structured Core readiness followed by structured application uptime.

---

## Errors to handle

Negative init result, missing serial output, wrong serial port, or unexpected log
filtering.

---

## Do NOT implement yet

- Move the loop into Core or start other threads.
- Change logging or type conventions while performing the hardware proof.

---

## Steps

- [ ] Open only `README.md`, `src/main.c`, and the serial console.
- [ ] Run the validator and build without changing source.
- [ ] Flash, reset the board, and capture the boot output.
- [ ] Confirm `spaghetti_core` reports READY once before the first `spaghetti_app` uptime message.
- [ ] Confirm no raw application `printk` line appears.
- [ ] Handle only the errors listed in **Errors to handle**.
- [ ] Confirm no item from **Do NOT implement yet** was added.

---

## Build

YES — `make build`.

---

## Flash

YES — use the host-specific workflow in the root `README.md`.

---

## Test

Reset with the serial monitor open. Confirm each line contains the expected
Zephyr module/level information and that Core readiness appears once before
uptime output.

---

## Expected result

The board boots through Core, reports structured boot diagnostics, and preserves
the temporary uptime behavior.

---

## Completion checklist

- [ ] Validator and build complete.
- [ ] Firmware is flashed to the intended board.
- [ ] Core readiness appears once before uptime.
- [ ] App and Core module names/severities are visible and correct.
- [ ] No raw project-owned print or unrelated functionality was added.

---

## Commit suggestion

`core: build and flash the structured core boundary`

---

## Next task

[TASK-020-01](../020-board-i2c/TASK-020-01-verify-the-real-i2c-controller-and-pins.md) — Verify the real I2C controller and pins
