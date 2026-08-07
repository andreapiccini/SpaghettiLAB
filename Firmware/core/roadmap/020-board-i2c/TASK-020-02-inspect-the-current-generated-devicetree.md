# TASK-020-02 — Inspect the current generated Devicetree

**Status:** ⬜ TODO  
**Phase:** 020 — Current board / I2C  
**Depends on:** [TASK-020-01](TASK-020-01-verify-the-real-i2c-controller-and-pins.md)  
**Estimated scope:** Small

---

## Goal

Complete **Inspect the current generated Devicetree** and produce this focused outcome:

Verified mapping, not guessed values.

---

## Open

`build/zephyr/zephyr.dts` and the installed ESP32-C3 DTS/pinctrl definitions inside `make shell`.

---

## Write / Modify

Locate the verified I2C controller label, its current status, and the installed ESP32-C3 pinctrl syntax. Record the exact node labels needed by the overlay; do not edit generated files.

---

## Why

I2C cannot be safely enabled without real wiring.

---

## Called / used by

Board overlay work.

---

## Trigger

HARDWARE BRING-UP.

---

## Invocation mechanism

DESIGN/BUILD-TIME INPUT.

---

## Execution context

Developer review.

---

## Calls / dependencies

Generated Zephyr Devicetree and installed ESP32-C3 DTS files.

---

## Inputs

Real controller and pins; whether pull-ups/power exist.

---

## Outputs

Verified mapping, not guessed values.

---

## Errors to handle

Ambiguous revision/wiring: stop and resolve physically.

---

## Do NOT implement yet

- Custom board or Spaghetti binding

---

## Zephyr note

Devicetree is a compile-time hardware description. `build/zephyr/zephyr.dts` is generated output and must only be inspected, never edited.

---

## Steps

- [ ] Open only `build/zephyr/zephyr.dts` and the installed ESP32-C3 DTS/pinctrl definitions inside `make shell`.
- [ ] Locate the verified I2C controller label, its current status, and the installed ESP32-C3 pinctrl syntax.
- [ ] Record the exact node labels needed by the overlay
- [ ] do not edit generated files.
- [ ] Handle only these realistic errors: Ambiguous revision/wiring: stop and resolve physically.
- [ ] Confirm no item from **Do NOT implement yet** was added
- [ ] Run the task test and compare it with **Expected result**

---

## Build

NO

---

## Flash

NO

---

## Test

Continuity/schematic cross-check where appropriate.

---

## Expected result

The controller and pinctrl labels are known and contain no guessed GPIO values.

---

## Completion checklist

- [ ] Required documentation or implementation file changed as specified
- [ ] Named type, function, configuration, or test exists
- [ ] Build succeeds when this task requires a build
- [ ] Task-specific test passes
- [ ] No unrelated functionality was added

---

## Commit suggestion

`current: inspect the current generated devicetree`

---

## Next task

[TASK-020-03](TASK-020-03-enable-the-i2c-node-in-the-board-overlay.md) — Enable the I2C node in the board overlay
