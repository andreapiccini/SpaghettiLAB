# Phase 080 — Runtime-removable SHT40

[← Backlog index](../README.md) · [Long-form roadmap](../../IMPLEMENTATION_ROADMAP.md)

**Status:** ⬜ TODO

## Goal

Replace the temporary static sensor device with runtime address configuration and direct I2C.

## Depends on

[Phase 070 — Module Manager](../070-module-manager/README.md)

## Visible result

The SHT40 remains readable after all static SHT4x shortcuts are removed.

## Tasks

1. ⬜ [TASK-080-01 — Define the SHT40 runtime configuration](TASK-080-01-define-the-sht40-runtime-configuration.md)
2. ⬜ [TASK-080-02 — Pass bounded driver configuration through Manager](TASK-080-02-pass-bounded-driver-configuration-through-manager.md)
3. ⬜ [TASK-080-03 — Implement direct-I2C SHT40 measurement](TASK-080-03-implement-direct-i2c-sht40-measurement.md)
4. ⬜ [TASK-080-04 — Validate CRC and convert SHT40 samples](TASK-080-04-validate-crc-and-convert-sht40-samples.md)
5. ⬜ [TASK-080-05 — Remove the static sensor shortcut](TASK-080-05-remove-the-static-sensor-shortcut.md)
6. ⬜ [TASK-080-06 — Regression-test the runtime SHT40](TASK-080-06-regression-test-the-runtime-sht40.md)

## Phase completion gate

- [ ] No removable SHT40 node remains in Devicetree.
- [ ] SHT40 uses Port + Zephyr I2C API.
- [ ] Address is instance configuration, not driver global.
- [ ] CRC/I2C errors are handled.
- [ ] Real measurements still work.
