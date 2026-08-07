# TASK-140-01 — Define bounded Communication messages

**Status:** ⬜ TODO  
**Phase:** 140 — Communication  
**Depends on:** [TASK-130-07](../130-relay-runtime-v1/TASK-130-07-test-the-relay-threshold-and-safe-state.md)  
**Estimated scope:** Small

---

## Goal

Complete **Define bounded Communication messages** and produce this focused outcome:

Versioned response/status.

---

## Open

`include/spaghetti/communication.h`.

---

## Write / Modify

Define bounded request and response types for only `GET_STATUS` and `SET_CONFIG`. Represent SET_CONFIG payload as a byte buffer plus length, not parsed fields, and define explicit maximum sizes.

---

## Why

Local Config works and can be invoked by external ingress.

---

## Called / used by

Shell transport adapter now; future other transports.

---

## Trigger

COMMUNICATION RX.

---

## Invocation mechanism

DIRECT CALL after transport reception.

---

## Execution context

Communication worker/caller thread.

---

## Calls / dependencies

Core/Config/decoder contract.

---

## Inputs

Bounded command and payload.

---

## Outputs

Versioned response/status.

---

## Errors to handle

Unknown command, oversized payload, invalid state.

---

## Do NOT implement yet

- CBOR fields in Manager, BLE/Wi-Fi transports, OTA

---

## Steps

- [ ] Open only `include/spaghetti/communication.h`.
- [ ] Define bounded request and response types for only `GET_STATUS` and `SET_CONFIG`. Represent SET_CONFIG payload as a byte buffer plus length, not parsed fields, and define explicit maximum sizes.
- [ ] Handle only these realistic errors: Unknown command, oversized payload, invalid state.
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

Pure request dispatch with GET_STATUS.

---

## Expected result

Transport-free protocol API.

---

## Completion checklist

- [ ] Required documentation or implementation file changed as specified
- [ ] Named type, function, configuration, or test exists
- [ ] Build succeeds when this task requires a build
- [ ] Task-specific test passes
- [ ] No unrelated functionality was added

---

## Commit suggestion

`communication: define bounded communication messages`

---

## Next task

[TASK-140-02](TASK-140-02-declare-and-implement-request-dispatch.md) — Declare and implement request dispatch
