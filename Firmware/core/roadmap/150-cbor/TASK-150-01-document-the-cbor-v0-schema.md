# TASK-150-01 — Document the CBOR V0 schema

**Status:** ⬜ TODO  
**Phase:** 150 — CBOR  
**Depends on:** [TASK-140-06](../140-communication/TASK-140-06-test-status-and-malformed-shell-input.md)  
**Estimated scope:** Small

---

## Goal

Complete **Document the CBOR V0 schema** and produce this focused outcome:

Fully owned `spaghetti_config` or negative decode error.

---

## Open

Create `subsys/config/spaghetti_config_v0.cddl` or document the equivalent exact schema beside the codec.

---

## Write / Modify

Describe one versioned bounded object containing Port 0, type `sht40`, verified address, and 1000 ms period. Fix exact keys or array order and reject unspecified extra data.

---

## Why

The internal Config path is already proven end-to-end.

---

## Called / used by

Communication SET_CONFIG handler.

---

## Trigger

COMMUNICATION RX.

---

## Invocation mechanism

DIRECT CALL decoder.

---

## Execution context

Shell/Communication thread.

---

## Calls / dependencies

zcbor decoder and Config validator.

---

## Inputs

Byte span with no assumed termination.

---

## Outputs

Fully owned `spaghetti_config` or negative decode error.

---

## Errors to handle

Truncated, wrong type/key/version, oversized string/count,
trailing unexpected bytes, semantic Config rejection.

---

## Do NOT implement yet

- Full runtime graph/MQTT/discovery schema or direct Manager decode

---

## Steps

- [ ] Open only Create `subsys/config/spaghetti_config_v0.cddl` or document the equivalent exact schema beside the codec.
- [ ] Describe one versioned bounded object containing Port 0, type `sht40`, verified address, and 1000 ms period. Fix exact keys or array order and reject unspecified extra data.
- [ ] Handle only these realistic errors: Truncated, wrong type/key/version, oversized string/count, trailing unexpected bytes, semantic Config rejection.
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

Review that output contains no pointer into the input buffer unless its
lifetime is explicitly copied before return.

---

## Expected result

Clean codec boundary.

---

## Completion checklist

- [ ] Required documentation or implementation file changed as specified
- [ ] Named type, function, configuration, or test exists
- [ ] Build succeeds when this task requires a build
- [ ] Task-specific test passes
- [ ] No unrelated functionality was added

---

## Commit suggestion

`cbor: document the cbor v0 schema`

---

## Next task

[TASK-150-02](TASK-150-02-declare-the-config-decoder-boundary.md) — Declare the Config decoder boundary
