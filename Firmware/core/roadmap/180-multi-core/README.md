# Phase 180 — Multiple Core variants

[← Backlog index](../README.md) · [Long-form roadmap](../../IMPLEMENTATION_ROADMAP.md)

**Status:** ⬜ TODO

## Goal

Move physical Port facts into real board Devicetree and prove higher layers are board-independent.

## Depends on

[Phase 170 — Discovery](../170-discovery/README.md)

## Visible result

Common higher layers build for two Core variants without C3-specific branches.

## Tasks

1. ⬜ [TASK-180-01 — Define the Spaghetti Port binding](TASK-180-01-define-the-spaghetti-port-binding.md)
2. ⬜ [TASK-180-02 — Validate the Port binding](TASK-180-02-validate-the-port-binding.md)
3. ⬜ [TASK-180-03 — Create the first real Spaghetti board skeleton](TASK-180-03-create-the-first-real-spaghetti-board-skeleton.md)
4. ⬜ [TASK-180-04 — Move verified hardware facts into board DTS](TASK-180-04-move-verified-hardware-facts-into-board-dts.md)
5. ⬜ [TASK-180-05 — Enumerate Devicetree Ports](TASK-180-05-enumerate-devicetree-ports.md)
6. ⬜ [TASK-180-06 — Build and test the first real Core board](TASK-180-06-build-and-test-the-first-real-core-board.md)
7. ⬜ [TASK-180-07 — Build a second Core variant](TASK-180-07-build-a-second-core-variant.md)

## Phase completion gate

- [ ] Real custom board builds/boots.
- [ ] Port catalog comes from Devicetree instances.
- [ ] Hardcoded C3 Port controller label is removed.
- [ ] Two variant builds exercise different port capabilities/counts.
- [ ] Manager/Runtime/Data/module APIs are unchanged between targets.
