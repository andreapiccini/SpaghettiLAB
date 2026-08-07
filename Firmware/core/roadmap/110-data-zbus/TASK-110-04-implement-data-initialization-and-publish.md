# TASK-110-04 — Implement Data initialization and publish

**Status:** ⬜ TODO  
**Phase:** 110 — Data / zbus  
**Depends on:** [TASK-110-03](TASK-110-03-define-the-temperature-channel-and-subscribers.md)  
**Estimated scope:** Small

---

## Goal

Complete **Implement Data initialization and publish** and produce this focused outcome:

Independent copy to both subscribers.

---

## Open

`subsys/data/data.c` and `CMakeLists.txt`.

---

## Write / Modify

Implement `spaghetti_data_init()` and `spaghetti_data_publish_temperature()` using `zbus_chan_pub()` with the caller-provided timeout. Add `data.c` to CMake and propagate validation/publish errors.

---

## Why

Runtime automation should not silently miss an intermediate sample.

---

## Called / used by

Publisher and two test consumer threads.

---

## Trigger

DATA ARRIVAL.

---

## Invocation mechanism

ZBUS PUBLISH

---

## Execution context

Publisher thread; consumers' dedicated test threads.

---

## Calls / dependencies

`zbus_chan_pub`, `zbus_sub_wait_msg`.

---

## Inputs

Sample copy.

---

## Outputs

Independent copy to both subscribers.

---

## Errors to handle

Validator rejection, allocation/pool exhaustion, timeout.

---

## Do NOT implement yet

- MQTT or Communication consumers

---

## Zephyr note

The channel copies a bounded message. Do not publish a borrowed stack pointer for asynchronous consumption.

---

## Steps

- [ ] Open only `subsys/data/data.c` and `CMakeLists.txt`.
- [ ] Implement `spaghetti_data_init()` and `spaghetti_data_publish_temperature()` using `zbus_chan_pub()` with the caller-provided timeout.
- [ ] Add `data.c` to CMake and propagate validation/publish errors.
- [ ] Handle only these realistic errors: Validator rejection, allocation/pool exhaustion, timeout.
- [ ] Confirm no item from **Do NOT implement yet** was added
- [ ] Run the task test and compare it with **Expected result**

---

## Build

YES — `make build`

---

## Flash

NO

---

## Test

Publish one fake sample; each test consumer logs same sequence/value once.

---

## Expected result

Two independent receipts.

---

## Completion checklist

- [ ] Required documentation or implementation file changed as specified
- [ ] Named type, function, configuration, or test exists
- [ ] Build succeeds when this task requires a build
- [ ] Task-specific test passes
- [ ] No unrelated functionality was added

---

## Commit suggestion

`data: implement data initialization and publish`

---

## Next task

[TASK-110-05](TASK-110-05-publish-real-manager-samples.md) — Publish real Manager samples
