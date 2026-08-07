# Phase 060 — Driver Registry

[← Backlog index](../README.md) · [Long-form roadmap](../../IMPLEMENTATION_ROADMAP.md)

**Status:** ⬜ TODO

## Goal

Register compiled module drivers behind a fixed lookup API.

## Depends on

[Phase 050 — Module + Module Driver](../050-module-driver/README.md)

## Visible result

The `sht40` lookup succeeds and an unknown type fails cleanly.

## Tasks

1. ⬜ [TASK-060-01 — Declare the Driver Registry API](TASK-060-01-declare-the-driver-registry-api.md)
2. ⬜ [TASK-060-02 — Implement the fixed driver table](TASK-060-02-implement-the-fixed-driver-table.md)
3. ⬜ [TASK-060-03 — Validate registry entries](TASK-060-03-validate-registry-entries.md)
4. ⬜ [TASK-060-04 — Initialize the Registry from Core](TASK-060-04-initialize-the-registry-from-core.md)
5. ⬜ [TASK-060-05 — Test known and unknown driver lookup](TASK-060-05-test-known-and-unknown-driver-lookup.md)

## Phase completion gate

- [ ] Registry initializes once.
- [ ] `find("sht40")` returns the SHT40 descriptor.
- [ ] `find("does-not-exist")` returns `NULL`.
- [ ] Registry performs no driver lifecycle call.
