# Phase 010 — Core

[← Backlog index](../README.md) · [Long-form roadmap](../../IMPLEMENTATION_ROADMAP.md)

**Status:** ⬜ TODO

## Goal

Introduce the smallest board-independent Core boot boundary.

## Depends on

[Phase 000 — Baseline](../000-baseline/README.md)

## Visible result

`main` boots through `spaghetti_core_init()` and the console reports Core readiness.

## Tasks

1. ⬜ [TASK-010-01 — Define the Core public API](TASK-010-01-define-the-core-public-api.md)
2. ⬜ [TASK-010-02 — Implement Core state and initialization](TASK-010-02-implement-core-state-and-initialization.md)
3. ⬜ [TASK-010-03 — Add Core to the application build](TASK-010-03-add-core-to-the-application-build.md)
4. ⬜ [TASK-010-04 — Call Core from main](TASK-010-04-call-core-from-main.md)
5. ⬜ [TASK-010-05 — Build and flash the Core boundary](TASK-010-05-build-and-flash-the-core-boundary.md)

## Phase completion gate

- [ ] Core header is minimal and board-independent.
- [ ] Core source is compiled by CMake.
- [ ] `spaghetti_core_init()` returns zero.
- [ ] Board boots and still prints uptime.
