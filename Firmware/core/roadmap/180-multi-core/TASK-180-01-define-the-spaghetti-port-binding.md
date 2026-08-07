# TASK-180-01 — Define the Spaghetti Port binding

**Status:** ⬜ TODO  
**Phase:** 180 — Multiple Core variants  
**Depends on:** [TASK-170-05](../170-discovery/TASK-170-05-route-config-assignments-through-discovery.md)  
**Estimated scope:** Small

---

## Goal

Complete **Define the Spaghetti Port binding** and produce this focused outcome:

Generated DT macros.

---

## Open

Create `dts/bindings/spaghetti/spaghettilab,port.yaml` and consult `dts/bindings/spaghetti/README.md`.

---

## Write / Modify

Define compatible `spaghettilab,port`, required `reg`, and only real bus/power/capability references justified by the schematic. Do not add a removable module type property.

---

## Why

One Core/Port works and its actual minimum requirements are known.

---

## Called / used by

Devicetree build and `port.c` macros.

---

## Trigger

BUILD.

---

## Invocation mechanism

BUILD TIME.

---

## Execution context

Host DT tools/compiler.

---

## Calls / dependencies

Zephyr binding schema and real board DTS.

---

## Inputs

Valid static Port nodes.

---

## Outputs

Generated DT macros.

---

## Errors to handle

Missing property/wrong reference must fail build.

---

## Do NOT implement yet

- Runtime module identity or imaginary capabilities

---

## Steps

- [ ] Open only Create `dts/bindings/spaghetti/spaghettilab,port.yaml` and consult `dts/bindings/spaghetti/README.md`.
- [ ] Define compatible `spaghettilab,port`, required `reg`, and only real bus/power/capability references justified by the schematic.
- [ ] Do not add a removable module type property.
- [ ] Handle only these realistic errors: Missing property/wrong reference must fail build.
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

Valid node builds; intentionally missing required field fails, then restore.

---

## Expected result

Useful build-time validation.

---

## Completion checklist

- [ ] Required documentation or implementation file changed as specified
- [ ] Named type, function, configuration, or test exists
- [ ] Build succeeds when this task requires a build
- [ ] Task-specific test passes
- [ ] No unrelated functionality was added

---

## Commit suggestion

`multiple: define the spaghetti port binding`

---

## Next task

[TASK-180-02](TASK-180-02-validate-the-port-binding.md) — Validate the Port binding
