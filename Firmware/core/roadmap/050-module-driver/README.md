# Phase 050 — Module + Module Driver

[← Backlog index](../README.md) · [Long-form roadmap](../../IMPLEMENTATION_ROADMAP.md)

**Status:** ⬜ TODO

## Goal

Introduce the minimal module instance and driver operation contracts around the working SHT40 path.

## Depends on

[Phase 040 — SHT40 vertical slice](../040-sht40/README.md)

## Visible result

The SHT40 is called only through a module-driver operation table.

## Tasks

1. ⬜ [TASK-050-01 — Define the minimal module instance](TASK-050-01-define-the-minimal-module-instance.md)
2. ⬜ [TASK-050-02 — Define the temporary sample contract](TASK-050-02-define-the-temporary-sample-contract.md)
3. ⬜ [TASK-050-03 — Define the module-driver operation table](TASK-050-03-define-the-module-driver-operation-table.md)
4. ⬜ [TASK-050-04 — Declare the SHT40 driver descriptor](TASK-050-04-declare-the-sht40-driver-descriptor.md)
5. ⬜ [TASK-050-05 — Adapt SHT40 to driver operations](TASK-050-05-adapt-sht40-to-driver-operations.md)
6. ⬜ [TASK-050-06 — Exercise SHT40 through the operation table](TASK-050-06-exercise-sht40-through-the-operation-table.md)

## Phase completion gate

- [ ] Module ownership is documented.
- [ ] Driver descriptor has only required initial operations.
- [ ] Main reads through the operation table.
- [ ] Real measurement still works.
