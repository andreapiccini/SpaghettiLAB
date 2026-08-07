# TASK-030-08 — Test Port success and invalid IDs

**Status:** ⬜ TODO  
**Phase:** 030 — Port  
**Depends on:** [TASK-030-07](TASK-030-07-initialize-port-from-core.md)  
**Estimated scope:** Small

---

## Goal

Complete **Test Port success and invalid IDs** and produce this focused outcome:

`Port 0: I2C ready`-equivalent log.

---

## Open

`subsys/port/port.c`, `subsys/core/core.c`, and the serial console.

---

## Write / Modify

Exercise Port 0 and one out-of-range ID through the public API. Verify Port 0 is ready and the invalid ID returns `NULL` without dereferencing it. Temporarily test the disabled-controller failure path without committing that test overlay change.

---

## Why

SHT40 should not be added until Port reports the real controller ready.

---

## Called / used by

Build and Core.

---

## Trigger

BOOT.

---

## Invocation mechanism

BUILD TIME then DIRECT CALL.

---

## Execution context

Main thread.

---

## Calls / dependencies

Port init/count/capability.

---

## Inputs

Enabled controller from Milestone 2.

---

## Outputs

`Port 0: I2C ready`-equivalent log.

---

## Errors to handle

Propagate negative Port error; no silent READY.

---

## Do NOT implement yet

- SHT40 or registry

---

## Steps

- [ ] Open only `subsys/port/port.c`, `subsys/core/core.c`, and the serial console.
- [ ] Exercise Port 0 and one out-of-range ID through the public API.
- [ ] Verify Port 0 is ready and the invalid ID returns `NULL` without dereferencing it. Temporarily test the disabled-controller failure path without committing that test overlay change.
- [ ] Handle only these realistic errors: Propagate negative Port error; no silent READY.
- [ ] Confirm no item from **Do NOT implement yet** was added
- [ ] Run the task test and compare it with **Expected result**

---

## Build

YES — `make build`; use `make pristine` only for the temporary overlay failure test.

---

## Flash

YES — use the host-specific workflow in the root `README.md`.

---

## Test

Boot normally, then temporarily disable the controller in a test branch
and confirm Port init fails; restore it immediately.

---

## Expected result

Port 0 reports I2C readiness, invalid lookup fails safely, and Core propagates controller failure.

---

## Completion checklist

- [ ] Required documentation or implementation file changed as specified
- [ ] Named type, function, configuration, or test exists
- [ ] Build succeeds when this task requires a build
- [ ] Task-specific test passes
- [ ] No unrelated functionality was added

---

## Commit suggestion

`port: test port success and invalid ids`

---

## Next task

[TASK-040-01](../040-sht40/TASK-040-01-inspect-the-installed-sht4x-driver.md) — Inspect the installed SHT4x driver
