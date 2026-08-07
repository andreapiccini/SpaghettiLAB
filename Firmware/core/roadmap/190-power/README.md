# Phase 190 — Power

[← Backlog index](../README.md) · [Long-form roadmap](../../IMPLEMENTATION_ROADMAP.md)

**Status:** ⬜ TODO

## Goal

Add only a real, measured power resource with safe acquire/release ownership.

## Depends on

[Phase 180 — Multiple Core variants](../180-multi-core/README.md)

## Visible result

One power resource transitions correctly under two-owner and rollback tests.

## Tasks

1. ⬜ [TASK-190-01 — Verify controllable power hardware](TASK-190-01-verify-controllable-power-hardware.md)
2. ⬜ [TASK-190-02 — Define the Power public API](TASK-190-02-define-the-power-public-api.md)
3. ⬜ [TASK-190-03 — Implement reference counting with a fake backend](TASK-190-03-implement-reference-counting-with-a-fake-backend.md)
4. ⬜ [TASK-190-04 — Test Power ownership and rollback logic](TASK-190-04-test-power-ownership-and-rollback-logic.md)
5. ⬜ [TASK-190-05 — Connect Power to the real control](TASK-190-05-connect-power-to-the-real-control.md)
6. ⬜ [TASK-190-06 — Integrate Power with Manager and test hardware](TASK-190-06-integrate-power-with-manager-and-test-hardware.md)

## Phase completion gate

- [ ] Power hardware is real and documented.
- [ ] Reference-count tests pass with two owners.
- [ ] Manager rollback releases acquired power.
- [ ] Real transitions are electrically verified.
- [ ] No speculative sleep/battery/OTA functionality was added.
