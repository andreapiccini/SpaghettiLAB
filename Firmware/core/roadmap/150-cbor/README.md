# Phase 150 — CBOR

[← Backlog index](../README.md) · [Long-form roadmap](../../IMPLEMENTATION_ROADMAP.md)

**Status:** ⬜ TODO

## Goal

Decode one strict, versioned CBOR configuration and apply it through the real Config path.

## Depends on

[Phase 140 — Communication](../140-communication/README.md)

## Visible result

A tiny CBOR payload decodes into `spaghetti_config` and applies.

## Tasks

1. ⬜ [TASK-150-01 — Document the CBOR V0 schema](TASK-150-01-document-the-cbor-v0-schema.md)
2. ⬜ [TASK-150-02 — Declare the Config decoder boundary](TASK-150-02-declare-the-config-decoder-boundary.md)
3. ⬜ [TASK-150-03 — Enable zcbor and add the codec source](TASK-150-03-enable-zcbor-and-add-the-codec-source.md)
4. ⬜ [TASK-150-04 — Implement strict CBOR V0 decoding](TASK-150-04-implement-strict-cbor-v0-decoding.md)
5. ⬜ [TASK-150-05 — Apply CBOR through Communication](TASK-150-05-apply-cbor-through-communication.md)
6. ⬜ [TASK-150-06 — Test valid and invalid CBOR payloads](TASK-150-06-test-valid-and-invalid-cbor-payloads.md)

## Phase completion gate

- [ ] `CONFIG_ZCBOR=y` is active.
- [ ] Decoder fills only internal `spaghetti_config`.
- [ ] Truncation/wrong types/trailing bytes are rejected.
- [ ] Valid CBOR configures Port 0/SHT40.
- [ ] Manager and Runtime contain no zcbor calls.
