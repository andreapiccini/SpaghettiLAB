# Phase 000 — Baseline

[← Backlog index](../README.md) · [Long-form roadmap](../../IMPLEMENTATION_ROADMAP.md)

**Status:** ✅ DONE

## Goal

Confirm the existing toolchain, board, flashing path, and serial console before changing architecture code.

## Depends on

None

## Visible result

The existing Zephyr uptime firmware builds, flashes, and prints.

## Tasks

1. ✅ [TASK-000-01 — Build the untouched application](TASK-000-01-build-the-untouched-application.md)
2. ✅ [TASK-000-02 — Flash and observe the baseline](TASK-000-02-flash-and-observe-the-baseline.md)

## Phase completion gate

- [x] `make build` succeeds.
- [x] Firmware flashes through the existing workflow.
- [x] Console output is readable at 115200 baud.
- [x] Uptime increases without reset loops.
