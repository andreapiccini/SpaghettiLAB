# TASK-110-06 — Test zbus fan-out and backpressure

**Status:** ⬜ TODO  
**Phase:** 110 — Data / zbus  
**Depends on:** [TASK-110-05](TASK-110-05-publish-real-manager-samples.md)  
**Estimated scope:** Small

---

## Goal

Complete **Test zbus fan-out and backpressure** and produce this focused outcome:

Logger and test subscriber receive identical sequence.

---

## Open

`subsys/data/data.c`, subscriber loops/test harness, and the serial console.

---

## Write / Modify

Receive the same sequence in logger and test subscribers. Fill or stall one bounded subscriber path deliberately and verify the selected timeout/error policy without blocking forever.

---

## Why

Runtime/MQTT must consume Data, not SHT40 APIs.

---

## Called / used by

Temporary main acquisition loop; subscribers.

---

## Trigger

DATA ARRIVAL.

---

## Invocation mechanism

DIRECT CALL then ZBUS PUBLISH.

---

## Execution context

Main publisher, subscriber threads.

---

## Calls / dependencies

Manager read and Data publish.

---

## Inputs

Real sample.

---

## Outputs

Logger and test subscriber receive identical sequence.

---

## Errors to handle

Read failure publishes no valid sample; publish failure logged.

---

## Do NOT implement yet

- MQTT, PC streaming, generic Data routing

---

## Steps

- [ ] Open only `subsys/data/data.c`, subscriber loops/test harness, and the serial console.
- [ ] Receive the same sequence in logger and test subscribers. Fill or stall one bounded subscriber path deliberately and verify the selected timeout/error policy without blocking forever.
- [ ] Handle only these realistic errors: Read failure publishes no valid sample; publish failure logged.
- [ ] Confirm no item from **Do NOT implement yet** was added
- [ ] Run the task test and compare it with **Expected result**

---

## Build

YES — `make build`

---

## Flash

YES — run `make flash`, then `make screen`; pass `PORT=...` only when needed.

---

## Test

Run for multiple samples; verify monotonically increasing sequence in both
consumers; intentionally pause a consumer to test pool/backpressure policy.

---

## Expected result

One real sample reaches two consumers with matching sequence and defined full-buffer behavior.

---

## Completion checklist

- [ ] Required documentation or implementation file changed as specified
- [ ] Named type, function, configuration, or test exists
- [ ] Build succeeds when this task requires a build
- [ ] Task-specific test passes
- [ ] No unrelated functionality was added

---

## Commit suggestion

`data: test zbus fan-out and backpressure`

---

## Next task

[TASK-120-01](../120-runtime-v0/TASK-120-01-define-the-runtime-sampling-task-api.md) — Define the Runtime sampling task API
