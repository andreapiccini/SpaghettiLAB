# Phase 090 — Internal Config

[← Backlog index](../README.md) · [Long-form roadmap](../../IMPLEMENTATION_ROADMAP.md)

**Status:** ⬜ TODO

## Goal

Represent and apply the smallest validated internal product configuration.

## Depends on

[Phase 080 — Runtime-removable SHT40](../080-runtime-removable-sht40/README.md)

## Visible result

A C configuration applies Port 0, SHT40 address, and the sample period.

## Tasks

1. ⬜ [TASK-090-01 — Define the internal Config model](TASK-090-01-define-the-internal-config-model.md)
2. ⬜ [TASK-090-02 — Make Config string ownership explicit](TASK-090-02-make-config-string-ownership-explicit.md)
3. ⬜ [TASK-090-03 — Implement Config validation](TASK-090-03-implement-config-validation.md)
4. ⬜ [TASK-090-04 — Implement Config apply](TASK-090-04-implement-config-apply.md)
5. ⬜ [TASK-090-05 — Add and apply one hardcoded C config](TASK-090-05-add-and-apply-one-hardcoded-c-config.md)
6. ⬜ [TASK-090-06 — Test Config validation and apply](TASK-090-06-test-config-validation-and-apply.md)

## Phase completion gate

- [ ] Config is bounded and owns/controls string lifetime.
- [ ] Validation occurs before Manager calls.
- [ ] Main does not directly configure Manager.
- [ ] Hardcoded C config produces a real sample.
- [ ] Invalid config is rejected with exact error.
