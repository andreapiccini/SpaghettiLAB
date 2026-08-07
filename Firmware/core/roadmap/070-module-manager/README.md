# Phase 070 — Module Manager

[← Backlog index](../README.md) · [Long-form roadmap](../../IMPLEMENTATION_ROADMAP.md)

**Status:** ⬜ TODO

## Goal

Give one Manager-owned module instance a complete configure and read lifecycle.

## Depends on

[Phase 060 — Driver Registry](../060-driver-registry/README.md)

## Visible result

A Manager call configures Port 0 as SHT40 and reads the real sensor.

## Tasks

1. ⬜ [TASK-070-01 — Declare the Module Manager API](TASK-070-01-declare-the-module-manager-api.md)
2. ⬜ [TASK-070-02 — Implement the one-slot Manager state](TASK-070-02-implement-the-one-slot-manager-state.md)
3. ⬜ [TASK-070-03 — Implement Manager configure](TASK-070-03-implement-manager-configure.md)
4. ⬜ [TASK-070-04 — Implement Manager read](TASK-070-04-implement-manager-read.md)
5. ⬜ [TASK-070-05 — Integrate Manager into Core and main](TASK-070-05-integrate-manager-into-core-and-main.md)
6. ⬜ [TASK-070-06 — Test Manager success and rollback](TASK-070-06-test-manager-success-and-rollback.md)

## Phase completion gate

- [ ] Manager owns the only module instance.
- [ ] Configure calls Port, Registry, then driver in that order.
- [ ] Port 0/SHT40 reaches READY.
- [ ] Unknown type and occupied Port fail cleanly.
- [ ] Real read works through Manager.
