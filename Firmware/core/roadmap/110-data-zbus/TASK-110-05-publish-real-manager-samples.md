# TASK-110-05 — Publish real Manager samples

**Status:** ⬜ TODO  
**Phase:** 110 — Data / zbus  
**Depends on:** [TASK-110-04](TASK-110-04-implement-data-initialization-and-publish.md)  
**Estimated scope:** Small

---

## Goal

Complete **Publish real Manager samples** and produce this focused outcome:

Logger and test subscriber receive identical sequence.

---

## Open

The Manager acquisition call site and `subsys/data/data.c`.

---

## Write / Modify

After a successful Manager read, construct `spaghetti_temperature_sample`, add timestamp and sequence, and call the Data publish API. Remove direct sensor-driver printing; the logger subscriber becomes the display owner.

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

- [ ] Open only The Manager acquisition call site and `subsys/data/data.c`.
- [ ] After a successful Manager read, construct `spaghetti_temperature_sample`, add timestamp and sequence, and call the Data publish API.
- [ ] Remove direct sensor-driver printing
- [ ] the logger subscriber becomes the display owner.
- [ ] Handle only these realistic errors: Read failure publishes no valid sample; publish failure logged.
- [ ] Confirm no item from **Do NOT implement yet** was added
- [ ] Run the task test and compare it with **Expected result**

---

## Build

NO

---

## Flash

NO

---

## Test

Run for multiple samples; verify monotonically increasing sequence in both
consumers; intentionally pause a consumer to test pool/backpressure policy.

---

## Expected result

Every accepted test sample is independently delivered.

---

## Completion checklist

- [ ] Required documentation or implementation file changed as specified
- [ ] Named type, function, configuration, or test exists
- [ ] Build succeeds when this task requires a build
- [ ] Task-specific test passes
- [ ] No unrelated functionality was added

---

## Commit suggestion

`data: publish real manager samples`

---

## Next task

[TASK-110-06](TASK-110-06-test-zbus-fan-out-and-backpressure.md) — Test zbus fan-out and backpressure
