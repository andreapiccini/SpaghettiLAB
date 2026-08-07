# TASK-100-03 — Verify and define the storage partition

**Status:** ⬜ TODO  
**Phase:** 100 — Persistent Config  
**Depends on:** [TASK-100-02](TASK-100-02-implement-and-test-a-ram-storage-backend.md)  
**Estimated scope:** Small

---

## Goal

Complete **Verify and define the storage partition** and produce this focused outcome:

Record restored after power cycle.

---

## Open

The verified board flash layout and the appropriate board overlay/Devicetree partition file.

---

## Write / Modify

Inspect current flash partitions, select a real non-overlapping region, and define one fixed `storage` partition using installed Zephyr binding syntax. Do not guess an address or size.

---

## Why

Config read/write semantics already work without flash.

---

## Called / used by

Core/Config.

---

## Trigger

BOOT/CONFIG COMMIT.

---

## Invocation mechanism

DIRECT CALL + SETTINGS CALLBACK.

---

## Execution context

Main/calling thread during synchronous load/save.

---

## Calls / dependencies

Zephyr Settings, chosen backend, real fixed partition.

---

## Inputs

Valid record and safe flash region.

---

## Outputs

Record restored after power cycle.

---

## Errors to handle

Missing/corrupt/full/I/O; never erase unrelated flash.

---

## Do NOT implement yet

- Invent a partition size/address
- derive from real flash

---

## Zephyr note

Flash partitions are compile-time hardware layout. A wrong offset can overwrite firmware, so generated DTS and partition boundaries must be inspected before use.

---

## Steps

- [ ] Open only The verified board flash layout and the appropriate board overlay/Devicetree partition file.
- [ ] Inspect current flash partitions, select a real non-overlapping region, and define one fixed `storage` partition using installed Zephyr binding syntax.
- [ ] Do not guess an address or size.
- [ ] Handle only these realistic errors: Missing/corrupt/full/I/O; never erase unrelated flash.
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

Save assignment, power-cycle, load/apply; corrupt/version-mismatch test
through a controlled test record, not random flash writes.

---

## Expected result

Config persists or falls back explicitly.

---

## Completion checklist

- [ ] Required documentation or implementation file changed as specified
- [ ] Named type, function, configuration, or test exists
- [ ] Build succeeds when this task requires a build
- [ ] Task-specific test passes
- [ ] No unrelated functionality was added

---

## Commit suggestion

`persistent: verify and define the storage partition`

---

## Next task

[TASK-100-04](TASK-100-04-enable-zephyr-settings-and-its-backend.md) — Enable Zephyr Settings and its backend
