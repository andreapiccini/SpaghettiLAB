# Phase 170 — Discovery

[← Backlog index](../README.md) · [Long-form roadmap](../../IMPLEMENTATION_ROADMAP.md)

**Status:** ⬜ TODO

## Goal

Normalize manual discovery results before they reach the unchanged Module Manager.

## Depends on

[Phase 160 — MQTT](../160-mqtt/README.md)

## Visible result

Manual discovery feeds the Manager without provider knowledge leaking into it.

## Tasks

1. ⬜ [TASK-170-01 — Define Discovery result types](TASK-170-01-define-discovery-result-types.md)
2. ⬜ [TASK-170-02 — Define the Discovery provider API](TASK-170-02-define-the-discovery-provider-api.md)
3. ⬜ [TASK-170-03 — Implement manual Discovery validation](TASK-170-03-implement-manual-discovery-validation.md)
4. ⬜ [TASK-170-04 — Route accepted results to Module Manager](TASK-170-04-route-accepted-results-to-module-manager.md)
5. ⬜ [TASK-170-05 — Route Config assignments through Discovery](TASK-170-05-route-config-assignments-through-discovery.md)

## Phase completion gate

- [ ] Manual assignment produces normalized Discovery result.
- [ ] Manager API/implementation is provider-independent and unchanged.
- [ ] Generation/stale result is tested.
- [ ] No EEPROM/probe code exists.
- [ ] Existing CBOR/manual flow still works.
