# TASK-020-01 — Verify the real I2C controller and pins

**Status:** ⬜ TODO  
**Phase:** 020 — Current board / I2C  
**Depends on:** [TASK-010-07](../010-core/TASK-010-07-build-and-flash-the-core-boundary.md)
**Estimated scope:** Small

---

## Goal

Complete **Verify the real I2C controller and pins** and produce this focused outcome:

Verified mapping, not guessed values.

---

## Open

The Core schematic, module connector schematic, and current ESP32-C3 board pinout.

---

## Write / Modify

Record the exact controller, SDA pin, SCL pin, pull-up arrangement, power rail, and board revision that physically reach the intended Spaghetti Port. Do not edit production files.

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

Schematic and ESP32-C3 board DTS.

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

## Steps

- [ ] Open only The Core schematic, module connector schematic, and current ESP32-C3 board pinout.
- [ ] Record the exact controller, SDA pin, SCL pin, pull-up arrangement, power rail, and board revision that physically reach the intended Spaghetti Port.
- [ ] Do not edit production files.
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

Cross-check the mapping against the schematic and continuity information.

---

## Expected result

One unambiguous, revision-specific I2C mapping is recorded for the next task.

---

## Completion checklist

- [ ] Required documentation or implementation file changed as specified
- [ ] Named type, function, configuration, or test exists
- [ ] Build succeeds when this task requires a build
- [ ] Task-specific test passes
- [ ] No unrelated functionality was added

---

## Commit suggestion

`current: verify the real i2c controller and pins`

---

## Next task

[TASK-020-02](TASK-020-02-inspect-the-current-generated-devicetree.md) — Inspect the current generated Devicetree
