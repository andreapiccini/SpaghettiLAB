# Phase 130 — Relay + Runtime V1

[← Backlog index](../README.md) · [Long-form roadmap](../../IMPLEMENTATION_ROADMAP.md)

**Status:** ⬜ TODO

## Goal

Add one real relay command and one explicit temperature threshold rule.

## Depends on

[Phase 120 — Runtime V0](../120-runtime-v0/README.md)

## Visible result

A temperature above 25 °C commands the configured relay.

## Tasks

1. ⬜ [TASK-130-01 — Define the Relay command contract](TASK-130-01-define-the-relay-command-contract.md)
2. ⬜ [TASK-130-02 — Implement safe Relay lifecycle and SET](TASK-130-02-implement-safe-relay-lifecycle-and-set.md)
3. ⬜ [TASK-130-03 — Register and build the Relay driver](TASK-130-03-register-and-build-the-relay-driver.md)
4. ⬜ [TASK-130-04 — Route commands through Module Manager](TASK-130-04-route-commands-through-module-manager.md)
5. ⬜ [TASK-130-05 — Define one threshold rule](TASK-130-05-define-one-threshold-rule.md)
6. ⬜ [TASK-130-06 — Evaluate temperature in the Runtime thread](TASK-130-06-evaluate-temperature-in-the-runtime-thread.md)
7. ⬜ [TASK-130-07 — Test the Relay threshold and safe state](TASK-130-07-test-the-relay-threshold-and-safe-state.md)

## Phase completion gate

- [ ] Relay hardware facts are verified.
- [ ] Manual OFF/ON/OFF works safely.
- [ ] Runtime receives Data in its thread.
- [ ] 24.9/25.0/25.1 produce expected actions.
- [ ] Runtime contains no GPIO/module-specific protocol.
