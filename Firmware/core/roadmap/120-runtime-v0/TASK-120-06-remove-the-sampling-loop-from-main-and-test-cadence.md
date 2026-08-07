# TASK-120-06 — Remove the sampling loop from main and test cadence

**Status:** ⬜ TODO  
**Phase:** 120 — Runtime V0  
**Depends on:** [TASK-120-05](TASK-120-05-integrate-runtime-with-core-and-config.md)  
**Estimated scope:** Small

---

## Goal

Complete **Remove the sampling loop from main and test cadence** and produce this focused outcome:

Logger sample each second with short main.

---

## Open

`src/main.c` and the serial console.

---

## Write / Modify

Remove Manager read, Data publish, and periodic sleep from `main`; leave only Core boot/error handling. Flash and observe sequence/timestamps for at least ten samples, then verify stop prevents further samples.

---

## Why

Main must stop owning application behavior.

---

## Called / used by

Core/Config/Runtime.

---

## Trigger

BOOT then periodic timer.

---

## Invocation mechanism

DIRECT CALL then K_TIMER/K_SEM/THREAD.

---

## Execution context

Main for setup; Runtime thread for reads.

---

## Calls / dependencies

Config -> Runtime; Runtime -> Manager -> Data.

---

## Inputs

Internal config period/module.

---

## Outputs

Logger sample each second with short main.

---

## Errors to handle

Runtime start failure must make boot degraded/error.

---

## Do NOT implement yet

- Relay threshold or CBOR

---

## Steps

- [ ] Open only `src/main.c` and the serial console.
- [ ] Remove Manager read, Data publish, and periodic sleep from `main`
- [ ] leave only Core boot/error handling. Flash and observe sequence/timestamps for at least ten samples, then verify stop prevents further samples.
- [ ] Handle only these realistic errors: Runtime start failure must make boot degraded/error.
- [ ] Confirm no item from **Do NOT implement yet** was added
- [ ] Run the task test and compare it with **Expected result**

---

## Build

YES — `make build`

---

## Flash

YES — use the host-specific workflow in the root `README.md`.

---

## Test

Measure ten timestamps; stop Runtime via temporary test and verify reads stop.

---

## Expected result

Runtime publishes one real sample about every 1000 ms while `main` performs no periodic work.

---

## Completion checklist

- [ ] Required documentation or implementation file changed as specified
- [ ] Named type, function, configuration, or test exists
- [ ] Build succeeds when this task requires a build
- [ ] Task-specific test passes
- [ ] No unrelated functionality was added

---

## Commit suggestion

`runtime: remove the sampling loop from main and test cadence`

---

## Next task

[TASK-130-01](../130-relay-runtime-v1/TASK-130-01-define-the-relay-command-contract.md) — Define the Relay command contract
