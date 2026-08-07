# TASK-100-01 — Define the synchronous Storage API

**Status:** ⬜ TODO  
**Phase:** 100 — Persistent Config  
**Depends on:** [TASK-090-06](../090-config/TASK-090-06-test-config-validation-and-apply.md)  
**Estimated scope:** Small

---

## Goal

Complete **Define the synchronous Storage API** and produce this focused outcome:

Found/not-found/corrupt/status.

---

## Open

Create `subsys/services/storage/storage.h`.

---

## Write / Modify

Declare `spaghetti_storage_init()`, `spaghetti_storage_read_config()`, and `spaghetti_storage_write_config()` around one versioned fixed record. Define explicit buffer/snapshot ownership and realistic return codes.

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

- [ ] Open only Create `subsys/services/storage/storage.h`.
- [ ] Declare `spaghetti_storage_init()`, `spaghetti_storage_read_config()`, and `spaghetti_storage_write_config()` around one versioned fixed record.
- [ ] Define explicit buffer/snapshot ownership and realistic return codes.
- [ ] Handle only these realistic errors: Missing record is normal; wrong size/version/corruption.
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

Write/read equality and wrong-version rejection.

---

## Expected result

Config can depend on Storage contract, not flash API.

---

## Completion checklist

- [ ] Required documentation or implementation file changed as specified
- [ ] Named type, function, configuration, or test exists
- [ ] Build succeeds when this task requires a build
- [ ] Task-specific test passes
- [ ] No unrelated functionality was added

---

## Commit suggestion

`persistent: define the synchronous storage api`

---

## Next task

[TASK-100-02](TASK-100-02-implement-and-test-a-ram-storage-backend.md) — Implement and test a RAM Storage backend
