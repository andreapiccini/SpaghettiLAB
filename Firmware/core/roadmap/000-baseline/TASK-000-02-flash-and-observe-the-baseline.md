# TASK-000-02 — Flash and observe the baseline

**Status:** ✅ DONE  
**Phase:** 000 — Baseline  
**Depends on:** [TASK-000-01](TASK-000-01-build-the-untouched-application.md)  
**Estimated scope:** Small

---

## Goal

Complete **Flash and observe the baseline** and produce this focused outcome:

Boot greeting and uptime every five seconds at 115200 baud.

---

## Open

Root `README.md`, section “Flash and serial console” for the host OS.

---

## Write / Modify

Nothing.

---

## Why

Port/I2C work should start only after console and board reset work.

---

## Called / used by

Developer.

---

## Trigger

FIRMWARE DEPLOY.

---

## Invocation mechanism

HOST FLASH TOOL, then serial monitor.

---

## Execution context

Host OS.

---

## Calls / dependencies

Run `make flash`, then `make screen` on Linux, macOS, or Windows. The active
Zephyr build selects the flash runner; use `PORT=<device>` only when automatic
detection is unavailable or ambiguous.

---

## Inputs

Built image and an automatically detected port or explicit `PORT`.

---

## Outputs

Boot greeting and uptime every five seconds at 115200 baud.

---

## Errors to handle

Busy/wrong port and bootloader entry failure.

---

## Do NOT implement yet

- I2C or new logging

---

## Steps

- [x] Open only Root `README.md`, section “Flash and serial console” for the host OS.
- [x] Nothing.
- [x] Handle only these realistic errors: Busy/wrong port and bootloader entry failure.
- [x] Confirm no item from **Do NOT implement yet** was added
- [x] Run the task test and compare it with **Expected result**

---

## Build

NO

---

## Flash

YES — run `make flash`, then `make screen`; pass `PORT=...` only when needed.

---

## Test

Reset board with serial monitor open.

---

## Expected result

The console prints the ESP32-C3 greeting and increasing uptime at 115200 baud.

---

## Completion checklist

- [x] Required documentation or implementation file changed as specified
- [x] Named type, function, configuration, or test exists
- [x] Build succeeds when this task requires a build
- [x] Task-specific test passes
- [x] No unrelated functionality was added

---

## Commit suggestion

`baseline: flash and observe the baseline`

---

## Next task

[TASK-010-01](../010-core/TASK-010-01-define-the-core-public-api.md) — Define the Core public API
