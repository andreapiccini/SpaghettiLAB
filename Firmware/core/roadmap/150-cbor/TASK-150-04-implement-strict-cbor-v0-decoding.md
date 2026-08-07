# TASK-150-04 — Implement strict CBOR V0 decoding

**Status:** ⬜ TODO  
**Phase:** 150 — CBOR  
**Depends on:** [TASK-150-03](TASK-150-03-enable-zcbor-and-add-the-codec-source.md)  
**Estimated scope:** Medium

---

## Goal

Complete **Implement strict CBOR V0 decoding** and produce this focused outcome:

Internal Config.

---

## Open

`subsys/config/config_cbor.c` and the V0 schema.

---

## Write / Modify

Decode into a temporary `spaghetti_config`, enforce every type, range, string bound, item count, version, and full input consumption, then call Config validation and copy to `out` only on complete success.

---

## Why

zcbor module is confirmed installed at
`/opt/zephyrproject/modules/lib/zcbor` with `CONFIG_ZCBOR` integration.

---

## Called / used by

Communication.

---

## Trigger

SET_CONFIG bytes.

---

## Invocation mechanism

DIRECT CALL.

---

## Execution context

Communication/shell thread.

---

## Calls / dependencies

zcbor decode functions then `spaghetti_config_validate`.

---

## Inputs

Exact V0 CBOR bytes.

---

## Outputs

Internal Config.

---

## Errors to handle

All parse/bounds errors map to a stable Communication error;
do not leave partially filled active state.

---

## Do NOT implement yet

- Canonical encoding requirement unless protocol demands it

---

## Steps

- [ ] Open only `subsys/config/config_cbor.c` and the V0 schema.
- [ ] Decode into a temporary `spaghetti_config`, enforce every type, range, string bound, item count, version, and full input consumption, then call Config validation and copy to `out` only on complete success.
- [ ] Handle only these realistic errors: All parse/bounds errors map to a stable Communication error; do not leave partially filled active state.
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

Valid vector plus empty, truncated at every byte, wrong type, excess count,
unknown version, trailing garbage.

---

## Expected result

Only valid vector produces Config.

---

## Completion checklist

- [ ] Required documentation or implementation file changed as specified
- [ ] Named type, function, configuration, or test exists
- [ ] Build succeeds when this task requires a build
- [ ] Task-specific test passes
- [ ] No unrelated functionality was added

---

## Commit suggestion

`cbor: implement strict cbor v0 decoding`

---

## Next task

[TASK-150-05](TASK-150-05-apply-cbor-through-communication.md) — Apply CBOR through Communication
