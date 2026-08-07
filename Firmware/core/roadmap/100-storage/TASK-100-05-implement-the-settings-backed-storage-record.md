# TASK-100-05 — Implement the Settings-backed Storage record

**Status:** ⬜ TODO  
**Phase:** 100 — Persistent Config  
**Depends on:** [TASK-100-04](TASK-100-04-enable-zephyr-settings-and-its-backend.md)  
**Estimated scope:** Medium

---

## Goal

Complete **Implement the Settings-backed Storage record** and produce this focused outcome:

Record restored after power cycle.

---

## Open

`subsys/services/storage/storage.c` and `CMakeLists.txt`.

---

## Write / Modify

Register one Settings handler, decode the fixed versioned config record in a SETTINGS CALLBACK, load it into private Storage state, and save with the Settings API. Add Storage source to CMake and propagate backend errors.

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

## Steps

- [ ] Open only `subsys/services/storage/storage.c` and `CMakeLists.txt`.
- [ ] Register one Settings handler, decode the fixed versioned config record in a SETTINGS CALLBACK, load it into private Storage state, and save with the Settings API.
- [ ] Add Storage source to CMake and propagate backend errors.
- [ ] Handle only these realistic errors: Missing/corrupt/full/I/O; never erase unrelated flash.
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

`persistent: implement the settings-backed storage record`

---

## Next task

[TASK-100-06](TASK-100-06-load-config-at-boot-and-test-persistence.md) — Load Config at boot and test persistence
