# TASK-140-04 — Implement the shell transport adapter

**Status:** ⬜ TODO  
**Phase:** 140 — Communication  
**Depends on:** [TASK-140-03](TASK-140-03-enable-the-zephyr-shell.md)  
**Estimated scope:** Medium

---

## Goal

Complete **Implement the shell transport adapter** and produce this focused outcome:

Core/modules/runtime status response.

---

## Open

Create `subsys/communication/communication_shell.c`.

---

## Write / Modify

Register `spaghetti status` and bounded `spaghetti apply <hex>` commands. Validate argument count, even hex length, character validity, and decoded maximum before constructing a Communication request and directly calling the handler.

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

- [ ] Open only Create `subsys/communication/communication_shell.c`.
- [ ] Register `spaghetti status` and bounded `spaghetti apply <hex>` commands.
- [ ] Validate argument count, even hex length, character validity, and decoded maximum before constructing a Communication request and directly calling the handler.
- [ ] Handle only these realistic errors: Bad arguments, oversized hex, unavailable Config.
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

From existing serial console run help, valid status, invalid command.

---

## Expected result

Shell command reaches transport-independent handler.

---

## Completion checklist

- [ ] Required documentation or implementation file changed as specified
- [ ] Named type, function, configuration, or test exists
- [ ] Build succeeds when this task requires a build
- [ ] Task-specific test passes
- [ ] No unrelated functionality was added

---

## Commit suggestion

`communication: implement the shell transport adapter`

---

## Next task

[TASK-140-05](TASK-140-05-initialize-communication-from-core.md) — Initialize Communication from Core
