# TASK-140-06 — Test status and malformed shell input

**Status:** ⬜ TODO  
**Phase:** 140 — Communication  
**Depends on:** [TASK-140-05](TASK-140-05-initialize-communication-from-core.md)  
**Estimated scope:** Small

---

## Goal

Complete **Test status and malformed shell input** and produce this focused outcome:

Core/modules/runtime status response.

---

## Open

The USB serial shell and serial console.

---

## Write / Modify

Run `spaghetti status`, an unknown subcommand, missing arguments, odd-length hex, invalid hex, and an oversized payload. Confirm valid status returns bounded data and every invalid command returns without changing Config.

---

## Why

No USB CDC/BLE/network transport must be invented.

---

## Called / used by

Developer/PC via USB serial.

---

## Trigger

SHELL COMMAND / COMMUNICATION RX.

---

## Invocation mechanism

SHELL COMMAND -> DIRECT CALL.

---

## Execution context

Zephyr shell thread; safe for bounded parsing, but do not
perform long blocking work while holding shell internals.

---

## Calls / dependencies

Zephyr Shell, Communication handler, Config/Status.

---

## Inputs

`spaghetti status` first.

---

## Outputs

Core/modules/runtime status response.

---

## Errors to handle

Bad arguments, oversized hex, unavailable Config.

---

## Do NOT implement yet

- CBOR until Step 15, binary framing, authentication

---

## Steps

- [ ] Open only The USB serial shell and serial console.
- [ ] Run `spaghetti status`, an unknown subcommand, missing arguments, odd-length hex, invalid hex, and an oversized payload.
- [ ] Confirm valid status returns bounded data and every invalid command returns without changing Config.
- [ ] Handle only these realistic errors: Bad arguments, oversized hex, unavailable Config.
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

From existing serial console run help, valid status, invalid command.

---

## Expected result

The USB shell reaches Communication and rejects malformed input without side effects.

---

## Completion checklist

- [ ] Required documentation or implementation file changed as specified
- [ ] Named type, function, configuration, or test exists
- [ ] Build succeeds when this task requires a build
- [ ] Task-specific test passes
- [ ] No unrelated functionality was added

---

## Commit suggestion

`communication: test status and malformed shell input`

---

## Next task

[TASK-150-01](../150-cbor/TASK-150-01-document-the-cbor-v0-schema.md) — Document the CBOR V0 schema
