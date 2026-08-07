# TASK-100-04 — Enable Zephyr Settings and its backend

**Status:** ⬜ TODO  
**Phase:** 100 — Persistent Config  
**Depends on:** [TASK-100-03](TASK-100-03-verify-and-define-the-storage-partition.md)  
**Estimated scope:** Small

---

## Goal

Complete **Enable Zephyr Settings and its backend** and produce this focused outcome:

Record restored after power cycle.

---

## Open

`prj.conf`.

---

## Write / Modify

Enable `CONFIG_SETTINGS=y` and the one verified installed non-filesystem backend, such as `CONFIG_SETTINGS_NVS=y`, only after the storage partition exists. Add only backend dependencies required by Kconfig warnings/help.

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

Settings is the key/value facade; NVS is one possible flash backend. Selection happens at build time through Kconfig.

---

## Steps

- [ ] Open only `prj.conf`.
- [ ] Enable `CONFIG_SETTINGS=y` and the one verified installed non-filesystem backend, such as `CONFIG_SETTINGS_NVS=y`, only after the storage partition exists.
- [ ] Add only backend dependencies required by Kconfig warnings/help.
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

`persistent: enable zephyr settings and its backend`

---

## Next task

[TASK-100-05](TASK-100-05-implement-the-settings-backed-storage-record.md) — Implement the Settings-backed Storage record
