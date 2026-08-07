# Phase 030 — Port

[← Backlog index](../README.md) · [Long-form roadmap](../../IMPLEMENTATION_ROADMAP.md)

**Status:** ⬜ TODO

## Goal

Expose the verified I2C controller through the first minimal Port API.

## Depends on

[Phase 020 — Current board / I2C](../020-board-i2c/README.md)

## Visible result

Port 0 exists, reports I2C capability, and owns a ready Zephyr device.

## Tasks

1. ⬜ [TASK-030-01 — Define the Port identifier](TASK-030-01-define-the-port-identifier.md)
2. ⬜ [TASK-030-02 — Define Port capabilities](TASK-030-02-define-port-capabilities.md)
3. ⬜ [TASK-030-03 — Declare the Port public API](TASK-030-03-declare-the-port-public-api.md)
4. ⬜ [TASK-030-04 — Implement the private Port descriptor](TASK-030-04-implement-the-private-port-descriptor.md)
5. ⬜ [TASK-030-05 — Bind Port 0 to the I2C device](TASK-030-05-bind-port-0-to-the-i2c-device.md)
6. ⬜ [TASK-030-06 — Add Port to CMake](TASK-030-06-add-port-to-cmake.md)
7. ⬜ [TASK-030-07 — Initialize Port from Core](TASK-030-07-initialize-port-from-core.md)
8. ⬜ [TASK-030-08 — Test Port success and invalid IDs](TASK-030-08-test-port-success-and-invalid-ids.md)

## Phase completion gate

- [ ] Port code is linked.
- [ ] Port 0 is found.
- [ ] Port 0 reports I2C capability.
- [ ] Underlying Zephyr device is ready.
- [ ] Invalid Port ID fails safely.
