# TASK-150-06 — Test valid and invalid CBOR payloads

**Status:** ⬜ TODO  
**Phase:** 150 — CBOR  
**Depends on:** [TASK-150-05](TASK-150-05-apply-cbor-through-communication.md)  
**Estimated scope:** Small

---

## Goal

Complete **Test valid and invalid CBOR payloads** and produce this focused outcome:

Applied SHT40 and 1000 ms acquisition.

---

## Open

The codec test harness, USB shell, and serial console.

---

## Write / Modify

Test one valid V0 payload plus truncated input, wrong type, oversized string, unknown version, trailing bytes, invalid address, and Manager apply failure. Confirm failed payloads do not alter the active snapshot.

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

- [ ] Open only The codec test harness, USB shell, and serial console.
- [ ] Test one valid V0 payload plus truncated input, wrong type, oversized string, unknown version, trailing bytes, invalid address, and Manager apply failure.
- [ ] Confirm failed payloads do not alter the active snapshot.
- [ ] Handle only these realistic errors: Hex, decode, validation, apply failures independently.
- [ ] Confirm no item from **Do NOT implement yet** was added
- [ ] Run the task test and compare it with **Expected result**

---

## Build

YES — `make build`

---

## Flash

YES — use the host-specific workflow in the root `README.md`.

---

## Test

Send valid V0 and malformed variants; query status afterward.

---

## Expected result

A valid CBOR configuration applies through Communication; every malformed or invalid payload is atomic and rejected.

---

## Completion checklist

- [ ] Required documentation or implementation file changed as specified
- [ ] Named type, function, configuration, or test exists
- [ ] Build succeeds when this task requires a build
- [ ] Task-specific test passes
- [ ] No unrelated functionality was added

---

## Commit suggestion

`cbor: test valid and invalid cbor payloads`

---

## Next task

[TASK-160-01](../160-mqtt/TASK-160-01-choose-the-development-network-path.md) — Choose the development network path
