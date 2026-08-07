# Phase 120 — Runtime V0

[← Backlog index](../README.md) · [Long-form roadmap](../../IMPLEMENTATION_ROADMAP.md)

**Status:** ⬜ TODO

## Goal

Move periodic sampling from `main` into a timer-signalled Runtime thread.

## Depends on

[Phase 110 — Data / zbus](../110-data-zbus/README.md)

## Visible result

Runtime samples temperature every 1000 ms while `main` only boots Core.

## Tasks

1. ⬜ [TASK-120-01 — Define the Runtime sampling task API](TASK-120-01-define-the-runtime-sampling-task-api.md)
2. ⬜ [TASK-120-02 — Implement the one-period Timer service](TASK-120-02-implement-the-one-period-timer-service.md)
3. ⬜ [TASK-120-03 — Implement the Runtime sampling thread](TASK-120-03-implement-the-runtime-sampling-thread.md)
4. ⬜ [TASK-120-04 — Implement Runtime load, start, and stop](TASK-120-04-implement-runtime-load-start-and-stop.md)
5. ⬜ [TASK-120-05 — Integrate Runtime with Core and Config](TASK-120-05-integrate-runtime-with-core-and-config.md)
6. ⬜ [TASK-120-06 — Remove the sampling loop from main and test cadence](TASK-120-06-remove-the-sampling-loop-from-main-and-test-cadence.md)

## Phase completion gate

- [ ] Timer callback performs no I/O/blocking.
- [ ] Runtime thread performs Manager read.
- [ ] Main no longer samples directly.
- [ ] Real Data sample appears every ~1000 ms.
- [ ] Runtime stop prevents further acquisitions.
