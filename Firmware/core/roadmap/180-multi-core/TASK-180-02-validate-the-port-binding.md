# TASK-180-02 — Validate the Port binding

**Status:** ⬜ TODO  
**Phase:** 180 — Multiple Core variants  
**Depends on:** [TASK-180-01](TASK-180-01-define-the-spaghetti-port-binding.md)  
**Estimated scope:** Small

---

## Goal

Complete **Validate the Port binding** and produce this focused outcome:

Generated DT macros.

---

## Open

`dts/bindings/spaghetti/spaghettilab,port.yaml` and a minimal test node in the appropriate board/test DTS.

---

## Write / Modify

Run a pristine configure with one valid node, then verify missing required properties and invalid references fail Devicetree validation. Remove any deliberately invalid test node after the check.

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

## Zephyr note

Bindings are YAML schemas used at build time to validate DTS nodes and generate C macros. They must describe static Core hardware, not runtime module identity.

---

## Steps

- [ ] Open only `dts/bindings/spaghetti/spaghettilab,port.yaml` and a minimal test node in the appropriate board/test DTS.
- [ ] Run a pristine configure with one valid node, then verify missing required properties and invalid references fail Devicetree validation.
- [ ] Remove any deliberately invalid test node after the check.
- [ ] Handle only these realistic errors: Missing property/wrong reference must fail build.
- [ ] Confirm no item from **Do NOT implement yet** was added
- [ ] Run the task test and compare it with **Expected result**

---

## Build

YES — `make pristine`

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

`multiple: validate the port binding`

---

## Next task

[TASK-180-03](TASK-180-03-create-the-first-real-spaghetti-board-skeleton.md) — Create the first real Spaghetti board skeleton
