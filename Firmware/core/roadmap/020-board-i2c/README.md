# Phase 020 — Current board / I2C

[← Backlog index](../README.md) · [Long-form roadmap](../../IMPLEMENTATION_ROADMAP.md)

**Status:** ⬜ TODO

## Goal

Enable one schematic-verified I2C controller on the current ESP32-C3 board.

## Depends on

[Phase 010 — Core](../010-core/README.md)

## Visible result

The generated DTS contains the real enabled I2C controller and the firmware still boots.

## Tasks

1. ⬜ [TASK-020-01 — Verify the real I2C controller and pins](TASK-020-01-verify-the-real-i2c-controller-and-pins.md)
2. ⬜ [TASK-020-02 — Inspect the current generated Devicetree](TASK-020-02-inspect-the-current-generated-devicetree.md)
3. ⬜ [TASK-020-03 — Enable the I2C node in the board overlay](TASK-020-03-enable-the-i2c-node-in-the-board-overlay.md)
4. ⬜ [TASK-020-04 — Enable Zephyr I2C support](TASK-020-04-enable-zephyr-i2c-support.md)
5. ⬜ [TASK-020-05 — Inspect generated I2C configuration](TASK-020-05-inspect-generated-i2c-configuration.md)
6. ⬜ [TASK-020-06 — Flash the I2C baseline](TASK-020-06-flash-the-i2c-baseline.md)

## Phase completion gate

- [ ] Controller/pins are confirmed from real hardware.
- [ ] No symbolic placeholder remains in production overlay.
- [ ] `make pristine` succeeds.
- [ ] Final DTS shows the intended I2C controller enabled.
- [ ] `.config` contains `CONFIG_I2C=y`.
