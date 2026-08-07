# TASK-180-07 — Build a second Core variant

**Status:** ⬜ TODO  
**Phase:** 180 — Multiple Core variants  
**Depends on:** [TASK-180-06](TASK-180-06-build-and-test-the-first-real-core-board.md)  
**Estimated scope:** Small

---

## Goal

Complete **Build a second Core variant** and produce this focused outcome:

Common higher layers compile and enumerate correctly.

---

## Open

A second real board directory, or a clearly named build-only test fixture when hardware does not exist.

---

## Write / Modify

Describe a verified or explicitly simulated different Port count/capability set. Build the unchanged Core, Manager, Runtime, Data, and module code; replace any board-name branch with capability queries.

---

## Why

Generated Port enumeration is complete.

---

## Called / used by

Build matrix/tests.

---

## Trigger

BUILD.

---

## Invocation mechanism

BUILD TIME.

---

## Execution context

Host CI/developer.

---

## Calls / dependencies

Second board DTS/Kconfig.

---

## Inputs

Different number/capabilities.

---

## Outputs

Common higher layers compile and enumerate correctly.

---

## Errors to handle

Unsupported module on capability-poor port -> `-ENOTSUP`.

---

## Do NOT implement yet

- Runtime board-name branching

---

## Steps

- [ ] Open only A second real board directory, or a clearly named build-only test fixture when hardware does not exist.
- [ ] Describe a verified or explicitly simulated different Port count/capability set. Build the unchanged Core, Manager, Runtime, Data, and module code
- [ ] replace any board-name branch with capability queries.
- [ ] Handle only these realistic errors: Unsupported module on capability-poor port -> `-ENOTSUP`.
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

Build both variants and compare generated Port counts/capabilities; search higher layers for C3/S3 board-name conditionals.

---

## Expected result

Both variants build with common higher layers and no MCU-name policy branches.

---

## Completion checklist

- [ ] Required documentation or implementation file changed as specified
- [ ] Named type, function, configuration, or test exists
- [ ] Build succeeds when this task requires a build
- [ ] Task-specific test passes
- [ ] No unrelated functionality was added

---

## Commit suggestion

`multiple: build a second core variant`

---

## Next task

[TASK-190-01](../190-power/TASK-190-01-verify-controllable-power-hardware.md) — Verify controllable power hardware
