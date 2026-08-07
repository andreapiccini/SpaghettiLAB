# TASK-150-05 — Apply CBOR through Communication

**Status:** ⬜ TODO  
**Phase:** 150 — CBOR  
**Depends on:** [TASK-150-04](TASK-150-04-implement-strict-cbor-v0-decoding.md)  
**Estimated scope:** Small

---

## Goal

Complete **Apply CBOR through Communication** and produce this focused outcome:

Applied SHT40 and 1000 ms acquisition.

---

## Open

`subsys/communication/communication.c` and `subsys/communication/communication_shell.c`.

---

## Write / Modify

Make SET_CONFIG call the CBOR decoder and then `spaghetti_config_apply()`. Keep shell `apply` limited to bounded hex-to-byte conversion. Return distinct decode, semantic-validation, and apply errors.

---

## Why

Each downstream layer already works locally.

---

## Called / used by

PC/developer shell.

---

## Trigger

COMMUNICATION RX.

---

## Invocation mechanism

SHELL COMMAND -> DIRECT CALL chain.

---

## Execution context

Shell thread initially.

---

## Calls / dependencies

Communication -> codec -> Config -> Manager/Runtime.

---

## Inputs

Valid encoded Port 0/SHT40 V0 configuration.

---

## Outputs

Applied SHT40 and 1000 ms acquisition.

---

## Errors to handle

Hex, decode, validation, apply failures independently.

---

## Do NOT implement yet

- Transport-specific logic in decoder or Manager CBOR access

---

## Steps

- [ ] Open only `subsys/communication/communication.c` and `subsys/communication/communication_shell.c`.
- [ ] Make SET_CONFIG call the CBOR decoder and then `spaghetti_config_apply()`.
- [ ] Keep shell `apply` limited to bounded hex-to-byte conversion.
- [ ] Return distinct decode, semantic-validation, and apply errors.
- [ ] Handle only these realistic errors: Hex, decode, validation, apply failures independently.
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

Send valid V0 and malformed variants; query status afterward.

---

## Expected result

Valid CBOR configures SHT40; invalid bytes change no live state.

---

## Completion checklist

- [ ] Required documentation or implementation file changed as specified
- [ ] Named type, function, configuration, or test exists
- [ ] Build succeeds when this task requires a build
- [ ] Task-specific test passes
- [ ] No unrelated functionality was added

---

## Commit suggestion

`cbor: apply cbor through communication`

---

## Next task

[TASK-150-06](TASK-150-06-test-valid-and-invalid-cbor-payloads.md) — Test valid and invalid CBOR payloads
