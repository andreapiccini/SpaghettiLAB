# TASK-140-03 — Enable the Zephyr shell

**Status:** ⬜ TODO  
**Phase:** 140 — Communication  
**Depends on:** [TASK-140-02](TASK-140-02-declare-and-implement-request-dispatch.md)  
**Estimated scope:** Small

---

## Goal

Complete **Enable the Zephyr shell** and produce this focused outcome:

Core/modules/runtime status response.

---

## Open

`prj.conf` and the existing console overlay.

---

## Write / Modify

Enable `CONFIG_SHELL=y` and verify the existing chosen shell UART remains `usb_serial`. Add only required shell dependencies reported by installed Kconfig; do not change the working console device.

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

## Zephyr note

The Zephyr shell provides command parsing and runs handlers in shell thread context. Handlers may make bounded direct calls but must not retain transient argument pointers.

---

## Steps

- [ ] Open only `prj.conf` and the existing console overlay.
- [ ] Enable `CONFIG_SHELL=y` and verify the existing chosen shell UART remains `usb_serial`.
- [ ] Add only required shell dependencies reported by installed Kconfig
- [ ] do not change the working console device.
- [ ] Handle only these realistic errors: Bad arguments, oversized hex, unavailable Config.
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

`communication: enable the zephyr shell`

---

## Next task

[TASK-140-04](TASK-140-04-implement-the-shell-transport-adapter.md) — Implement the shell transport adapter
