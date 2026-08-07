# TASK-140-02 — Declare and implement request dispatch

**Status:** ⬜ TODO  
**Phase:** 140 — Communication  
**Depends on:** [TASK-140-01](TASK-140-01-define-bounded-communication-messages.md)  
**Estimated scope:** Small

---

## Goal

Complete **Declare and implement request dispatch** and produce this focused outcome:

Versioned response/status.

---

## Open

`include/spaghetti/communication.h` and `subsys/communication/communication.c`.

---

## Write / Modify

Declare Communication init and handle-request APIs plus one bounded response return/callback contract. Implement dispatch for GET_STATUS and SET_CONFIG placeholders with strict command, pointer, and length validation.

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

- [ ] Open only `include/spaghetti/communication.h` and `subsys/communication/communication.c`.
- [ ] Declare Communication init and handle-request APIs plus one bounded response return/callback contract.
- [ ] Implement dispatch for GET_STATUS and SET_CONFIG placeholders with strict command, pointer, and length validation.
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

`communication: declare and implement request dispatch`

---

## Next task

[TASK-140-03](TASK-140-03-enable-the-zephyr-shell.md) — Enable the Zephyr shell
