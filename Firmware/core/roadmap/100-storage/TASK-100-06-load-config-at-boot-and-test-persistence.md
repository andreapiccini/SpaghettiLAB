# TASK-100-06 — Load Config at boot and test persistence

**Status:** ⬜ TODO  
**Phase:** 100 — Persistent Config  
**Depends on:** [TASK-100-05](TASK-100-05-implement-the-settings-backed-storage-record.md)  
**Estimated scope:** Small

---

## Goal

Complete **Load Config at boot and test persistence** and produce this focused outcome:

Record restored after power cycle.

---

## Open

`subsys/core/core.c`, `subsys/config/config.c`, and the serial console.

---

## Write / Modify

Initialize Storage before Config, load the saved snapshot, validate it, and apply it. Provide a defined first-boot/default path. Write one changed valid snapshot, reboot, and confirm the same assignment returns; corrupt/version-mismatch data must fall back safely.

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

- [ ] Open only `subsys/core/core.c`, `subsys/config/config.c`, and the serial console.
- [ ] Initialize Storage before Config, load the saved snapshot, validate it, and apply it. Provide a defined first-boot/default path. Write one changed valid snapshot, reboot, and confirm the same assignment returns
- [ ] corrupt/version-mismatch data must fall back safely.
- [ ] Handle only these realistic errors: Missing/corrupt/full/I/O; never erase unrelated flash.
- [ ] Confirm no item from **Do NOT implement yet** was added
- [ ] Run the task test and compare it with **Expected result**

---

## Build

YES — `make pristine`

---

## Flash

YES — use the host-specific workflow in the root `README.md`.

---

## Test

Save assignment, power-cycle, load/apply; corrupt/version-mismatch test
through a controlled test record, not random flash writes.

---

## Expected result

A valid config survives reboot and invalid persisted data does not create a partial module assignment.

---

## Completion checklist

- [ ] Required documentation or implementation file changed as specified
- [ ] Named type, function, configuration, or test exists
- [ ] Build succeeds when this task requires a build
- [ ] Task-specific test passes
- [ ] No unrelated functionality was added

---

## Commit suggestion

`persistent: load config at boot and test persistence`

---

## Next task

[TASK-110-01](../110-data-zbus/TASK-110-01-define-the-temperature-sample-message.md) — Define the temperature sample message
