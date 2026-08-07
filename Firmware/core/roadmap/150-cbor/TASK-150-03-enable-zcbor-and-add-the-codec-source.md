# TASK-150-03 — Enable zcbor and add the codec source

**Status:** ⬜ TODO  
**Phase:** 150 — CBOR  
**Depends on:** [TASK-150-02](TASK-150-02-declare-the-config-decoder-boundary.md)  
**Estimated scope:** Small

---

## Goal

Complete **Enable zcbor and add the codec source** and produce this focused outcome:

Internal Config.

---

## Open

`prj.conf`, `CMakeLists.txt`, and create `subsys/config/config_cbor.c`.

---

## Write / Modify

Enable `CONFIG_ZCBOR=y` and add `config_cbor.c` to application sources. Confirm the installed Zephyr integration supplies required zcbor headers/sources; do not vendor a second copy.

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

## Zephyr note

zcbor decodes CBOR with bounded state. Generated CDDL code is preferred as the schema grows; a strict hand decoder is acceptable for this tiny V0 only.

---

## Steps

- [ ] Open only `prj.conf`, `CMakeLists.txt`, and create `subsys/config/config_cbor.c`.
- [ ] Enable `CONFIG_ZCBOR=y` and add `config_cbor.c` to application sources.
- [ ] Confirm the installed Zephyr integration supplies required zcbor headers/sources
- [ ] do not vendor a second copy.
- [ ] Handle only these realistic errors: All parse/bounds errors map to a stable Communication error; do not leave partially filled active state.
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

`cbor: enable zcbor and add the codec source`

---

## Next task

[TASK-150-04](TASK-150-04-implement-strict-cbor-v0-decoding.md) — Implement strict CBOR V0 decoding
