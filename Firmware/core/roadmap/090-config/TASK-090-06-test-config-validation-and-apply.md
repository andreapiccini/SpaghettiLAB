# TASK-090-06 — Test Config validation and apply

**Status:** ⬜ TODO  
**Phase:** 090 — Internal Config  
**Depends on:** [TASK-090-05](TASK-090-05-add-and-apply-one-hardcoded-c-config.md)  
**Estimated scope:** Small

---

## Goal

Complete **Test Config validation and apply** and produce this focused outcome:

SHT40 instance and real readings.

---

## Open

`subsys/config/config.c`, the current test harness, and the serial console.

---

## Write / Modify

Test the valid snapshot plus bad version, excessive count, duplicate Port, unknown type, invalid address, and zero period. Confirm invalid snapshots make no partial live assignment and the valid one preserves real SHT40 reads.

---

## Why

It isolates semantic config failures from future decoder failures.

---

## Called / used by

Main/Core test.

---

## Trigger

BOOT TEST.

---

## Invocation mechanism

DIRECT CALL.

---

## Execution context

Main thread.

---

## Calls / dependencies

Config validate/apply -> Manager.

---

## Inputs

Hardcoded internal object.

---

## Outputs

SHT40 instance and real readings.

---

## Errors to handle

Log config validation/apply error distinctly.

---

## Do NOT implement yet

- Encode/decode or storage

---

## Steps

- [ ] Open only `subsys/config/config.c`, the current test harness, and the serial console.
- [ ] Test the valid snapshot plus bad version, excessive count, duplicate Port, unknown type, invalid address, and zero period.
- [ ] Confirm invalid snapshots make no partial live assignment and the valid one preserves real SHT40 reads.
- [ ] Handle only these realistic errors: Log config validation/apply error distinctly.
- [ ] Confirm no item from **Do NOT implement yet** was added
- [ ] Run the task test and compare it with **Expected result**

---

## Build

YES — `make build`

---

## Flash

YES — run `make flash`, then `make screen`; pass `PORT=...` only when needed.

---

## Test

Change test period invalid to 0 and verify no Manager call; restore 1000.

---

## Expected result

Only a fully valid internal configuration changes Manager state.

---

## Completion checklist

- [ ] Required documentation or implementation file changed as specified
- [ ] Named type, function, configuration, or test exists
- [ ] Build succeeds when this task requires a build
- [ ] Task-specific test passes
- [ ] No unrelated functionality was added

---

## Commit suggestion

`internal: test config validation and apply`

---

## Next task

[TASK-100-01](../100-storage/TASK-100-01-define-the-synchronous-storage-api.md) — Define the synchronous Storage API
