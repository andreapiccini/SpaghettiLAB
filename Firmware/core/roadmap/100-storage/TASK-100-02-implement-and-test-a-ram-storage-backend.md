# TASK-100-02 — Implement and test a RAM Storage backend

**Status:** ⬜ TODO  
**Phase:** 100 — Persistent Config  
**Depends on:** [TASK-100-01](TASK-100-01-define-the-synchronous-storage-api.md)  
**Estimated scope:** Small

---

## Goal

Complete **Implement and test a RAM Storage backend** and produce this focused outcome:

Found/not-found/corrupt/status.

---

## Open

Create `subsys/services/storage/storage.c` and a focused test call site.

---

## Write / Modify

Implement a fixed in-memory record with empty/not-found behavior, bounded copy-in/copy-out, version preservation, and overwrite semantics. Do not add flash code in this ticket.

---

## Why

Internal model is proven and small enough to version.

---

## Called / used by

Core/Config only.

---

## Trigger

BOOT/VALID CONFIG UPDATE.

---

## Invocation mechanism

DIRECT CALL.

---

## Execution context

Main/calling thread; never ISR.

---

## Calls / dependencies

Initially memory; later Zephyr Settings.

---

## Inputs

Config record/destination.

---

## Outputs

Found/not-found/corrupt/status.

---

## Errors to handle

Missing record is normal; wrong size/version/corruption.

---

## Do NOT implement yet

- Measurement history or arbitrary blobs

---

## Steps

- [ ] Open only Create `subsys/services/storage/storage.c` and a focused test call site.
- [ ] Implement a fixed in-memory record with empty/not-found behavior, bounded copy-in/copy-out, version preservation, and overwrite semantics.
- [ ] Do not add flash code in this ticket.
- [ ] Handle only these realistic errors: Missing record is normal; wrong size/version/corruption.
- [ ] Confirm no item from **Do NOT implement yet** was added
- [ ] Run the task test and compare it with **Expected result**

---

## Build

YES — `make build`

---

## Flash

NO

---

## Test

Write/read equality and wrong-version rejection.

---

## Expected result

Storage API behavior is proven before adding flash layout risk.

---

## Completion checklist

- [ ] Required documentation or implementation file changed as specified
- [ ] Named type, function, configuration, or test exists
- [ ] Build succeeds when this task requires a build
- [ ] Task-specific test passes
- [ ] No unrelated functionality was added

---

## Commit suggestion

`persistent: implement and test a ram storage backend`

---

## Next task

[TASK-100-03](TASK-100-03-verify-and-define-the-storage-partition.md) — Verify and define the storage partition
