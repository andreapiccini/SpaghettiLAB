# TASK-160-05 — Implement the MQTT worker and client state

**Status:** ⬜ TODO  
**Phase:** 160 — MQTT  
**Depends on:** [TASK-160-04](TASK-160-04-define-the-mqtt-service-api.md)  
**Estimated scope:** Medium

---

## Goal

Complete **Implement the MQTT worker and client state** and produce this focused outcome:

One fixed topic payload.

---

## Open

Create `subsys/services/mqtt/mqtt.c` and update `prj.conf`.

---

## Write / Modify

Enable `CONFIG_MQTT_LIB=y`. Implement one MQTT-owned thread with fixed client buffers, socket poll/input/live processing, reconnect backoff, and explicit connected/error state. Do not block Data producers.

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

ZBUS MSG SUBSCRIBER -> K_MSGQ -> MQTT THREAD -> socket.

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

## Steps

- [ ] Open only Create `subsys/services/mqtt/mqtt.c` and update `prj.conf`.
- [ ] Enable `CONFIG_MQTT_LIB=y`.
- [ ] Implement one MQTT-owned thread with fixed client buffers, socket poll/input/live processing, reconnect backoff, and explicit connected/error state.
- [ ] Do not block Data producers.
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

`mqtt: implement the mqtt worker and client state`

---

## Next task

[TASK-160-06](TASK-160-06-queue-temperature-for-a-fixed-development-topic.md) — Queue temperature for a fixed development topic
