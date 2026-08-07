# TASK-110-03 — Define the temperature channel and subscribers

**Status:** ⬜ TODO  
**Phase:** 110 — Data / zbus  
**Depends on:** [TASK-110-02](TASK-110-02-enable-zbus-message-subscribers.md)  
**Estimated scope:** Small

---

## Goal

Complete **Define the temperature channel and subscribers** and produce this focused outcome:

Independent copy to both subscribers.

---

## Open

`subsys/data/data.c`.

---

## Write / Modify

Define `spaghetti_temperature_chan` with `ZBUS_CHAN_DEFINE` and two `ZBUS_MSG_SUBSCRIBER_DEFINE` observers: one logger and one test consumer. Use the exact sample type, a small validator, and a bounded initial value.

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

ZBUS PUBLISH / ZBUS MESSAGE SUBSCRIBER.

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

## Steps

- [ ] Open only `subsys/data/data.c`.
- [ ] Define `spaghetti_temperature_chan` with `ZBUS_CHAN_DEFINE` and two `ZBUS_MSG_SUBSCRIBER_DEFINE` observers: one logger and one test consumer.
- [ ] Use the exact sample type, a small validator, and a bounded initial value.
- [ ] Handle only these realistic errors: Validator rejection, allocation/pool exhaustion, timeout.
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

`data: define the temperature channel and subscribers`

---

## Next task

[TASK-110-04](TASK-110-04-implement-data-initialization-and-publish.md) — Implement Data initialization and publish
