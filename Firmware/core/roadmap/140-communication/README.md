# Phase 140 — Communication

[← Backlog index](../README.md) · [Long-form roadmap](../../IMPLEMENTATION_ROADMAP.md)

**Status:** ⬜ TODO

## Goal

Add a bounded protocol boundary and expose it through the existing USB shell.

## Depends on

[Phase 130 — Relay + Runtime V1](../130-relay-runtime-v1/README.md)

## Visible result

A local shell command reads status and submits configuration bytes.

## Tasks

1. ⬜ [TASK-140-01 — Define bounded Communication messages](TASK-140-01-define-bounded-communication-messages.md)
2. ⬜ [TASK-140-02 — Declare and implement request dispatch](TASK-140-02-declare-and-implement-request-dispatch.md)
3. ⬜ [TASK-140-03 — Enable the Zephyr shell](TASK-140-03-enable-the-zephyr-shell.md)
4. ⬜ [TASK-140-04 — Implement the shell transport adapter](TASK-140-04-implement-the-shell-transport-adapter.md)
5. ⬜ [TASK-140-05 — Initialize Communication from Core](TASK-140-05-initialize-communication-from-core.md)
6. ⬜ [TASK-140-06 — Test status and malformed shell input](TASK-140-06-test-status-and-malformed-shell-input.md)

## Phase completion gate

- [ ] Protocol types do not mention Shell/USB.
- [ ] Shell uses existing `usb_serial` console.
- [ ] GET_STATUS succeeds.
- [ ] Invalid/oversized command fails safely.
- [ ] No CBOR field is read by Manager.
