# TASK-140-05 — Initialize Communication from Core

**Status:** ⬜ TODO  
**Phase:** 140 — Communication  
**Depends on:** [TASK-140-04](TASK-140-04-implement-the-shell-transport-adapter.md)  
**Estimated scope:** Small

---

## Goal

Complete **Initialize Communication from Core** and produce this focused outcome:

Core/modules/runtime status response.

---

## Open

`CMakeLists.txt`, `subsys/core/core.c`, and `subsys/communication/communication.c`.

---

## Write / Modify

Add Communication and shell adapter sources to CMake. Initialize Communication from Core after its required state/config dependencies and propagate initialization errors.

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

- [ ] Open only `CMakeLists.txt`, `subsys/core/core.c`, and `subsys/communication/communication.c`.
- [ ] Add Communication and shell adapter sources to CMake. Initialize Communication from Core after its required state/config dependencies and propagate initialization errors.
- [ ] Handle only these realistic errors: Bad arguments, oversized hex, unavailable Config.
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

`communication: initialize communication from core`

---

## Next task

[TASK-140-06](TASK-140-06-test-status-and-malformed-shell-input.md) — Test status and malformed shell input
