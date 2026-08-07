# Phase 040 — SHT40 vertical slice

[← Backlog index](../README.md) · [Long-form roadmap](../../IMPLEMENTATION_ROADMAP.md)

**Status:** ⬜ TODO

## Goal

Read the real SHT40 quickly through Zephyr's temporary static sensor path.

## Depends on

[Phase 030 — Port](../030-port/README.md)

## Visible result

Real temperature and humidity values appear in the serial log.

## Tasks

1. ⬜ [TASK-040-01 — Inspect the installed SHT4x driver](TASK-040-01-inspect-the-installed-sht4x-driver.md)
2. ⬜ [TASK-040-02 — Add the temporary SHT40 Devicetree node](TASK-040-02-add-the-temporary-sht40-devicetree-node.md)
3. ⬜ [TASK-040-03 — Enable the Sensor API](TASK-040-03-enable-the-sensor-api.md)
4. ⬜ [TASK-040-04 — Declare the temporary SHT40 wrapper API](TASK-040-04-declare-the-temporary-sht40-wrapper-api.md)
5. ⬜ [TASK-040-05 — Implement the temporary SHT40 wrapper](TASK-040-05-implement-the-temporary-sht40-wrapper.md)
6. ⬜ [TASK-040-06 — Add the SHT40 wrapper to CMake](TASK-040-06-add-the-sht40-wrapper-to-cmake.md)
7. ⬜ [TASK-040-07 — Call the SHT40 wrapper from main](TASK-040-07-call-the-sht40-wrapper-from-main.md)
8. ⬜ [TASK-040-08 — Build and inspect the SHT40 image](TASK-040-08-build-and-inspect-the-sht40-image.md)
9. ⬜ [TASK-040-09 — Flash and test the real SHT40](TASK-040-09-flash-and-test-the-real-sht40.md)

## Phase completion gate

- [ ] Static SHT4x device is ready.
- [ ] Real temperature is printed.
- [ ] Real humidity is printed.
- [ ] Missing sensor produces a controlled error.
- [ ] Static node/wrapper are marked TEMPORARY SHORTCUT.
