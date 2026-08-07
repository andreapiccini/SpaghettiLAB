# TASK-160-06 — Queue temperature for a fixed development topic

**Status:** ⬜ TODO  
**Phase:** 160 — MQTT  
**Depends on:** [TASK-160-05](TASK-160-05-implement-the-mqtt-worker-and-client-state.md)  
**Estimated scope:** Small

---

## Goal

Complete **Queue temperature for a fixed development topic** and produce this focused outcome:

One fixed topic payload.

---

## Open

`subsys/services/mqtt/mqtt.c` and `subsys/data/data.c`.

---

## Write / Modify

Create one bounded outbound `k_msgq`. Make Data's MQTT subscriber format/copy one temperature payload and enqueue with a defined nonblocking/full policy. Publish it to one fixed development topic from the MQTT thread.

> [!WARNING]
> TEMPORARY SHORTCUT
>
> The fixed broker/topic is intentionally temporary and will be removed in [TASK-160-08](TASK-160-08-move-mqtt-settings-into-config.md).


---

## Why

Network and Data independently work.

---

## Called / used by

Core starts; Data subscriber publishes.

---

## Trigger

DATA ARRIVAL/NETWORK EVENT.

---

## Invocation mechanism

ZBUS SUBSCRIBER + K_MSGQ + THREAD

---

## Execution context

Subscriber copies; dedicated MQTT thread performs I/O.

---

## Calls / dependencies

Zephyr MQTT/socket/poll APIs.

---

## Inputs

Temperature sample.

---

## Outputs

One fixed topic payload.

---

## Errors to handle

Queue full, disconnected, DNS/connect/publish error, keepalive.

---

## Do NOT implement yet

- Dynamic topics, TLS, QoS matrix, offline history

---

## Zephyr note

The message queue decouples zbus consumption from socket work. MQTT connection and publish processing belongs to its thread, not a zbus callback.

---

## Steps

- [ ] Open only `subsys/services/mqtt/mqtt.c` and `subsys/data/data.c`.
- [ ] Create one bounded outbound `k_msgq`.
- [ ] Make Data's MQTT subscriber format/copy one temperature payload and enqueue with a defined nonblocking/full policy. Publish it to one fixed development topic from the MQTT thread.
- [ ] Handle only these realistic errors: Queue full, disconnected, DNS/connect/publish error, keepalive.
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

Local broker subscriber receives value; stop/restart broker and verify
Runtime sampling continues plus MQTT reconnects.

---

## Expected result

Known sample reaches known topic without blocking Runtime.

---

## Completion checklist

- [ ] Required documentation or implementation file changed as specified
- [ ] Named type, function, configuration, or test exists
- [ ] Build succeeds when this task requires a build
- [ ] Task-specific test passes
- [ ] No unrelated functionality was added

---

## Commit suggestion

`mqtt: queue temperature for a fixed development topic`

---

## Next task

[TASK-160-07](TASK-160-07-integrate-and-test-fixed-topic-mqtt.md) — Integrate and test fixed-topic MQTT
