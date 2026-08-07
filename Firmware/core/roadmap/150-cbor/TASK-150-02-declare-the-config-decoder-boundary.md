# TASK-150-02 — Declare the Config decoder boundary

**Status:** ⬜ TODO  
**Phase:** 150 — CBOR  
**Depends on:** [TASK-150-01](TASK-150-01-document-the-cbor-v0-schema.md)  
**Estimated scope:** Small

---

## Goal

Complete **Declare the Config decoder boundary** and produce this focused outcome:

Fully owned `spaghetti_config` or negative decode error.

---

## Open

Create `include/spaghetti/config_codec.h`.

---

## Write / Modify

Declare `spaghetti_config_decode_cbor(const uint8_t *bytes, size_t length, struct spaghetti_config *out)`. Document that output changes only after complete syntactic and semantic success.

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

- [ ] Open only Create `include/spaghetti/config_codec.h`.
- [ ] Declare `spaghetti_config_decode_cbor(const uint8_t *bytes, size_t length, struct spaghetti_config *out)`.
- [ ] Document that output changes only after complete syntactic and semantic success.
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

`cbor: declare the config decoder boundary`

---

## Next task

[TASK-150-03](TASK-150-03-enable-zcbor-and-add-the-codec-source.md) — Enable zcbor and add the codec source
