# Firmware Update coordinator

[← Services](../README.md) · [Public API](../../../include/spaghetti/update.h) ·
[Architecture](../../../ARCHITECTURE.md)

Update owns the single global firmware-update session. UART and authenticated UDP are
adapters: they may move bytes only after obtaining ownership through `begin()`. They do
not choose the destination slot, make an image permanent, or keep independent update
state.

## State and ownership

`spaghetti_update_init()` creates one application-lifetime static context. A mutex
protects its state, selected transport and absolute deadline. A delayable work item on
an Update-owned static workqueue expires `ARMED` or `RECEIVING` sessions. Erasing the
large secondary slot therefore cannot block Zephyr's shared system workqueue. There is
no heap and the public status is always copied into caller-owned storage.

```text
IDLE -> ARMED -> RECEIVING -> VERIFYING -> PENDING_REBOOT
          |          |
          +-- timeout/cancel --> erase image-1 --> IDLE
```

`TRIAL_BOOT` means the currently running MCUboot image is not confirmed. The
coordinator refuses a second update in that state. Core owns the bounded health window
and is the only caller of `spaghetti_update_confirm_trial()`. `ERROR` retains the last
backend errno; `cancel()` retries cleanup and
returns to `IDLE` only after the secondary slot was erased successfully.

## Zephyr and MCUboot boundary

The production backend uses `flash_img_get_upload_slot()` so the secondary area comes
from Zephyr's generated flash map. `begin()` flattens only that area. `finish()` reads
its public MCUboot header with `boot_read_bank_header()` and calls exactly:

```c
boot_request_upgrade(BOOT_UPGRADE_TEST);
```

Zephyr 4.4 exposes no application-level public API that performs MCUboot's complete
ECDSA validation. The bootloader therefore performs the definitive signature and
integrity checks on the next reset. An invalid candidate never executes; MCUboot keeps
the previous image bootable. `finish()` must never call `BOOT_UPGRADE_PERMANENT`.

The local UART and authenticated DTLS-PSK adapters write contiguous chunks with
`spaghetti_update_write()`. The production backend streams them into the upload slot
with Zephyr `flash_img`; `last=true` flushes its bounded staging buffer. Before
accepting `total`, an adapter calls `spaghetti_update_get_capacity()`; the backend
derives the exact usable boundary from image-1 and its MCUboot trailer. Both adapters
must finish their bounded transfer before calling
`spaghetti_update_finish()`, reset their parser on cancel, and never log firmware
bytes, credentials or URLs.

## Errors and concurrency

- `-EALREADY`: a window already exists, or there is nothing to cancel.
- `-EBUSY`: another adapter owns the session or a candidate awaits reboot.
- `-EPERM`: the requested transition is not legal, including updates during trial.
- `-ETIMEDOUT`: the absolute session deadline expired.
- `-EBADMSG`: image-1 does not contain a readable MCUboot candidate header.
- flash/boot errno: preparation, cleanup or test-marker update failed.

All public calls are thread-context operations. Flash erase and finalization may block;
no API is callable from ISR context.

Status also reports the active MCUboot slot and whether the running image is confirmed.
The backend obtains the active flash-area ID with `boot_fetch_active_slot()` and maps
the Devicetree `slot0_partition` and `slot1_partition` nodes to public slot numbers zero
and one. After a healthy trial, confirmation calls `boot_write_img_confirmed()`; this
operation is never exposed to a transport or Shell command.
