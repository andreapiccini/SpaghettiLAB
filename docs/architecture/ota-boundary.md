# OTA Community/Production boundary

## Community responsibilities

- local UART, authenticated BLE and authenticated Wi-Fi transfer;
- candidate compatibility and resource preflight;
- MCUboot test boot, health confirmation and automatic rollback observation;
- single-device status, recovery and secret-safe local audit;
- protocol and SDK contracts required for interoperability.

These capabilities remain public because they are necessary to develop, inspect and
recover a device without a commercial service.

## Production responsibilities

- fleet targeting and staged/canary rollout policy;
- mandatory deployment approval and separation of duties;
- release-channel policy and maintenance windows;
- centralized immutable audit, retention and customer reporting;
- coordinated pause/abort thresholds and operational rollback decisions;
- signing operations and protection of production keys outside source control.

Production consumes the public OTA primitives. It does not replace them or cause a
Community build to fetch private code.

## Firmware extension contract

`spaghetti_update_policy_authorize()` is called immediately before image-1 is
prepared. The Community weak implementation accepts valid transports. A downstream
strong implementation may reject a session with `-EACCES`; it must be bounded,
non-blocking and must not retain caller state.

This hook controls admission only. MCUboot remains the authority for image signature
and integrity verification, and the Update coordinator remains the sole owner of the
secondary slot and trial confirmation.
