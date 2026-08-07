# TASK-110-02 — Enable zbus message subscribers

**Status:** ⬜ TODO  
**Phase:** 110 — Data / zbus  
**Depends on:** [TASK-110-01](TASK-110-01-define-the-temperature-sample-message.md)  
**Estimated scope:** Small

---

## Goal

Complete **Enable zbus message subscribers** and produce this focused outcome:

Independent copy to both subscribers.

---

## Open

`prj.conf`.

---

## Write / Modify

Enable `CONFIG_ZBUS=y` and `CONFIG_ZBUS_MSG_SUBSCRIBER=y`. Select only static/fixed message-buffer settings required by the installed Kconfig help; do not enable dynamic allocation by default.

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

## Zephyr note

zbus distributes data from one producer to multiple observers. It is appropriate for samples here, not automatically for lifecycle/control calls.

---

## Steps

- [ ] Open only `prj.conf`.
- [ ] Enable `CONFIG_ZBUS=y` and `CONFIG_ZBUS_MSG_SUBSCRIBER=y`.
- [ ] Select only static/fixed message-buffer settings required by the installed Kconfig help
- [ ] do not enable dynamic allocation by default.
- [ ] Handle only these realistic errors: Validator rejection, allocation/pool exhaustion, timeout.
- [ ] Confirm no item from **Do NOT implement yet** was added
- [ ] Run the task test and compare it with **Expected result**

---

## Build

YES — `make pristine`

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

`data: enable zbus message subscribers`

---

## Next task

[TASK-110-03](TASK-110-03-define-the-temperature-channel-and-subscribers.md) — Define the temperature channel and subscribers
